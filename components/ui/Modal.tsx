"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export const Modal = ({ open, title, onClose, children }: ModalProps) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 160);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusables[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const tabbables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!tabbables.length) {
        event.preventDefault();
        return;
      }

      const first = tabbables[0] as HTMLElement;
      const last = tabbables[tabbables.length - 1] as HTMLElement;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-150",
        visible ? "opacity-100" : "opacity-0"
      )}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className={cn(
          "w-full max-w-2xl rounded-brutal border-2 border-ink bg-surface shadow-brutal transition-all duration-150",
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
};
