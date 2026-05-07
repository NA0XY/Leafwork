"use client";

import { withPdfLib } from "@/lib/pdf/engine";
import {
  PDFEngineError,
  PDFEngineErrorCode,
  type ProcessingResult,
  type WatermarkOptions,
  type WatermarkPosition
} from "@/lib/pdf/types";

const positionToCoords = (
  pageWidth: number,
  pageHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  position: WatermarkPosition
): { x: number; y: number } => {
  const margin = 24;

  const horizontalMap: Record<WatermarkPosition, number> = {
    "top-left": margin,
    "top-center": (pageWidth - watermarkWidth) / 2,
    "top-right": pageWidth - watermarkWidth - margin,
    "middle-left": margin,
    center: (pageWidth - watermarkWidth) / 2,
    "middle-right": pageWidth - watermarkWidth - margin,
    "bottom-left": margin,
    "bottom-center": (pageWidth - watermarkWidth) / 2,
    "bottom-right": pageWidth - watermarkWidth - margin
  };

  const verticalMap: Record<WatermarkPosition, number> = {
    "top-left": pageHeight - watermarkHeight - margin,
    "top-center": pageHeight - watermarkHeight - margin,
    "top-right": pageHeight - watermarkHeight - margin,
    "middle-left": (pageHeight - watermarkHeight) / 2,
    center: (pageHeight - watermarkHeight) / 2,
    "middle-right": (pageHeight - watermarkHeight) / 2,
    "bottom-left": margin,
    "bottom-center": margin,
    "bottom-right": margin
  };

  return {
    x: horizontalMap[position],
    y: verticalMap[position]
  };
};

const toResult = <T>(data: T | null, error: PDFEngineError | null, startedAt: number): ProcessingResult<T> => ({
  data,
  error,
  durationMs: Math.max(0, Math.round(performance.now() - startedAt))
});

export const WATERMARK_LIMITATION_MESSAGE =
  "Removing existing watermarks is not reliably feasible with pdf-lib, because source watermark objects are not semantically tagged.";

export const addTextWatermark = async (
  file: File,
  options: WatermarkOptions
): Promise<ProcessingResult<Blob>> => {
  const startedAt = performance.now();

  const result = await withPdfLib(async (pdfLib) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfLib.PDFDocument.load(bytes);
    const font = await doc.embedFont(pdfLib.StandardFonts.HelveticaBold);

    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
      const textHeight = options.fontSize;
      const coords = positionToCoords(width, height, textWidth, textHeight, options.position);

      page.drawText(options.text, {
        x: coords.x,
        y: coords.y,
        size: options.fontSize,
        font,
        color: pdfLib.rgb(options.color.r, options.color.g, options.color.b),
        rotate: pdfLib.degrees(options.rotation || 45),
        opacity: Math.max(0.05, Math.min(1, options.opacity))
      });
    }

    const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    return new Blob([output], { type: "application/pdf" });
  });

  return toResult(result.data, result.error, startedAt);
};

export const addImageWatermark = async (
  file: File,
  imageData: string,
  options: Omit<WatermarkOptions, "text">
): Promise<ProcessingResult<Blob>> => {
  const startedAt = performance.now();

  const result = await withPdfLib(async (pdfLib) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfLib.PDFDocument.load(bytes);

    const imagePayload = imageData.split(",")[1] ?? "";
    const imageBytes = Uint8Array.from(atob(imagePayload), (char) => char.charCodeAt(0));

    const isPng = imageData.startsWith("data:image/png");
    const embedded = isPng ? await doc.embedPng(imageBytes) : await doc.embedJpg(imageBytes);

    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      const maxWidth = width * 0.35;
      const maxHeight = height * 0.35;
      const scale = Math.min(maxWidth / embedded.width, maxHeight / embedded.height, 1);
      const watermarkWidth = embedded.width * scale;
      const watermarkHeight = embedded.height * scale;
      const coords = positionToCoords(width, height, watermarkWidth, watermarkHeight, options.position);

      page.drawImage(embedded, {
        x: coords.x,
        y: coords.y,
        width: watermarkWidth,
        height: watermarkHeight,
        rotate: pdfLib.degrees(options.rotation || 0),
        opacity: Math.max(0.05, Math.min(1, options.opacity))
      });
    }

    const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    return new Blob([output], { type: "application/pdf" });
  });

  return toResult(result.data, result.error, startedAt);
};
