import { NextRequest, NextResponse } from "next/server";

import { getUser } from "@/lib/auth/supabase-server";
import { anonGroqLimiter, applyRateLimit, authAiLimiter } from "@/lib/rate-limit/upstash";
import { jsonError } from "@/lib/utils/api";

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
  const user = await getUser();

  if (user) {
    const rate = await applyRateLimit(authAiLimiter, `${featureKey}:user:${user.id}`);
    if (!rate.success) {
      return {
        ok: false,
        response: jsonError(429, {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many AI requests. Please retry later.",
          requestId
        })
      };
    }

    return {
      ok: true,
      userId: user.id
    };
  }

  const ip = resolveClientIp(request);
  const freeUsage = await applyRateLimit(anonGroqLimiter, `${featureKey}:ip:${ip}`);
  if (!freeUsage.success) {
    return {
      ok: false,
      response: jsonError(401, {
        code: "AUTH_REQUIRED",
        message: "Free AI usage limit reached for this IP (3/day). Sign in to continue.",
        requestId
      })
    };
  }

  return {
    ok: true,
    userId: null
  };
};
