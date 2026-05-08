import { NextRequest, NextResponse } from "next/server";

import { getUser } from "@/lib/auth/supabase-server";
import { anonGroqLimiter, applyRateLimit, authAiLimiter } from "@/lib/rate-limit/upstash";
import { jsonError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

type GroqAccess =
  | {
      ok: true;
      userId: string | null;
    }
  | {
      ok: false;
      response: NextResponse;
    };

const resolveClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  const forwardedIp = forwarded?.split(",")[0]?.trim();
  return forwardedIp || request.ip || "0.0.0.0";
};

export const enforceGroqAccess = async (
  request: NextRequest,
  requestId: string,
  featureKey: string
): Promise<GroqAccess> => {
  const ip = resolveClientIp(request);
  logger.debug("ai.access.check.start", {
    requestId,
    featureKey,
    path: request.nextUrl.pathname,
    method: request.method,
    ip
  });

  const user = await getUser();

  if (user) {
    const rate = await applyRateLimit(authAiLimiter, `${featureKey}:user:${user.id}`);
    logger.debug("ai.access.check.authenticated", {
      requestId,
      featureKey,
      userId: user.id,
      remaining: rate.remaining,
      reset: rate.reset,
      success: rate.success
    });

    if (!rate.success) {
      logger.warn("ai.access.blocked.authenticated", {
        requestId,
        featureKey,
        userId: user.id
      });
      return {
        ok: false,
        response: jsonError(429, {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many AI requests. Please retry later.",
          requestId
        })
      };
    }

    logger.info("ai.access.allowed", {
      requestId,
      featureKey,
      userId: user.id,
      ip
    });

    return {
      ok: true,
      userId: user.id
    };
  }

  const freeUsage = await applyRateLimit(anonGroqLimiter, `${featureKey}:ip:${ip}`);
  logger.debug("ai.access.check.anonymous", {
    requestId,
    featureKey,
    ip,
    remaining: freeUsage.remaining,
    reset: freeUsage.reset,
    success: freeUsage.success
  });

  if (!freeUsage.success) {
    logger.warn("ai.access.blocked.anonymous", {
      requestId,
      featureKey,
      ip
    });
    return {
      ok: false,
      response: jsonError(401, {
        code: "AUTH_REQUIRED",
        message: "Free AI usage limit reached for this IP (3/day). Sign in to continue.",
        requestId
      })
    };
  }

  logger.info("ai.access.allowed", {
    requestId,
    featureKey,
    userId: null,
    ip
  });

  return {
    ok: true,
    userId: null
  };
};
