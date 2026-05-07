"use client";

import { useEffect, useMemo } from "react";

import { useCanvasStore } from "@/store/canvas-store";

const PENDING_META_KEY = "leafwork:pending-files-meta";

const toBrowserFile = (name: string, bytes: Uint8Array): File =>
  new File([bytes], name, {
    type: "application/pdf",
    lastModified: Date.now()
  });

export const usePendingFiles = (): File[] => {
  const files = useCanvasStore((state) => state.files);
  const pendingFileNames = useCanvasStore((state) => state.pendingFileNames);
  const setPendingFileNames = useCanvasStore((state) => state.setPendingFileNames);

  useEffect(() => {
    if (pendingFileNames.length || typeof window === "undefined") {
      return;
    }

    const raw = sessionStorage.getItem(PENDING_META_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setPendingFileNames(parsed);
      }
    } catch {
      sessionStorage.removeItem(PENDING_META_KEY);
    }
  }, [pendingFileNames.length, setPendingFileNames]);

  return useMemo(() => {
    if (!files.length) {
      return [];
    }

    const filtered = pendingFileNames.length
      ? files.filter((file) => pendingFileNames.includes(file.name))
      : files;

    return filtered.map((file) => toBrowserFile(file.name, file.bytes));
  }, [files, pendingFileNames]);
};
