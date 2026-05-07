import { createServerClient } from "@supabase/ssr";
import type { Session, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

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
    console.error("get_session_failed", error);
    return null;
  }
  return data.session;
};

export const getUser = async (): Promise<User | null> => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("get_user_failed", error);
    return null;
  }
  return data.user;
};
