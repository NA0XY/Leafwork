"use client";

import { useCallback, useMemo, useState } from "react";

import { useToast } from "@/hooks/useToast";
import { compressPDF } from "@/lib/pdf/compress";
import { mergePDFs } from "@/lib/pdf/merge";
import { stripMetadata } from "@/lib/pdf/metadata";
import { rotateAll } from "@/lib/pdf/rotate";
import { extractPages, splitByPages, splitEveryN, type PageRange } from "@/lib/pdf/split";
import { addImageWatermark, addTextWatermark } from "@/lib/pdf/watermark";
import { trackToolActivity } from "@/lib/utils/activity";
import { analytics } from "@/lib/utils/analytics";
import { downloadBlob } from "@/lib/utils/file";
import { logger } from "@/lib/utils/logger";
import { useCanvasStore } from "@/store/canvas-store";
import type { WatermarkOptions } from "@/lib/pdf/types";

type LifecycleOptions<T> = {
  successMessage: string;
  processingMessage: string;
  onSuccess?: (result: T) => void;
};

export const usePDFEngine = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const toast = useToast();

  const setGlobalProcessing = useCanvasStore((state) => state.setProcessing);

  const updateProgress = useCallback(
    (value: number, message: string) => {
      setProgress(value);
      setGlobalProcessing(true, value, message);
    },
    [setGlobalProcessing]
  );

  const finishProcessing = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setGlobalProcessing(false, 0, "");
  }, [setGlobalProcessing]);

  const withLifecycle = useCallback(
    async <T>(operation: (setStepProgress: (value: number) => void) => Promise<T>, options: LifecycleOptions<T>) => {
      logger.info("pdf.engine.lifecycle.start", {
        processingMessage: options.processingMessage
      });
      setIsProcessing(true);
      setError(null);
      setDownloadComplete(false);
      updateProgress(5, options.processingMessage);

      try {
        const result = await operation((value) => updateProgress(value, options.processingMessage));
        updateProgress(100, options.processingMessage);

        queueMicrotask(() => {
          options.onSuccess?.(result);
          finishProcessing();
          setDownloadComplete(true);
          window.setTimeout(() => setDownloadComplete(false), 3000);
        });

        logger.info("pdf.engine.lifecycle.success", {
          processingMessage: options.processingMessage
        });
        toast.success(options.successMessage);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown PDF processing error";
        logger.error("pdf.engine.lifecycle.failed", {
          processingMessage: options.processingMessage,
          error: err,
          message
        });
        setError(message);
        toast.error("PDF action failed", message);
        finishProcessing();
        return null;
      }
    },
    [finishProcessing, toast, updateProgress]
  );

  const merge = useCallback(
    async (files: File[], order: number[]) =>
      withLifecycle(
        async (setStepProgress) => {
          const result = await mergePDFs(files, order, setStepProgress);
          if (!result.data) {
            throw result.error ?? new Error("Merge failed");
          }
          return result.data;
        },
        {
          successMessage: "Merged PDF downloaded",
          processingMessage: `Merging ${files.length} file${files.length === 1 ? "" : "s"}...`,
          onSuccess: (blob) => {
            downloadBlob(blob, "merged.pdf");
            analytics.mergeUsed(files.length);
            analytics.toolUsed("merge", { file_count: files.length });
            analytics.downloadComplete("merge", blob.size);
            trackToolActivity({
              tool: "merge",
              fileName: "merged.pdf",
              filesProcessed: files.length,
              inputBytes: files.reduce((total, item) => total + item.size, 0),
              outputBytes: blob.size
            });
          }
        }
      ),
    [withLifecycle]
  );

  const split = useCallback(
    async (file: File, ranges: PageRange[]) =>
      withLifecycle(
        async () => {
          const result = await splitByPages(file, ranges);
          if (!result.data) {
            throw result.error ?? new Error("Split failed");
          }
          return result.data;
        },
        {
          successMessage: "Split PDFs downloaded",
          processingMessage: "Splitting ranges...",
          onSuccess: (chunks) => {
            chunks.forEach((entry) => downloadBlob(entry.blob, entry.filename));
            analytics.splitUsed("range", chunks.length);
            analytics.toolUsed("split", { output_count: chunks.length });
            analytics.downloadComplete("split");
            trackToolActivity({
              tool: "split",
              fileName: file.name,
              filesProcessed: 1,
              inputBytes: file.size,
              outputBytes: chunks.reduce((total, entry) => total + entry.blob.size, 0)
            });
          }
        }
      ),
    [withLifecycle]
  );

  const splitFixed = useCallback(
    async (file: File, pagesPerFile: number) =>
      withLifecycle(
        async () => {
          const result = await splitEveryN(file, pagesPerFile);
          if (!result.data) {
            throw result.error ?? new Error("Split failed");
          }
          return result.data;
        },
        {
          successMessage: "Split PDFs downloaded",
          processingMessage: `Splitting every ${pagesPerFile} page(s)...`,
          onSuccess: (chunks) => {
            chunks.forEach((entry) => downloadBlob(entry.blob, entry.filename));
            analytics.splitUsed("every_n", chunks.length);
            analytics.toolUsed("split", { output_count: chunks.length });
            analytics.downloadComplete("split");
            trackToolActivity({
              tool: "split",
              fileName: file.name,
              filesProcessed: 1,
              inputBytes: file.size,
              outputBytes: chunks.reduce((total, entry) => total + entry.blob.size, 0)
            });
          }
        }
      ),
    [withLifecycle]
  );

  const extract = useCallback(
    async (file: File, pageNumbers: number[]) =>
      withLifecycle(
        async () => {
          const result = await extractPages(file, pageNumbers);
          if (!result.data) {
            throw result.error ?? new Error("Extract failed");
          }
          return result.data;
        },
        {
          successMessage: "Extracted pages downloaded",
          processingMessage: "Extracting selected pages...",
          onSuccess: (result) => {
            downloadBlob(result.blob, result.filename);
            analytics.splitUsed("extract", pageNumbers.length);
            analytics.toolUsed("split", { selected_pages: pageNumbers.length });
            analytics.downloadComplete("split", result.blob.size);
            trackToolActivity({
              tool: "split",
              fileName: result.filename,
              filesProcessed: pageNumbers.length,
              inputBytes: file.size,
              outputBytes: result.blob.size
            });
          }
        }
      ),
    [withLifecycle]
  );

  const compress = useCallback(
    async (file: File, targetKB: number) =>
      withLifecycle(
        async (setStepProgress) => {
          const result = await compressPDF(file, { targetKB }, setStepProgress);
          if (!result.data) {
            throw result.error ?? new Error("Compression failed");
          }
          return result.data;
        },
        {
          successMessage: "Compressed PDF downloaded",
          processingMessage: "Compressing file locally...",
          onSuccess: (result) => {
            downloadBlob(result.blob, `${file.name.replace(/\.pdf$/i, "")}_compressed.pdf`);
            analytics.compressionUsed(targetKB, result.compressedBytes / 1024);
            analytics.toolUsed("compress", { target_kb: targetKB });
            analytics.downloadComplete("compress", result.compressedBytes);
            trackToolActivity({
              tool: "compress",
              fileName: file.name,
              filesProcessed: 1,
              inputBytes: result.originalBytes,
              outputBytes: result.compressedBytes
            });
          }
        }
      ),
    [withLifecycle]
  );

  const rotate = useCallback(
    async (file: File, degrees: 90 | 180 | 270) =>
      withLifecycle(
        async () => {
          const result = await rotateAll(file, degrees);
          if (!result.data) {
            throw result.error ?? new Error("Rotate failed");
          }
          return result.data;
        },
        {
          successMessage: "Rotated PDF downloaded",
          processingMessage: "Applying page rotations...",
          onSuccess: (blob) => {
            downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}_rotated.pdf`);
            analytics.toolUsed("rotate");
            analytics.downloadComplete("rotate", blob.size);
            trackToolActivity({
              tool: "rotate",
              fileName: file.name,
              filesProcessed: 1,
              inputBytes: file.size,
              outputBytes: blob.size
            });
          }
        }
      ),
    [withLifecycle]
  );

  const watermark = useCallback(
    async (file: File, text: string, options?: Partial<Omit<WatermarkOptions, "text">>) =>
      withLifecycle(
        async () => {
          const result = await addTextWatermark(file, {
            text,
            position: options?.position ?? "center",
            opacity: options?.opacity ?? 0.25,
            fontSize: options?.fontSize ?? 42,
            rotation: options?.rotation ?? 45,
            color: options?.color ?? { r: 0.12, g: 0.42, b: 0.24 }
          });

          if (!result.data) {
            throw result.error ?? new Error("Watermark failed");
          }

          return result.data;
        },
        {
          successMessage: "Watermarked PDF downloaded",
          processingMessage: "Applying text watermark...",
          onSuccess: (blob) => {
            downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}_watermarked.pdf`);
            analytics.toolUsed("watermark");
            analytics.downloadComplete("watermark", blob.size);
            trackToolActivity({
              tool: "watermark",
              fileName: file.name,
              filesProcessed: 1,
              inputBytes: file.size,
              outputBytes: blob.size
            });
          }
        }
      ),
    [withLifecycle]
  );

  const imageWatermark = useCallback(
    async (file: File, imageData: string, options?: Partial<Omit<WatermarkOptions, "text">>) =>
      withLifecycle(
        async () => {
          const result = await addImageWatermark(file, imageData, {
            position: options?.position ?? "bottom-right",
            opacity: options?.opacity ?? 0.35,
            fontSize: options?.fontSize ?? 18,
            rotation: options?.rotation ?? 0,
            color: options?.color ?? { r: 0, g: 0, b: 0 }
          });

          if (!result.data) {
            throw result.error ?? new Error("Watermark failed");
          }

          return result.data;
        },
        {
          successMessage: "Image watermark applied",
          processingMessage: "Applying image watermark...",
          onSuccess: (blob) => {
            downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}_watermarked.pdf`);
            analytics.toolUsed("watermark");
            analytics.downloadComplete("watermark", blob.size);
            trackToolActivity({
              tool: "watermark",
              fileName: file.name,
              filesProcessed: 1,
              inputBytes: file.size,
              outputBytes: blob.size
            });
          }
        }
      ),
    [withLifecycle]
  );

  const removeMetadata = useCallback(
    async (file: File) =>
      withLifecycle(
        async () => {
          const result = await stripMetadata(file);
          if (!result.data) {
            throw result.error ?? new Error("Metadata strip failed");
          }
          return result.data;
        },
        {
          successMessage: "Metadata stripped and downloaded",
          processingMessage: "Removing metadata...",
          onSuccess: (blob) => {
            downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}_clean.pdf`);
            analytics.toolUsed("metadata-strip");
            analytics.downloadComplete("metadata-strip", blob.size);
            trackToolActivity({
              tool: "metadata-strip",
              fileName: file.name,
              filesProcessed: 1,
              inputBytes: file.size,
              outputBytes: blob.size
            });
          }
        }
      ),
    [withLifecycle]
  );

  const cancelProcessing = useCallback(() => {
    finishProcessing();
    toast.info("Processing cancelled", "Current operation feedback cleared");
  }, [finishProcessing, toast]);

  return useMemo(
    () => ({
      merge,
      split,
      splitFixed,
      extract,
      compress,
      rotate,
      watermark,
      imageWatermark,
      stripMetadata: removeMetadata,
      cancelProcessing,
      isProcessing,
      progress,
      error,
      downloadComplete,
      toasts: toast.toasts,
      dismissToast: toast.dismiss
    }),
    [
      cancelProcessing,
      compress,
      downloadComplete,
      error,
      extract,
      imageWatermark,
      isProcessing,
      merge,
      progress,
      removeMetadata,
      rotate,
      split,
      splitFixed,
      toast.dismiss,
      toast.toasts,
      watermark
    ]
  );
};
