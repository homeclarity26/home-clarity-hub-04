/**
 * Simple in-memory sliding-window rate limiter for edge functions.
 * Tracks requests by IP. Resets when the function cold-starts.
 */

const buckets = new Map<string, number[]>();

/**
 * Returns true if the request should be ALLOWED, false if rate-limited.
 * @param key  - Identifier (usually IP address)
 * @param windowMs - Sliding window duration in ms (default 60s)
 * @param maxRequests - Max requests per window (default 20)
 */
export function rateLimit(
  key: string,
  maxRequests = 20,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const timestamps = buckets.get(key) ?? [];

  // Evict expired entries
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= maxRequests) {
    buckets.set(key, valid);
    return false; // rate-limited
  }

  valid.push(now);
  buckets.set(key, valid);

  // Housekeeping: clear stale keys every 1000 entries
  if (buckets.size > 1000) {
    for (const [k, v] of buckets) {
      const fresh = v.filter((t) => now - t < windowMs);
      if (fresh.length === 0) buckets.delete(k);
      else buckets.set(k, fresh);
    }
  }

  return true; // allowed
}

export function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimitResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again shortly." }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    },
  );
}
