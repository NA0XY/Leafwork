"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const KEY = "leafwork:privacy-badge-dismissed";

export const PrivacyBadge = () => {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setDismissed(sessionStorage.getItem(KEY) === "1");
  }, []);

  const shouldShow = useMemo(() => pathname.startsWith("/tools") && pathname !== "/", [pathname]);

  if (!shouldShow || dismissed) {
    return null;
  }

  return (
    <div className="sticky top-[62px] z-20 border-b border-green-900 bg-green-950 px-4 py-1.5 text-xs text-green-100">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <p className="flex items-center gap-2">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          All processing happens locally in your browser - zero uploads
        </p>

        <div className="flex items-center gap-2">
          <Link href="/about#privacy" className="underline underline-offset-2">
            Learn more
          </Link>
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-green-200/70"
            aria-label="Dismiss privacy notice"
            onClick={() => {
              sessionStorage.setItem(KEY, "1");
              setDismissed(true);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
