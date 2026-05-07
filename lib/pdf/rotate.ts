"use client";

import { withPdfLib } from "@/lib/pdf/engine";
import { PDFEngineError, PDFEngineErrorCode, type ProcessingResult } from "@/lib/pdf/types";

type RotateOperation = { pageIndex: number; degrees: number };

const toResult = <T>(data: T | null, error: PDFEngineError | null, startedAt: number): ProcessingResult<T> => ({
  data,
  error,
  durationMs: Math.max(0, Math.round(performance.now() - startedAt))
});

const assertQuarterTurn = (degrees: number): degrees is 90 | 180 | 270 => [90, 180, 270].includes(degrees);

const normalizeRotation = (current: number, delta: number): number => {
  const next = (current + delta) % 360;
  return next < 0 ? next + 360 : next;
};

export const rotatePage = async (
  file: File,
  pageIndex: number,
  degrees: 90 | 180 | 270
): Promise<ProcessingResult<Blob>> => {
  const startedAt = performance.now();

  const data = await withPdfLib(async (pdfLib) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfLib.PDFDocument.load(bytes);

    const page = doc.getPage(pageIndex);
    const current = page.getRotation().angle;
    page.setRotation(pdfLib.degrees(normalizeRotation(current, degrees)));

    const result = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    return new Blob([result], { type: "application/pdf" });
  });

  return toResult<Blob>(data.data, data.error, startedAt);
};

export const rotatePages = async (
  file: File,
  operations: RotateOperation[]
): Promise<ProcessingResult<Blob>> => {
  const startedAt = performance.now();

  if (!operations.length) {
    return toResult<Blob>(
      null,
      new PDFEngineError(PDFEngineErrorCode.INVALID_FILE, "At least one rotation operation is required"),
      startedAt
    );
  }

  for (const operation of operations) {
    if (!assertQuarterTurn(operation.degrees)) {
      return toResult<Blob>(
        null,
        new PDFEngineError(PDFEngineErrorCode.INVALID_FILE, "Rotation degrees must be 90, 180, or 270"),
        startedAt
      );
    }
  }

  const result = await withPdfLib(async (pdfLib) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfLib.PDFDocument.load(bytes);

    operations.forEach((operation) => {
      const page = doc.getPage(operation.pageIndex);
      const current = page.getRotation().angle;
      page.setRotation(pdfLib.degrees(normalizeRotation(current, operation.degrees)));
    });

    const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    return new Blob([output], { type: "application/pdf" });
  });

  return toResult<Blob>(result.data, result.error, startedAt);
};

export const rotateAll = async (
  file: File,
  degrees: 90 | 180 | 270
): Promise<ProcessingResult<Blob>> => {
  const startedAt = performance.now();

  const result = await withPdfLib(async (pdfLib) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfLib.PDFDocument.load(bytes);

    doc.getPages().forEach((page) => {
      const current = page.getRotation().angle;
      page.setRotation(pdfLib.degrees(normalizeRotation(current, degrees)));
    });

    const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    return new Blob([output], { type: "application/pdf" });
  });

  return toResult<Blob>(result.data, result.error, startedAt);
};

