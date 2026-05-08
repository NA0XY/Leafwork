"use client";

import { withPdfLib } from "@/lib/pdf/engine";
import { clonePdfBytes, loadPdfJs } from "@/lib/pdf/pdfjs";
import { PDFEngineError, PDFEngineErrorCode, type CompressionTarget, type ProcessingResult } from "@/lib/pdf/types";
import { logger } from "@/lib/utils/logger";

type ProgressCallback = (percent: number) => void;

type CompressOutput = {
  blob: Blob;
  originalBytes: number;
  compressedBytes: number;
  quality: number;
  iterationsUsed: number;
};

const MIN_QUALITY = 0.3;
const MAX_QUALITY = 0.9;
const MAX_ITERATIONS = 8;
const PRESERVE_SELECTABLE_TEXT = true;

const toResult = <T>(data: T | null, error: PDFEngineError | null, startedAt: number): ProcessingResult<T> => ({
  data,
  error,
  durationMs: Math.max(0, Math.round(performance.now() - startedAt))
});

const getTargetBytes = (target: CompressionTarget, originalBytes: number): number => {
  if (target.maxBytes && target.maxBytes > 0) {
    return target.maxBytes;
  }

  if (target.targetKB && target.targetKB > 0) {
    return target.targetKB * 1024;
  }

  if (target.quality && target.quality > 0) {
    return Math.floor(originalBytes * Math.max(MIN_QUALITY, Math.min(MAX_QUALITY, target.quality)));
  }

  return Math.floor(originalBytes * 0.7);
};

const optimizeWithPdfLib = async (bytes: Uint8Array): Promise<Uint8Array> => {
  const result = await withPdfLib(async (pdfLib) => {
    const doc = await pdfLib.PDFDocument.load(bytes, { ignoreEncryption: true });

    doc.setProducer("Leafwork");
    doc.setCreator("Leafwork");

    const optimizedBytes = await doc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      updateFieldAppearances: false,
      objectsPerTick: 30
    });

    return optimizedBytes;
  });

  if (!result.data) {
    throw result.error ?? new Error("Unable to optimize PDF bytes");
  }

  return result.data;
};

const renderAndFlattenPdf = async (bytes: Uint8Array, quality: number): Promise<Uint8Array> => {
  const [pdfJs, pdfLib] = await Promise.all([
    loadPdfJs(),
    import("pdf-lib")
  ]);

  const { getDocument } = pdfJs;

  // PDF.js can transfer/consume TypedArray buffers internally, so pass a fresh copy.
  const loadingTask = getDocument({ data: clonePdfBytes(bytes) });
  const source = await loadingTask.promise;
  const output = await pdfLib.PDFDocument.create();

  for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
    const sourcePage = await source.getPage(pageNumber);
    const viewport = sourcePage.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to create canvas context for compression");
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await sourcePage.render({ canvasContext: context, viewport }).promise;

    const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
    const imageBytes = Uint8Array.from(atob(jpegDataUrl.split(",")[1] ?? ""), (char) => char.charCodeAt(0));
    const image = await output.embedJpg(imageBytes);
    const outputPage = output.addPage([viewport.width, viewport.height]);

    outputPage.drawImage(image, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height
    });
  }

  await source.destroy();
  return output.save({ useObjectStreams: true, addDefaultPage: false });
};

export const compressPDF = async (
  file: File,
  target: CompressionTarget,
  onProgress?: ProgressCallback
): Promise<ProcessingResult<CompressOutput>> => {
  const startedAt = performance.now();
  logger.info("pdf.compress.start", {
    fileName: file.name,
    fileSizeBytes: file.size,
    target
  });

  try {
    const originalBytes = new Uint8Array(await file.arrayBuffer());
    const goalBytes = getTargetBytes(target, originalBytes.byteLength);
    logger.debug("pdf.compress.input.ready", {
      fileName: file.name,
      originalBytes: originalBytes.byteLength,
      goalBytes
    });

    onProgress?.(10);
    const stageOneBytes = await optimizeWithPdfLib(originalBytes);
    const stageOneStableBytes = stageOneBytes.slice();
    logger.debug("pdf.compress.stage_one.complete", {
      fileName: file.name,
      stageOneBytes: stageOneBytes.byteLength
    });
    onProgress?.(25);

    let bestBytes = stageOneStableBytes;
    let bestQuality = 1;
    const flatteningAvailable = false;
    const executedIterations = 0;

    if (PRESERVE_SELECTABLE_TEXT) {
      logger.info("pdf.compress.text_preserving_mode", {
        fileName: file.name,
        originalBytes: originalBytes.byteLength,
        optimizedBytes: stageOneStableBytes.byteLength,
        goalBytes,
        note: "Raster flattening disabled to preserve selectable text."
      });
    } else {
      let low = MIN_QUALITY;
      let high = MAX_QUALITY;
      bestQuality = MIN_QUALITY;
      for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration += 1) {
        const quality = Number(((low + high) / 2).toFixed(4));
        const flattened = await renderAndFlattenPdf(stageOneStableBytes, quality);
        if (Math.abs(flattened.byteLength - goalBytes) < Math.abs(bestBytes.byteLength - goalBytes)) {
          bestBytes = flattened;
          bestQuality = quality;
        }
        if (flattened.byteLength <= goalBytes) {
          low = quality;
        } else {
          high = quality;
        }
        onProgress?.(25 + Math.round((iteration / MAX_ITERATIONS) * 70));
      }
    }

    onProgress?.(100);
    logger.info("pdf.compress.success", {
      fileName: file.name,
      originalBytes: originalBytes.byteLength,
      compressedBytes: bestBytes.byteLength,
      goalBytes,
      bestQuality,
      flatteningAvailable: !PRESERVE_SELECTABLE_TEXT && flatteningAvailable,
      iterationsUsed: executedIterations
    });

    return toResult<CompressOutput>(
      {
        blob: new Blob([bestBytes], { type: "application/pdf" }),
        originalBytes: originalBytes.byteLength,
        compressedBytes: bestBytes.byteLength,
        quality: Number(bestQuality.toFixed(2)),
        iterationsUsed: executedIterations
      },
      null,
      startedAt
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("pdf.compress.failed", {
      fileName: file.name,
      target,
      error
    });
    return toResult<CompressOutput>(
      null,
      new PDFEngineError(PDFEngineErrorCode.PROCESSING_FAILED, `Compression failed: ${message}`, error),
      startedAt
    );
  }
};

export const compressToTargetKB = async (
  file: File,
  targetKB: number,
  onProgress?: ProgressCallback
): Promise<ProcessingResult<CompressOutput>> => compressPDF(file, { targetKB }, onProgress);

export const estimateCompressibility = (file: File): "high" | "medium" | "low" => {
  const name = file.name.toLowerCase();
  if (name.includes("scan") || name.includes("image")) {
    return "high";
  }

  if (file.size > 15 * 1024 * 1024) {
    return "medium";
  }

  return "low";
};



