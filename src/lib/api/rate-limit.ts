import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if a request is within rate limits
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = { windowMs: 60 * 1000, maxRequests: 60 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const ip = getClientIP(request);
  const now = Date.now();
  const { windowMs, maxRequests } = config;

  const current = rateLimitStore.get(ip);

  if (!current || now > current.resetTime) {
    // First request or window expired
    const resetTime = now + windowMs;
    rateLimitStore.set(ip, { count: 1, resetTime });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime,
    };
  }

  if (current.count >= maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }

  // Increment counter
  current.count++;

  return {
    allowed: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");

  if (cfConnectingIP) return cfConnectingIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}

/**
 * Clean up expired entries from the rate limit store
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();

  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(
  allowed: boolean,
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    "X-RateLimit-Limit": "60",
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
    "X-RateLimit-Reset-After": Math.ceil(
      (resetTime - Date.now()) / 1000
    ).toString(),
  };
}
