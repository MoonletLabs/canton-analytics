/**
 * Network Data API Client
 *
 * Single data source for analytics.
 * All requests go through server-side proxy to avoid CORS and hide upstream.
 */

// All requests go through our server-side API route
const API_BASE = "/api/data";

/** Cache GET responses to reduce load and respect rate limits */
const CACHE_TTL_MS = 120_000; // 2 minutes
const responseCache = new Map<string, { data: unknown; at: number }>();
const inFlight = new Map<string, Promise<unknown>>();

function cacheKey(path: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) return path;
  const q = new URLSearchParams(params).toString();
  return `${path}?${q}`;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Raw response types from api.ccexplorer.io (minimal shapes we use).
 * Full mapping to app types happens in scan-api layer.
 */
export interface CcexplorerValidatorsResponse {
  validator_licenses?: Array<{
    payload?: {
      validator?: string;
      sponsor?: string;
      lastActiveAt?: string;
      faucetState?: { numCouponsMissed?: number };
      metadata?: { version?: string; contactPoint?: string };
    };
  }>;
}

export interface CcexplorerConsensusResponse {
  latest_block?: {
    signed_header?: {
      header?: { height?: string };
    };
  };
  validators?: Array<{
    address?: string;
    pub_key?: unknown;
    voting_power?: string;
    proposer_priority?: string;
  }>;
}

export interface CcexplorerSuperValidatorsResponse {
  svs?: Array<{
    validatorId?: string;
    [key: string]: unknown;
  }>;
}

export interface CcexplorerUpdatesResponse {
  updates?: Array<{
    recordTime?: string;
    updateId?: string;
    migrationId?: string;
    workflowId?: string;
    synchronizerId?: string;
    effectiveAt?: string;
    eventCount?: number;
    balanceChanges?: unknown[];
    partiesSummarized?: string[];
    submittingPartyId?: string;
    createdAt?: string;
    updatedAt?: string;
    amuletTransferred?: unknown;
    [key: string]: unknown;
  }>;
  nextToken?: string;
}

export interface CcexplorerGovernanceResponse {
  openVotes?: unknown[];
  [key: string]: unknown;
}

export interface CcexplorerOverviewResponse {
  consensusHeight?: number | string;
  activeValidators?: number;
  superValidators?: number;
  supply?: unknown;
  featuredApps?: unknown;
  openVotes?: unknown;
  [key: string]: unknown;
}

/**
 * Fetch JSON from CC Explorer API with caching and in-flight deduplication.
 */
async function fetchJson<T>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const key = cacheKey(path, params);
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data as T;
  }
  let pending = inFlight.get(key);
  if (!pending) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : "";
    const url = `${API_BASE}${path}${query}`;
    pending = fetch(url, {
      headers: { Accept: "application/json" }
    }).then(async (res) => {
      if (!res.ok) {
        const err: ApiError = {
          message: res.statusText || `HTTP ${res.status}`,
          status: res.status
        };
        try {
          const body = await res.json().catch(() => ({}));
          if (body && typeof body.message === "string")
            err.message = body.message;
        } catch {
          // ignore
        }
        throw err;
      }
      return res.json();
    });
    inFlight.set(key, pending);
    pending
      .then((data) => {
        responseCache.set(key, { data, at: Date.now() });
      })
      .finally(() => {
        inFlight.delete(key);
      });
  }
  return pending as Promise<T>;
}

/**
 * CC Explorer API client – all reads go to api.ccexplorer.io (or proxy).
 */
export const ccexplorerApi = {
  /** GET /api/validators */
  getValidators(): Promise<CcexplorerValidatorsResponse> {
    return fetchJson<CcexplorerValidatorsResponse>("/api/validators");
  },

  /** GET /api/consensus */
  getConsensus(): Promise<CcexplorerConsensusResponse> {
    return fetchJson<CcexplorerConsensusResponse>("/api/consensus");
  },

  /** GET /api/super-validators */
  getSuperValidators(): Promise<CcexplorerSuperValidatorsResponse> {
    return fetchJson<CcexplorerSuperValidatorsResponse>(
      "/api/super-validators"
    );
  },

  /** GET /api/v2/updates?limit=...&nextToken=... */
  getUpdates(options?: {
    limit?: number;
    nextToken?: string;
  }): Promise<CcexplorerUpdatesResponse> {
    const params: Record<string, string> = {};
    if (options?.limit != null) params.limit = String(options.limit);
    if (options?.nextToken) params.nextToken = options.nextToken;
    return fetchJson<CcexplorerUpdatesResponse>(
      "/api/v2/updates",
      Object.keys(params).length ? params : undefined
    );
  },

  /** GET /api/v2/updates/:updateId/:recordTime — single update detail (recordTime URL-encoded). */
  getUpdateDetail(
    updateId: string,
    recordTime: string
  ): Promise<Record<string, unknown>> {
    const encoded = encodeURIComponent(recordTime);
    return fetchJson<Record<string, unknown>>(
      `/api/v2/updates/${updateId}/${encoded}`
    );
  },

  /** GET /api/governance */
  getGovernance(): Promise<CcexplorerGovernanceResponse> {
    return fetchJson<CcexplorerGovernanceResponse>("/api/governance");
  },

  /** GET /api/overview */
  getOverview(): Promise<CcexplorerOverviewResponse> {
    return fetchJson<CcexplorerOverviewResponse>("/api/overview");
  }
};

/** Clear response cache (e.g. for testing or refresh). */
export function clearCcexplorerCache(): void {
  responseCache.clear();
}
