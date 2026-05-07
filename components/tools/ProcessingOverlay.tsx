"use client";

import { Leaf, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

type ProcessingOverlayProps = {
  isVisible: boolean;
  progress: number;
  message: string;
  onCancel?: () => void;
};

export const ProcessingOverlay = ({ isVisible, progress, message, onCancel }: ProcessingOverlayProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper/90 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-sm space-y-4 bg-surface p-5 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-green-100 processing-gear">
          <Leaf className="h-7 w-7 text-primary" />
        </div>

        <div className="space-y-1">
          <p className="text-base font-bold">Processing</p>
          <p className="text-sm text-muted">{message || "Working on your file..."}</p>
        </div>

        <ProgressBar value={progress} animated showLabel size="lg" />
        <p className="text-sm font-semibold">{Math.max(0, Math.min(100, Math.round(progress)))}%</p>

        {onCancel ? (
          <div className="flex justify-center">
            <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
};
