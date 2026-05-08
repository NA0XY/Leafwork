import { createServerClient } from "@supabase/ssr";
import type { Session, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
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

const getSupabaseEnv = (): { url: string; anonKey: string } => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return { url, anonKey };
};

export const getSupabaseServerClient = () => {
  const cookieStore = cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: SupabaseCookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: SupabaseCookieOptions) {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      }
    }
  });
};

export const getSession = async (): Promise<Session | null> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    logger.error("auth.server.get_session_failed", {
      error
    });
    return null;
  }

  logger.debug("auth.server.get_session_success", {
    hasSession: Boolean(data.session),
    userId: data.session?.user?.id ?? null
  });

  return data.session;
};

export const getUser = async (): Promise<User | null> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    if (error.message !== "Auth session missing!") {
      logger.error("auth.server.get_user_failed", {
        error
      });
    } else {
      logger.debug("auth.server.get_user_missing_session");
    }
    return null;
  }

  logger.debug("auth.server.get_user_success", {
    userId: data.user?.id ?? null
  });

  return data.user;
};
