import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { applyRateLimit, authLimiter, generalLimiter } from "@/lib/rate-limit/upstash";
import { refreshSupabaseSession } from "@/lib/auth/middleware-helpers";
import { resolveClientIp } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

type LimitConfig = {
  limit: number;
  remaining: number;
  reset: number;
};

const DEFAULT_LIMIT_CONFIG: LimitConfig = {
  limit: 30,
  remaining: 30,
  reset: Math.ceil((Date.now() + 60_000) / 1000)
};

const buildRateHeaders = (config: LimitConfig): HeadersInit => ({
  "X-RateLimit-Limit": config.limit.toString(),
  "X-RateLimit-Remaining": config.remaining.toString(),
  "X-RateLimit-Reset": config.reset.toString()
});

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const requestId = nanoid(12);
  const pathname = request.nextUrl.pathname;
  const clientIp = resolveClientIp(request);

  try {
    logger.debug("proxy.request.start", {
      requestId,
      method: request.method,
      path: pathname,
      ip: clientIp,
      userAgent: request.headers.get("user-agent")
    });

    const { response, userId } = await refreshSupabaseSession(request);
    const isAuthenticated = Boolean(userId);
    const isApiRoute = pathname.startsWith("/api");
    const isAiRoute = pathname.startsWith("/api/ai");

    let rateContext = { ...DEFAULT_LIMIT_CONFIG };

    if (isApiRoute && !isAiRoute) {
      const identifier = isAuthenticated
        ? `user:${userId}:${pathname}`
        : `ip:${clientIp}:${pathname}`;

      const selectedLimiter = isAuthenticated ? authLimiter : generalLimiter;
      const result = await applyRateLimit(selectedLimiter, identifier);

      rateContext = {
        limit: isAuthenticated ? 100 : 30,
        remaining: Math.max(0, result.remaining),
        reset: Math.ceil(result.reset / 1000)
      };

      logger.debug("proxy.rate_limit.checked", {
        requestId,
        path: pathname,
        isAuthenticated,
        remaining: rateContext.remaining,
        limit: rateContext.limit,
        reset: rateContext.reset,
        success: result.success
      });

      if (!result.success) {
        const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
        logger.warn("proxy.rate_limit.blocked", {
          requestId,
          path: pathname,
          retryAfterSeconds,
          isAuthenticated
        });
        return NextResponse.json(
          {
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Too many requests. Please retry later.",
              requestId
            }
          },
          {
            status: 429,
            headers: {
              ...buildRateHeaders(rateContext),
              "Retry-After": retryAfterSeconds.toString(),
              "x-request-id": requestId
            }
          }
        );
      }
    }

    if (pathname.startsWith("/dashboard") && !isAuthenticated) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", pathname);
      logger.info("proxy.dashboard.redirect_login", {
        requestId,
        path: pathname,
        redirectTo: redirectUrl.toString()
      });
      return NextResponse.redirect(redirectUrl);
    }

    response.headers.set("x-request-id", requestId);

    if (isApiRoute) {
      const headers = buildRateHeaders(rateContext);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, String(value));
      });
    }

    const latency = Date.now() - startedAt;
    logger.info("proxy.request.complete", {
      requestId,
      method: request.method,
      path: pathname,
      userId: userId ?? null,
      isApiRoute,
      isAiRoute,
      status: response.status,
      latencyMs: latency
    });

    return response;
  } catch (error) {
    logger.error("proxy.request.error", {
      requestId,
      method: request.method,
      path: pathname,
      ip: clientIp,
      error
    });
    return NextResponse.json(
      {
        error: {
          code: "MIDDLEWARE_FAILURE",
          message: "Unable to process request",
          requestId
        }
      },
      {
        status: 500,
        headers: {
          "x-request-id": requestId
        }
      }
    );
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
