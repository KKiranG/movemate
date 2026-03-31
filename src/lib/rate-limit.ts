import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

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

export async function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const ratelimit = getRedisRateLimit(limit, windowMs);

  if (!ratelimit) {
    return inMemoryRateLimit(key, limit, windowMs);
  }

  const { success, reset } = await ratelimit.limit(key);

  return {
    allowed: success,
    retryAfterMs: success ? 0 : Math.max(0, reset - Date.now()),
  };
}
