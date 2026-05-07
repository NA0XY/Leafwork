"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/auth/supabase-client";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("load_session_error", error);
      }
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    void loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string): Promise<{ error?: string }> => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`
      }
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  };

  const signOut = async (): Promise<void> => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return useMemo(
    () => ({
      user,
      session,
      loading,
      signIn,
      signOut,
      isAuthenticated: Boolean(session?.user)
    }),
    [loading, session, user]
  );
};
