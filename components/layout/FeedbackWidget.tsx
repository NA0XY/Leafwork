"use client";

import { MessageSquare, Send, Star, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils/cn";

const categories = [
  { value: "bug", label: "Bug" },
  { value: "idea", label: "Idea" },
  { value: "quality", label: "Output quality" },
  { value: "confusing", label: "Confusing" },
  { value: "privacy_access", label: "Access" },
  { value: "privacy_correction", label: "Correction" },
  { value: "privacy_erasure", label: "Erasure" },
  { value: "consent_withdrawal", label: "Withdraw" },
  { value: "grievance", label: "Grievance" },
  { value: "other", label: "Other" }
] as const;

type FeedbackCategory = (typeof categories)[number]["value"];

const categoryFromHash: Record<string, FeedbackCategory> = {
  "#feedback": "other",
  "#feedback-access": "privacy_access",
  "#feedback-correction": "privacy_correction",
  "#feedback-erasure": "privacy_erasure",
  "#feedback-consent-withdrawal": "consent_withdrawal",
  "#feedback-grievance": "grievance"
};

export const FeedbackWidget = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const remainingCharacters = useMemo(() => 2000 - message.length, [message.length]);
  const submitLabel = !authLoading && !isAuthenticated ? "Send anonymously" : "Send feedback";
  const userEmail = user?.email ?? null;

  useEffect(() => {
    const openFromHash = () => {
      const nextCategory = categoryFromHash[window.location.hash];
      if (!nextCategory) {
        return;
      }
      setCategory(nextCategory);
      setOpen(true);
      setStatus("idle");
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  const resetForm = () => {
    setCategory("bug");
    setMessage("");
    setEmail("");
    setRating(null);
    setWebsite("");
    setErrorMessage("");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category,
          message,
          email,
          rating,
          pagePath: pathname,
          source: "feedback_widget",
          website
        })
      });

      const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;

      if (!response.ok) {
        throw new Error(body?.error?.message ?? "Unable to save feedback");
      }

      setStatus("success");
      if (typeof window !== "undefined" && window.location.hash.startsWith("#feedback")) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      resetForm();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to save feedback");
    }
  };

  const closeModal = () => {
    setOpen(false);
    setStatus("idle");
    setErrorMessage("");
    if (typeof window !== "undefined" && window.location.hash.startsWith("#feedback")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  return (
    <>
      <button
        type="button"
        className="fixed bottom-4 left-4 z-30 inline-flex items-center gap-2 rounded-brutal border-2 border-ink bg-accent px-3 py-2 text-sm font-bold shadow-brutal transition-all duration-75 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:bottom-5 sm:left-5"
        onClick={() => {
          setOpen(true);
          setStatus("idle");
        }}
        aria-label="Send feedback"
      >
        <MessageSquare className="h-4 w-4" />
        Feedback
      </button>

      <Modal open={open} title="Send feedback" onClose={closeModal}>
        {status === "success" ? (
          <div className="space-y-4">
            <div className="rounded-brutal border-2 border-green-800 bg-green-50 p-4">
              <p className="font-bold text-green-900">Feedback saved</p>
              <p className="mt-1 text-sm text-green-900">Thanks. It is stored in Supabase and ready to review.</p>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={closeModal}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="rounded-brutal border-2 border-ink bg-paper p-3">
              {authLoading ? (
                <p className="text-sm font-semibold text-muted">Checking login status...</p>
              ) : isAuthenticated ? (
                <p className="text-sm font-semibold">
                  Sending as {userEmail ? <span className="text-primary">{userEmail}</span> : "your logged-in account"}.
                </p>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold">You are not logged in.</p>
                    <p className="text-xs text-muted">Feedback will be sent anonymously unless you log in first.</p>
                  </div>
                  <Button href="/login" variant="secondary" size="sm">
                    Login
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-5">
              {categories.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={cn(
                    "min-h-10 rounded-brutal border-2 border-ink bg-paper px-2 py-2 text-sm font-bold",
                    category === item.value && "bg-accent"
                  )}
                  onClick={() => setCategory(item.value)}
                  aria-pressed={category === item.value}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label htmlFor="feedback-message" className="text-sm font-bold">
                What should we fix, improve, or review?
              </label>
              <textarea
                id="feedback-message"
                required
                minLength={10}
                maxLength={2000}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-36 w-full resize-y rounded-brutal border-2 border-ink bg-surface px-3 py-2 text-sm shadow-brutal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="For privacy or grievance requests, include the request type and enough detail to identify the account or feedback record. Do not attach or paste private PDFs."
              />
              <p className="text-xs text-muted">{remainingCharacters} characters left</p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <label htmlFor="feedback-email" className="text-sm font-bold">
                  Email for follow-up
                </label>
                <Input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Optional"
                />
              </div>

              <fieldset className="space-y-2">
                <legend className="text-sm font-bold">Rating</legend>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={cn(
                        "inline-flex h-10 w-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper",
                        rating !== null && value <= rating && "bg-accent"
                      )}
                      onClick={() => setRating(value)}
                      aria-label={`Rate ${value} out of 5`}
                      aria-pressed={rating === value}
                    >
                      <Star className={cn("h-4 w-4", rating !== null && value <= rating && "fill-current")} />
                    </button>
                  ))}
                  {rating ? (
                    <button
                      type="button"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper"
                      onClick={() => setRating(null)}
                      aria-label="Clear rating"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </fieldset>
            </div>

            <div className="hidden" aria-hidden="true">
              <label htmlFor="feedback-website">Website</label>
              <input
                id="feedback-website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </div>

            {status === "error" ? (
              <p className="rounded-brutal border-2 border-red-800 bg-red-100 px-3 py-2 text-sm font-semibold text-red-900" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={status === "submitting"}>
                <Send className="h-4 w-4" />
                {submitLabel}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};
