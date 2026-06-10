"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BarChart3, X } from "lucide-react";
import { useEffect, useState } from "react";

const CONSENT_KEY = "leafwork:analytics-consent";

type AnalyticsChoice = "granted" | "denied";

export const AnalyticsConsent = () => {
  const [mounted, setMounted] = useState(false);
  const [choice, setChoice] = useState<AnalyticsChoice | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    setChoice(stored === "granted" || stored === "denied" ? stored : null);
    setPanelOpen(stored !== "granted" && stored !== "denied");
    setMounted(true);

    const openPanel = () => setPanelOpen(true);
    window.addEventListener("leafwork:open-analytics-consent", openPanel);
    return () => window.removeEventListener("leafwork:open-analytics-consent", openPanel);
  }, []);

  const saveChoice = (nextChoice: AnalyticsChoice) => {
    window.localStorage.setItem(CONSENT_KEY, nextChoice);
    setChoice(nextChoice);
    setPanelOpen(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {choice === "granted" ? (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}

      {panelOpen ? (
        <div className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-2">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-brutal border-2 border-ink bg-green-100">
                <BarChart3 className="h-4 w-4 text-primary" />
              </span>
              <div>
                <p className="font-bold">Analytics choice</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Leafwork can use Vercel Analytics and Speed Insights to measure page performance. PDF contents are not collected. Analytics stays off unless you allow it.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-brutal border-2 border-ink bg-paper"
              onClick={() => setPanelOpen(false)}
              aria-label="Close analytics choices"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="min-h-10 rounded-brutal border-2 border-ink bg-accent px-3 py-2 text-sm font-bold shadow-brutal-sm"
              onClick={() => saveChoice("granted")}
            >
              Allow analytics
            </button>
            <button
              type="button"
              className="min-h-10 rounded-brutal border-2 border-ink bg-paper px-3 py-2 text-sm font-bold"
              onClick={() => saveChoice("denied")}
            >
              Keep off
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};
