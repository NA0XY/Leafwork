import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";
import { logger } from "@/lib/utils/logger";

export type RateLimitResult = {
  success: boolean;
  reset: number;
  remaining: number;
};

type RateLimitWindow = `${number} ${"s" | "m" | "h" | "d"}`;
type LimitOutcome = Pick<RateLimitResult, "success" | "reset" | "remaining">;
type LimiterLike = {
  limit: (identifier: string) => Promise<LimitOutcome> | LimitOutcome;
};

const parseWindowMs = (window: RateLimitWindow): number => {
  const [amountText, unit] = window.split(" ") as [string, "s" | "m" | "h" | "d"];
  const amount = Number(amountText);
  const multiplier = unit === "s" ? 1_000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return Math.max(1_000, amount * multiplier);
};

const createLocalLimiter = (maxRequests: number, window: RateLimitWindow): LimiterLike => {
  const windowMs = parseWindowMs(window);
  const buckets = new Map<string, { count: number; reset: number }>();

  return {
    limit(identifier: string): LimitOutcome {
      const now = Date.now();
      const current = buckets.get(identifier);
      const bucket = current && current.reset > now ? current : { count: 0, reset: now + windowMs };
      bucket.count += 1;
      buckets.set(identifier, bucket);

      if (buckets.size > 10_000) {
        for (const [key, value] of buckets) {
          if (value.reset <= now) {
            buckets.delete(key);
          }
        }
      }

      return {
        success: bucket.count <= maxRequests,
        remaining: Math.max(0, maxRequests - bucket.count),
        reset: bucket.reset
      };
    }
  };
};

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";

const redis =
  upstashUrl && upstashToken
    ? new Redis({
        url: upstashUrl,
        token: upstashToken
      })
    : null;

const createLimiter = (maxRequests: number, window: RateLimitWindow = "1 m"): LimiterLike => {
  const fallback = createLocalLimiter(maxRequests, window);

  if (!redis) {
    logger.warn("rate_limit.local_fallback_enabled", {
      reason: "upstash_not_configured",
      maxRequests,
      window
    });
    return fallback;
  }

  const remote = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxRequests, window),
    analytics: true,
    prefix: `leafwork:${maxRequests}:${window.replaceAll(" ", "")}`
  });

  return {
    async limit(identifier: string): Promise<LimitOutcome> {
      try {
        return await remote.limit(identifier);
      } catch (error) {
        logger.error("rate_limit.remote_error_local_fallback", {
          identifier,
          error
        });
        return fallback.limit(identifier);
      }
    }
  };
};

export const generalLimiter = createLimiter(30);
export const authLimiter = createLimiter(100);
export const aiLimiter = createLimiter(10);
export const authAiLimiter = createLimiter(30);
export const anonGroqLimiter = createLimiter(3, "1 d");

export const applyRateLimit = async (limiter: LimiterLike | null, identifier: string): Promise<RateLimitResult> => {
  if (!limiter) {
    logger.error("rate_limit.disabled_default_deny", {
      identifier
    });
    return {
      success: false,
      remaining: 0,
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
    logger.error("rate_limit.error_fail_closed", {
      identifier,
      error
    });
    return {
      success: false,
      remaining: 0,
      reset: Date.now() + 60_000
    };
  }
};
