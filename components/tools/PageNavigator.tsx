"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type PageNavigatorProps = {
  pageNumber: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

const clampPage = (value: number, pageCount: number): number => {
  const max = Math.max(1, pageCount);
  return Math.max(1, Math.min(max, value));
};

export const PageNavigator = ({ pageNumber, pageCount, onPageChange }: PageNavigatorProps) => {
  const [draft, setDraft] = useState(String(pageNumber));

  useEffect(() => {
    setDraft(String(pageNumber));
  }, [pageNumber]);

  const commitDraft = () => {
    const parsed = Number.parseInt(draft, 10);
    if (!Number.isFinite(parsed)) {
      setDraft(String(pageNumber));
      return;
    }

    const next = clampPage(parsed, pageCount);
    onPageChange(next);
    setDraft(String(next));
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button type="button" size="sm" variant="secondary" disabled={pageNumber <= 1} onClick={() => onPageChange(pageNumber - 1)}>
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>

      <p className="text-sm font-semibold">
        Page {pageNumber} / {pageCount}
      </p>

      <div className="flex items-center gap-1">
        <span className="text-xs font-semibold text-muted">Go</span>
        <Input
          type="number"
          min={1}
          max={Math.max(1, pageCount)}
          inputMode="numeric"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitDraft();
            }
          }}
          className="h-8 w-20 px-2 py-1 text-center text-xs shadow-none"
          aria-label="Go to page"
        />
      </div>

      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pageNumber >= Math.max(1, pageCount)}
        onClick={() => onPageChange(pageNumber + 1)}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};
