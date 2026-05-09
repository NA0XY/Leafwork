import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/utils/logger";

export type RateLimitResult = {
  success: boolean;
  reset: number;
  remaining: number;
};

type LimiterLike = Pick<Ratelimit, "limit">;

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";

const redis =
  upstashUrl && upstashToken
    ? new Redis({
        url: upstashUrl,
        token: upstashToken
      })
    : null;

const createLimiter = (maxRequests: number, window: `${number} ${"s" | "m" | "h" | "d"}` = "1 m") =>
  redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(maxRequests, window),
        analytics: true,
        prefix: `leafwork:${maxRequests}:${window.replaceAll(" ", "")}`
      })
    : null;

export const generalLimiter = createLimiter(30);
export const authLimiter = createLimiter(100);
export const aiLimiter = createLimiter(10);
export const authAiLimiter = createLimiter(30);
export const anonGroqLimiter = createLimiter(3, "1 d");

export const applyRateLimit = async (
  limiter: LimiterLike | null,
  identifier: string
): Promise<RateLimitResult> => {
  if (!limiter) {
    logger.warn("rate_limit.disabled_fallback_allow", {
      identifier
    });
    return {
      success: true,
      remaining: Number.MAX_SAFE_INTEGER,
      reset: Date.now() + 60_000
    };
  }

  try {
    const result = await limiter.limit(identifier);
    logger.debug("rate_limit.checked", {
      identifier,
      success: result.success,
      remaining: result.remaining,
      reset: result.reset
    });
    return {
      success: result.success,
      reset: result.reset,
      remaining: result.remaining
    };
  } catch (error) {
    logger.error("rate_limit.error_fallback_allow", {
      identifier,
      error
    });
    return {
      success: true,
      remaining: Number.MAX_SAFE_INTEGER,
      reset: Date.now() + 60_000
    };
  }
};
