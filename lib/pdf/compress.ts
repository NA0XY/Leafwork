"use client";

import { withPdfLib } from "@/lib/pdf/engine";
import { PDFEngineError, PDFEngineErrorCode, type CompressionTarget, type ProcessingResult } from "@/lib/pdf/types";

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
  const [{ getDocument, GlobalWorkerOptions }, pdfLib] = await Promise.all([
    import("pdfjs-dist"),
    import("pdf-lib")
  ]);

  GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs";

  const loadingTask = getDocument({ data: bytes });
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

  try {
    const originalBytes = new Uint8Array(await file.arrayBuffer());
    const goalBytes = getTargetBytes(target, originalBytes.byteLength);

    onProgress?.(10);
    const stageOneBytes = await optimizeWithPdfLib(originalBytes);
    onProgress?.(25);

    let low = MIN_QUALITY;
    let high = MAX_QUALITY;
    let bestQuality = MIN_QUALITY;
    let bestBytes = stageOneBytes;

    for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration += 1) {
      const quality = Number(((low + high) / 2).toFixed(4));
      const flattened = await renderAndFlattenPdf(stageOneBytes, quality);

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

    if (bestBytes.byteLength > goalBytes) {
      const aggressive = await renderAndFlattenPdf(stageOneBytes, MIN_QUALITY);
      if (aggressive.byteLength < bestBytes.byteLength) {
        bestBytes = aggressive;
        bestQuality = MIN_QUALITY;
      }
    }

    onProgress?.(100);

    return toResult<CompressOutput>(
      {
        blob: new Blob([bestBytes], { type: "application/pdf" }),
        originalBytes: originalBytes.byteLength,
        compressedBytes: bestBytes.byteLength,
        quality: Number(bestQuality.toFixed(2)),
        iterationsUsed: MAX_ITERATIONS
      },
      null,
      startedAt
    );
  } catch (error) {
    return toResult<CompressOutput>(
      null,
      new PDFEngineError(PDFEngineErrorCode.PROCESSING_FAILED, "Compression failed", error),
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



