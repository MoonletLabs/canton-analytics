import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_API_URL =
  process.env.UPSTREAM_API_URL || "https://api.ccexplorer.io";

// Cache responses in memory (server-side only)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 120_000; // 2 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join("/");
    const searchParams = request.nextUrl.searchParams.toString();
    const cacheKey = searchParams ? `${path}?${searchParams}` : path;

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    // Build external URL
    const externalUrl = searchParams
      ? `${UPSTREAM_API_URL}/${path}?${searchParams}`
      : `${UPSTREAM_API_URL}/${path}`;

    // No next.revalidate — responses can exceed Next.js 2MB cache limit; we use in-memory cache below
    const response = await fetch(externalUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "canton-analytics/1.0"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: response.statusText || `HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Update cache
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[data-proxy]", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 502 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join("/");
    const body = await request.json();

    const response = await fetch(`${UPSTREAM_API_URL}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "canton-analytics/1.0"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: response.statusText || `HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[data-proxy]", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 502 }
    );
  }
}
