"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase-client";

const emailSchema = z.string().email();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const canSubmit = useMemo(() => cooldown <= 0 && !loading, [cooldown, loading]);

  const sendMagicLink = async () => {
    setLoading(true);
    setError(null);

    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setError("Enter a valid email address.");
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setStatus("sent");
    setCooldown(60);
    setLoading(false);
  };

  const signInGoogle = async () => {
    setError(null);
    setLoading(true);

    const supabase = getSupabaseBrowserClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`
      }
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md">
      <Card className="space-y-4 bg-surface">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-sm text-muted">Use magic link authentication. No password stored in Leafwork.</p>

        <label className="space-y-1 text-sm font-medium">
          Email
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <Button onClick={() => void sendMagicLink()} loading={loading} disabled={!canSubmit} className="w-full">
          {status === "sent" ? `Resend in ${cooldown}s` : "Send magic link"}
        </Button>

        <Button variant="secondary" onClick={() => void signInGoogle()} loading={loading} className="w-full">
          Continue with Google
        </Button>

        {status === "sent" ? (
          <p className="rounded-brutal border-2 border-ink bg-green-100 px-3 py-2 text-sm">
            Check your email for a sign-in link.
          </p>
        ) : null}

        {error ? <p className="text-sm text-red-900">{error}</p> : null}
      </Card>
    </div>
  );
}
