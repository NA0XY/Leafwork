"use client";

import { X, ZoomIn } from "lucide-react";
import { useState, type MouseEvent } from "react";

import { cn } from "@/lib/utils/cn";

type ZoomablePreviewProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
};

export const ZoomablePreview = ({ src, alt, className, imageClassName }: ZoomablePreviewProps) => {
  const [open, setOpen] = useState(false);

  const openPreview = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setOpen(true);
  };

  const closePreview = (event?: MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    setOpen(false);
  };

  return (
    <>
      <div className={cn("group relative overflow-hidden rounded-brutal", className)}>
        <img src={src} alt={alt} className={cn("block", imageClassName)} />
        <button
          type="button"
          aria-label={`Zoom ${alt}`}
          title="Zoom preview"
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-brutal border-2 border-ink bg-surface opacity-0 shadow-brutal-sm transition-opacity focus:opacity-100 group-hover:opacity-100"
          onClick={openPreview}
        >
          <ZoomIn className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={closePreview}
        >
          <div
            className="relative max-h-[92vh] max-w-[92vw] rounded-brutal border-2 border-ink bg-surface p-3 shadow-brutal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close preview"
              title="Close preview"
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-brutal border-2 border-ink bg-paper shadow-brutal-sm"
              onClick={closePreview}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <img
              src={src}
              alt={alt}
              className="max-h-[86vh] max-w-[86vw] rounded-brutal border border-ink object-contain"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </div>
      ) : null}
    </>
  );
};
