import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

import { applyRateLimit, authLimiter, generalLimiter } from "@/lib/rate-limit/upstash";
import { refreshSupabaseSession } from "@/lib/auth/middleware-helpers";

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

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const startedAt = Date.now();
  const requestId = nanoid(12);
  const pathname = request.nextUrl.pathname;

  try {
    const { response, userId } = await refreshSupabaseSession(request);
    const isAuthenticated = Boolean(userId);
    const isApiRoute = pathname.startsWith("/api");
    const isAiRoute = pathname.startsWith("/api/ai");

    let rateContext = { ...DEFAULT_LIMIT_CONFIG };

    if (isApiRoute && !isAiRoute) {
      const identifier = isAuthenticated
        ? `user:${userId}:${pathname}`
        : `ip:${request.ip ?? "0.0.0.0"}:${pathname}`;

      const selectedLimiter = isAuthenticated ? authLimiter : generalLimiter;
      const result = await applyRateLimit(selectedLimiter, identifier);

      rateContext = {
        limit: isAuthenticated ? 100 : 30,
        remaining: Math.max(0, result.remaining),
        reset: Math.ceil(result.reset / 1000)
      };

      if (!result.success) {
        const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
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
      return NextResponse.redirect(redirectUrl);
    }

    response.headers.set("x-request-id", requestId);
    response.headers.set("x-user-id", userId ?? "anonymous");

    if (isApiRoute) {
      const headers = buildRateHeaders(rateContext);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, String(value));
      });
    }

    const latency = Date.now() - startedAt;
    console.warn(
      JSON.stringify({
        method: request.method,
        path: pathname,
        requestId,
        userId: userId ?? null,
        latencyMs: latency
      })
    );

    return response;
  } catch (error) {
    console.error("middleware_error", { requestId, pathname, error });
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
