import { NextRequest } from "next/server";

interface RateLimitRecord {
  tokens: number;
  lastRefill: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(ttlMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.lastRefill > ttlMs) {
      rateLimitMap.delete(key);
    }
  }
}

export interface RateLimitConfig {
  maxTokens?: number; // Maximum burst tokens (default: 60)
  refillRate?: number; // Tokens refilled per second (default: 1 token / sec = 60/min)
}

export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig = {}
): {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
} {
  const maxTokens = config.maxTokens ?? 60;
  const refillRate = config.refillRate ?? 1; // 1 token per second

  // Extract client IP
  const forwarded = req.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "127.0.0.1";

  const now = Date.now();
  cleanupStaleEntries(60 * 1000);

  let record = rateLimitMap.get(ip);

  if (!record) {
    record = {
      tokens: maxTokens - 1,
      lastRefill: now,
    };
    rateLimitMap.set(ip, record);
    return {
      success: true,
      limit: maxTokens,
      remaining: record.tokens,
      reset: Math.ceil((maxTokens - record.tokens) / refillRate),
    };
  }

  // Refill tokens based on elapsed time
  const elapsedSeconds = (now - record.lastRefill) / 1000;
  record.tokens = Math.min(
    maxTokens,
    record.tokens + elapsedSeconds * refillRate
  );
  record.lastRefill = now;

  if (record.tokens >= 1) {
    record.tokens -= 1;
    return {
      success: true,
      limit: maxTokens,
      remaining: Math.floor(record.tokens),
      reset: Math.ceil((maxTokens - record.tokens) / refillRate),
    };
  }

  // Rate limit exceeded
  const retryAfter = Math.ceil((1 - record.tokens) / refillRate);
  return {
    success: false,
    limit: maxTokens,
    remaining: 0,
    reset: retryAfter,
  };
}
