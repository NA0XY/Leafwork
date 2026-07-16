"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { ZoomablePreview } from "@/components/tools/ZoomablePreview";
import { renderThumbnail } from "@/lib/pdf/renderer";
import { cn } from "@/lib/utils/cn";

type LazyPdfThumbnailProps = {
  bytes: Uint8Array;
  pageNumber: number;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  imageClassName?: string;
  rotationDeg?: number;
  onClick?: () => void;
  children?: ReactNode;
};

export const LazyPdfThumbnail = ({
  bytes,
  pageNumber,
  selected = false,
  disabled = false,
  className,
  imageClassName,
  rotationDeg,
  onClick,
  children
}: LazyPdfThumbnailProps) => {
  const itemRef = useRef<HTMLButtonElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setShouldRender(false);
    setThumbnail(null);
    setFailed(false);
  }, [bytes, pageNumber]);

  useEffect(() => {
    const node = itemRef.current;
    if (!node || shouldRender) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "1000px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender || thumbnail || failed) {
      return;
    }

    let cancelled = false;
    void renderThumbnail(bytes, pageNumber)
      .then((nextThumbnail) => {
        if (!cancelled) {
          setThumbnail(nextThumbnail);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bytes, failed, pageNumber, shouldRender, thumbnail]);

  return (
    <button
      ref={itemRef}
      type="button"
      disabled={disabled}
      className={cn(
        "relative rounded-brutal border-2 p-2 text-left",
        selected ? "border-primary bg-green-100" : "border-ink bg-paper",
        disabled && "cursor-default",
        className
      )}
      onClick={onClick}
    >
      {thumbnail ? (
        <ZoomablePreview
          src={thumbnail}
          alt={`Page ${pageNumber}`}
          className="mb-2"
          imageClassName={cn("h-auto w-full rounded-brutal border border-ink", imageClassName)}
          rotationDeg={rotationDeg}
        />
      ) : (
        <div className="mb-2 flex aspect-[3/4] w-full items-center justify-center rounded-brutal border border-ink bg-surface text-xs font-semibold text-muted">
          {failed ? "Preview unavailable" : shouldRender ? "Rendering preview" : "Preview queued"}
        </div>
      )}
      {children}
    </button>
  );
};
