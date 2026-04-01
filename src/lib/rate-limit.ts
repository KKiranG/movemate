import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { hasSupabaseAdminEnv } from "@/lib/env";
import { captureAppMessage } from "@/lib/sentry";
import { createAdminClient } from "@/lib/supabase/admin";

const windows = new Map<string, number[]>();
const ratelimitCache = new Map<string, Ratelimit>();

let redisClient: Redis | null | undefined;

function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = null;
    return redisClient;
  }

  redisClient = Redis.fromEnv();
  return redisClient;
}

function toUpstashWindow(windowMs: number) {
  return `${Math.max(1, Math.ceil(windowMs / 1000))} s` as Parameters<
    typeof Ratelimit.slidingWindow
  >[1];
}

function inMemoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const start = now - windowMs;
  const timestamps = (windows.get(key) ?? []).filter((stamp) => stamp > start);

  if (timestamps.length >= limit) {
    return {
      allowed: false,
      retryAfterMs: Math.max(0, timestamps[0] + windowMs - now),
    };
  }

  timestamps.push(now);
  windows.set(key, timestamps);

  return { allowed: true, retryAfterMs: 0 };
}

function getRedisRateLimit(limit: number, windowMs: number) {
  const redis = getRedisClient();

  if (!redis) {
    return null;
  }

  const cacheKey = `${limit}:${windowMs}`;
  const existing = ratelimitCache.get(cacheKey);

  if (existing) {
    return existing;
  }

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, toUpstashWindow(windowMs)),
  });
  ratelimitCache.set(cacheKey, ratelimit);
  return ratelimit;
}

async function getRateLimitOverride(key: string) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("rate_limit_overrides")
    .select("override_limit, window_ms")
    .eq("actor_value", key)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data
    ? {
        limit: data.override_limit,
        windowMs: data.window_ms,
      }
    : null;
}

export async function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const override = await getRateLimitOverride(key);
  const effectiveLimit = override?.limit ?? limit;
  const effectiveWindowMs = override?.windowMs ?? windowMs;
  const ratelimit = getRedisRateLimit(effectiveLimit, effectiveWindowMs);

  if (!ratelimit) {
    const result = inMemoryRateLimit(key, effectiveLimit, effectiveWindowMs);

    if (!result.allowed) {
      captureAppMessage("Rate limit blocked request", {
        feature: "rate_limit",
        action: "blocked_in_memory",
        tags: { key },
      });
    }

    return result;
  }

  const { success, reset } = await ratelimit.limit(key);

  if (!success) {
    captureAppMessage("Rate limit blocked request", {
      feature: "rate_limit",
      action: "blocked_redis",
      tags: { key },
    });
  }

  return {
    allowed: success,
    retryAfterMs: success ? 0 : Math.max(0, reset - Date.now()),
  };
}
