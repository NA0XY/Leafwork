"use client";

export const PrivacyChoicesButton = () => (
  <button
    type="button"
    className="flex min-h-10 items-center justify-center rounded-brutal border-2 border-ink bg-paper px-3 py-2 font-semibold"
    onClick={() => window.dispatchEvent(new Event("leafwork:open-analytics-consent"))}
  >
    Choices
  </button>
);
