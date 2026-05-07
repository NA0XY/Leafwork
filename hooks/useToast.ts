"use client";

import { useCallback, useMemo } from "react";
import { nanoid } from "nanoid";
import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  durationMs: number;
};

type ToastStore = {
  toasts: ToastItem[];
  queue: ToastItem[];
  pushToast: (toast: ToastItem) => void;
  dismissToast: (id: string) => void;
};

const MAX_VISIBLE = 3;
const DEFAULT_DURATION_MS = 4200;

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  queue: [],
  pushToast: (toast) =>
    set((state) => {
      if (state.toasts.length >= MAX_VISIBLE) {
        return {
          ...state,
          queue: [...state.queue, toast]
        };
      }

      return {
        ...state,
        toasts: [toast, ...state.toasts]
      };
    }),
  dismissToast: (id) =>
    set((state) => {
      const nextToasts = state.toasts.filter((item) => item.id !== id);
      if (!state.queue.length) {
        return {
          ...state,
          toasts: nextToasts
        };
      }

      const [nextFromQueue, ...restQueue] = state.queue;
      return {
        ...state,
        toasts: nextFromQueue ? [...nextToasts, nextFromQueue] : nextToasts,
        queue: restQueue
      };
    })
}));

export const useToast = () => {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismissToast);
  const pushToast = useToastStore((state) => state.pushToast);

  const push = useCallback(
    (variant: ToastVariant, title: string, message?: string, durationMs = DEFAULT_DURATION_MS) => {
      pushToast({
        id: nanoid(),
        variant,
        title,
        message,
        durationMs
      });
    },
    [pushToast]
  );

  const api = useMemo(
    () => ({
      toasts,
      dismiss,
      success: (title: string, message?: string, durationMs?: number) => push("success", title, message, durationMs),
      error: (title: string, message?: string, durationMs?: number) => push("error", title, message, durationMs),
      info: (title: string, message?: string, durationMs?: number) => push("info", title, message, durationMs)
    }),
    [dismiss, push, toasts]
  );

  return api;
};
