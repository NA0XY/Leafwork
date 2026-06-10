"use client";

import { useCallback, useState, type DragEvent, type ReactNode } from "react";

import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils/cn";
import { checkMagicBytes } from "@/lib/validations/file";
import { getSandboxNativeFiles, SANDBOX_FILE_DRAG_MIME } from "@/store/sandbox-store";

type ReplaceFileDropTargetProps = {
  children: ReactNode;
  onFile: (file: File) => void | Promise<void>;
  label?: string;
};

const isPdfFile = async (file: File): Promise<boolean> => {
  const chunk = await file.slice(0, 1024).arrayBuffer();
  return checkMagicBytes(chunk);
};

export const ReplaceFileDropTarget = ({
  children,
  onFile,
  label = "Drop a replacement PDF here from storage or your desktop."
}: ReplaceFileDropTargetProps) => {
  const toast = useToast();
  const [isDropActive, setIsDropActive] = useState(false);

  const getDroppedFiles = useCallback(
    (event: DragEvent<HTMLDivElement>): File[] => {
      const sandboxPayload = event.dataTransfer.getData(SANDBOX_FILE_DRAG_MIME);
      if (!sandboxPayload) {
        return Array.from(event.dataTransfer.files ?? []);
      }

      try {
        const fileIds = JSON.parse(sandboxPayload) as string[];
        return getSandboxNativeFiles(fileIds);
      } catch {
        toast.error("Unable to read sandbox files", "Try dragging the file from storage again.");
        return [];
      }
    },
    [toast]
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDropActive(false);

      const [file] = getDroppedFiles(event);
      if (!file) {
        return;
      }

      if (!(await isPdfFile(file))) {
        toast.error("File skipped", "This tool accepts PDF files only.");
        return;
      }

      await onFile(file);
    },
    [getDroppedFiles, onFile, toast]
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsDropActive(false);
  }, []);

  return (
    <div
      className="space-y-4"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setIsDropActive(true);
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={cn(
          "rounded-brutal border-2 border-dashed border-ink bg-surface px-3 py-2 text-sm font-semibold text-muted transition-colors",
          isDropActive && "border-primary bg-green-100 text-ink"
        )}
      >
        {label}
      </div>
      {children}
    </div>
  );
};
