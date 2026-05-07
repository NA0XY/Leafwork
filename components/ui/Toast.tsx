"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { ToastItem } from "@/hooks/useToast";
import { cn } from "@/lib/utils/cn";

type ToastProps = {
  item: ToastItem;
  onDismiss: (id: string) => void;
};

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info
} as const;

const toneClasses = {
  success: "border-green-700 bg-green-50",
  error: "border-red-700 bg-red-100",
  info: "border-blue-700 bg-blue-50"
} as const;

export const Toast = ({ item, onDismiss }: ToastProps) => {
  const [dragX, setDragX] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const startX = useRef<number | null>(null);
  const Icon = icons[item.variant];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDismissed(true);
      window.setTimeout(() => onDismiss(item.id), 180);
    }, item.durationMs);

    return () => window.clearTimeout(timer);
  }, [item.durationMs, item.id, onDismiss]);

  const cardClassName = useMemo(
    () =>
      cn(
        "pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-brutal border-2 p-3 shadow-brutal",
        "transition-transform duration-150",
        toneClasses[item.variant]
      ),
    [item.variant]
  );

  return (
    <article
      className={cardClassName}
      role="status"
      aria-live="polite"
      style={{
        transform: dismissed ? "translateX(120%)" : `translateX(${Math.max(0, dragX)}px)`
      }}
      onPointerDown={(event) => {
        startX.current = event.clientX;
      }}
      onPointerMove={(event) => {
        if (startX.current === null) {
          return;
        }
        setDragX(Math.max(0, event.clientX - startX.current));
      }}
      onPointerUp={() => {
        if (dragX > 80) {
          setDismissed(true);
          window.setTimeout(() => onDismiss(item.id), 150);
          return;
        }
        startX.current = null;
        setDragX(0);
      }}
      onPointerCancel={() => {
        startX.current = null;
        setDragX(0);
      }}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-5 w-5", item.variant === "success" && "text-green-700", item.variant === "error" && "text-red-700", item.variant === "info" && "text-blue-700")} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{item.title}</p>
          {item.message ? <p className="text-sm text-muted">{item.message}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(item.id)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-brutal border-2 border-ink bg-surface"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div
        className="toast-countdown absolute bottom-0 left-0 h-[3px] bg-ink/30"
        style={{ animationDuration: `${item.durationMs}ms` }}
        aria-hidden="true"
      />
    </article>
  );
};

export const ToastList = ({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) => (
  <div className="flex w-full max-w-md flex-col gap-2">
    {toasts.map((toast) => (
      <Toast key={toast.id} item={toast} onDismiss={onDismiss} />
    ))}
  </div>
);
