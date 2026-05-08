import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

type SupabaseCookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none" | boolean;
  secure?: boolean;
};

type RefreshSessionResult = {
  response: NextResponse;
  userId: string | null;
};

const getSupabaseEnv = (): { url: string; anonKey: string } | null => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
};

export const refreshSupabaseSession = async (
  request: NextRequest
): Promise<RefreshSessionResult> => {
  const path = request.nextUrl.pathname;
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const env = getSupabaseEnv();
  if (!env) {
    logger.warn("auth.middleware.env_missing", {
      path
    });
    return { response, userId: null };
  }

  const { url, anonKey } = env;
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: SupabaseCookieOptions) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: SupabaseCookieOptions) {
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      }
    }
  });

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    if (error.message !== "Auth session missing!") {
      logger.warn("auth.middleware.refresh_error", {
        path,
        error
      });
    } else {
      logger.debug("auth.middleware.no_session", {
        path
      });
    }
    return { response, userId: null };
  }

  logger.debug("auth.middleware.session_refreshed", {
    path,
    userId: user?.id ?? null
  });

  return {
    response,
    userId: user?.id ?? null
  };
};
