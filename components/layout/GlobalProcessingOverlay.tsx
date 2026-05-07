"use client";

import { ProcessingOverlay } from "@/components/tools/ProcessingOverlay";
import { useCanvasStore } from "@/store/canvas-store";

export const GlobalProcessingOverlay = () => {
  const isVisible = useCanvasStore((state) => state.isProcessing);
  const progress = useCanvasStore((state) => state.processingProgress);
  const message = useCanvasStore((state) => state.processingMessage);
  const setProcessing = useCanvasStore((state) => state.setProcessing);

  return (
    <ProcessingOverlay
      isVisible={isVisible}
      progress={progress}
      message={message}
      onCancel={() => setProcessing(false, 0, "")}
    />
  );
};
