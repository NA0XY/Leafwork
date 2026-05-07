import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type SupabaseCookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none" | boolean;
  secure?: boolean;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  const redirectOnError = () => NextResponse.redirect(new URL("/login?error=auth_failed", request.url));

  if (!code) {
    return redirectOnError();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return redirectOnError();
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));

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

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    console.error("auth_callback_exchange_error", exchangeError);
    return redirectOnError();
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("auth_callback_user_error", userError);
    return redirectOnError();
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: user.user_metadata.full_name ?? user.email ?? null
  });

  if (profileError) {
    console.error("profile_upsert_error", profileError);
  }

  return response;
}
