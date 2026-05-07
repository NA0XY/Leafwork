"use client";

import { ToastList } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

export const ToastViewport = () => {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 w-full max-w-md">
      <ToastList toasts={toasts} onDismiss={dismiss} />
    </div>
  );
};
