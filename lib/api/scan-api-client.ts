/**
 * Canton Network Scan API Client
 * 
 * Direct integration with Canton Network blockchain via Scan API
 * Supports multiple nodes with automatic failover on rate limits
 * 
 * Based on: https://api.cantonnodes.com/docs
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  retryAfter?: number; // Seconds to wait before retry
}

export interface RateLimitInfo {
  remaining: number;
  reset: number; // Unix timestamp
  limit: number;
}

/**
 * Scan API Node Configuration
 */
export interface ScanNode {
  url: string;
  name: string;
  priority: number; // Lower = higher priority
  rateLimitInfo?: RateLimitInfo;
  lastError?: Date;
  consecutiveErrors: number;
}

/**
 * In the browser we proxy via our server to avoid CORS; on the server we call the API directly (with failover).
 */
const getDefaultNodes = (): ScanNode[] => {
  if (typeof window !== 'undefined') {
    // Browser: same-origin proxy (see next.config.js rewrites)
    return [
      {
        url: '/api/scan-proxy',
        name: 'Scan API (proxy)',
        priority: 1,
        consecutiveErrors: 0,
      },
    ];
  }
  // Server: direct API calls with optional failover nodes
  return [
    {
      url: process.env.NEXT_PUBLIC_SCAN_API_NODE_1 || 'https://api.cantonnodes.com',
      name: 'Canton Nodes Primary',
      priority: 1,
      consecutiveErrors: 0,
    },
    {
      url: process.env.NEXT_PUBLIC_SCAN_API_NODE_2 || 'https://scan.global.canton.network.sync.global',
      name: 'Global Synchronizer',
      priority: 2,
      consecutiveErrors: 0,
    },
    ...(process.env.NEXT_PUBLIC_SCAN_API_NODE_3
      ? [
          {
            url: process.env.NEXT_PUBLIC_SCAN_API_NODE_3,
            name: 'Node 3',
            priority: 3,
            consecutiveErrors: 0,
          },
        ]
      : []),
  ];
};

const DEFAULT_NODES = getDefaultNodes();

/** Cache GET responses to avoid duplicate requests and rate limits */
const CACHE_TTL_MS = 120_000; // 2 minutes
const responseCache = new Map<
  string,
  { data: unknown; at: number }
>();
const inFlight = new Map<string, Promise<unknown>>();

function cacheKey(endpoint: string, options?: RequestInit): string {
  const method = (options?.method || 'GET').toUpperCase();
  return method === 'GET' ? endpoint : `${method} ${endpoint}`;
}

/**
 * Scan API Client with rate limiting and failover
 */
export class ScanApiClient {
  private nodes: ScanNode[];
  private currentNodeIndex: number = 0;
  private rateLimitCache: Map<string, RateLimitInfo> = new Map();

  constructor(nodes?: ScanNode[]) {
    this.nodes = nodes || [...DEFAULT_NODES];
    // Sort by priority
    this.nodes.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get the current active node
   */
  private getCurrentNode(): ScanNode {
    return this.nodes[this.currentNodeIndex];
  }

  /**
   * Switch to next available node
   */
  private switchToNextNode(): void {
    const startIndex = this.currentNodeIndex;
    
    do {
      this.currentNodeIndex = (this.currentNodeIndex + 1) % this.nodes.length;
      
      // Check if node is available (not too many consecutive errors)
      const node = this.getCurrentNode();
      if (node.consecutiveErrors < 5) {
        return;
      }
    } while (this.currentNodeIndex !== startIndex);

    // All nodes exhausted, reset errors after delay
    this.nodes.forEach(node => {
      if (node.consecutiveErrors >= 5 && node.lastError) {
        const timeSinceError = Date.now() - node.lastError.getTime();
        if (timeSinceError > 60000) { // 1 minute cooldown
          node.consecutiveErrors = 0;
        }
      }
    });
  }

  /**
   * Check if we're rate limited on current node
   */
  private isRateLimited(node: ScanNode): boolean {
    if (!node.rateLimitInfo) return false;
    
    const now = Date.now() / 1000; // Convert to seconds
    if (now < node.rateLimitInfo.reset) {
      return node.rateLimitInfo.remaining <= 0;
    }
    
    // Rate limit window expired, reset
    node.rateLimitInfo = undefined;
    return false;
  }

  /**
   * Extract rate limit info from response headers
   */
  private extractRateLimitInfo(response: Response): RateLimitInfo | null {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    const limit = response.headers.get('X-RateLimit-Limit');

    if (remaining && reset && limit) {
      return {
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
        limit: parseInt(limit, 10),
      };
    }

    return null;
  }

  /**
   * Generic API fetch with rate limit handling and failover.
   * GET requests are deduplicated (in-flight) and cached for 1 minute.
   */
  async fetch<T>(
    endpoint: string,
    options?: RequestInit,
    retries: number = 3
  ): Promise<T> {
    const method = (options?.method || 'GET').toUpperCase();
    const key = cacheKey(endpoint, options);

    // GET: return cached response if still valid
    if (method === 'GET') {
      const cached = responseCache.get(key);
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        return cached.data as T;
      }
      // GET: reuse in-flight request if one exists
      const pending = inFlight.get(key);
      if (pending) {
        return pending as Promise<T>;
      }
    }

    const promise = this.fetchInner<T>(endpoint, options, retries);
    if (method === 'GET') {
      inFlight.set(key, promise as Promise<unknown>);
      promise
        .then((data) => {
          responseCache.set(key, { data, at: Date.now() });
        })
        .finally(() => {
          inFlight.delete(key);
        });
    }
    return promise;
  }

  private async fetchInner<T>(
    endpoint: string,
    options?: RequestInit,
    retries: number = 3
  ): Promise<T> {
    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      const node = this.getCurrentNode();

      // Check rate limit
      if (this.isRateLimited(node)) {
        const resetTime = node.rateLimitInfo!.reset * 1000;
        const waitTime = resetTime - Date.now();
        
        if (waitTime > 0 && waitTime < 60000) { // Wait max 60 seconds
          console.log(`Rate limited on ${node.name}, waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          // Rate limit too long, switch node
          console.log(`Rate limit too long on ${node.name}, switching node`);
          this.switchToNextNode();
          continue;
        }
      }

      try {
        const url = `${node.url}${endpoint}`;
        const response = await fetch(url, {
          ...options,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        // Update rate limit info
        const rateLimitInfo = this.extractRateLimitInfo(response);
        if (rateLimitInfo) {
          node.rateLimitInfo = rateLimitInfo;
        }

        // Handle rate limit (429)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const error: ApiError = {
            message: `Rate limit exceeded on ${node.name}`,
            status: 429,
            code: 'RATE_LIMIT',
            retryAfter: retryAfter ? parseInt(retryAfter, 10) : 60,
          };

          node.consecutiveErrors++;
          node.lastError = new Date();
          this.switchToNextNode();
          
          if (attempt < retries - 1) {
            console.log(`Rate limited, switching to next node (attempt ${attempt + 1}/${retries})`);
            continue;
          }
          
          throw error;
        }

        // Handle other errors
        if (!response.ok) {
          const error: ApiError = {
            message: `API request failed: ${response.statusText}`,
            status: response.status,
          };

          // Reset consecutive errors on non-rate-limit errors after some time
          if (response.status !== 429) {
            node.consecutiveErrors = 0;
          } else {
            node.consecutiveErrors++;
            node.lastError = new Date();
          }

          // For 5xx errors, try next node
          if (response.status >= 500 && attempt < retries - 1) {
            this.switchToNextNode();
            lastError = error;
            continue;
          }

          throw error;
        }

        // Success - reset error count
        node.consecutiveErrors = 0;

        const data = await response.json();
        return data as T;

      } catch (error) {
        node.consecutiveErrors++;
        node.lastError = new Date();
        lastError = error as ApiError;

        // If it's a network error and we have retries left, try next node
        if (attempt < retries - 1 && !(error as ApiError).status) {
          this.switchToNextNode();
          continue;
        }

        // Last attempt or non-retryable error
        if (attempt === retries - 1) {
          throw error;
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /** Clear response cache (e.g. for testing or forced refresh). */
  static clearCache(): void {
    responseCache.clear();
  }

  /**
   * Get current node status
   */
  getNodeStatus(): Array<{ node: ScanNode; isActive: boolean }> {
    return this.nodes.map((node, index) => ({
      node,
      isActive: index === this.currentNodeIndex,
    }));
  }
}

// Singleton instance
let scanApiClient: ScanApiClient | null = null;

/**
 * Get or create the Scan API client instance
 */
export function getScanApiClient(): ScanApiClient {
  if (!scanApiClient) {
    scanApiClient = new ScanApiClient();
  }
  return scanApiClient;
}
