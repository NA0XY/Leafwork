"use client";

import { withPdfLib } from "@/lib/pdf/engine";
import { PDFEngineError, PDFEngineErrorCode, type ProcessingResult } from "@/lib/pdf/types";

export type PageRange = {
  start: number;
  end: number;
  label?: string;
};

export type SplitOutput = {
  blob: Blob;
  filename: string;
  pageCount: number;
};

const toResult = <T>(
  data: T | null,
  error: PDFEngineError | null,
  startedAt: number
): ProcessingResult<T> => ({
  data,
  error,
  durationMs: Math.max(0, Math.round(performance.now() - startedAt))
});

const sanitizeRange = (range: PageRange, maxPages: number): PageRange => ({
  start: Math.max(1, Math.min(maxPages, range.start)),
  end: Math.max(1, Math.min(maxPages, range.end)),
  label: range.label
});

export const splitByPages = async (file: File, ranges: PageRange[]): Promise<ProcessingResult<SplitOutput[]>> => {
  const startedAt = performance.now();

  if (!ranges.length) {
    return toResult<SplitOutput[]>(
      null,
      new PDFEngineError(PDFEngineErrorCode.INVALID_FILE, "At least one page range is required"),
      startedAt
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const sourceBytes = new Uint8Array(arrayBuffer);

  const result = await withPdfLib(async (pdfLib) => {
    const sourceDoc = await pdfLib.PDFDocument.load(sourceBytes);
    const totalPages = sourceDoc.getPageCount();

    const outputs: SplitOutput[] = [];

    for (const range of ranges) {
      const normalized = sanitizeRange(range, totalPages);
      const start = Math.min(normalized.start, normalized.end);
      const end = Math.max(normalized.start, normalized.end);
      const doc = await pdfLib.PDFDocument.create();
      const indices = Array.from({ length: end - start + 1 }, (_, index) => start - 1 + index);
      const copiedPages = await doc.copyPages(sourceDoc, indices);

      copiedPages.forEach((page) => doc.addPage(page));

      const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
      outputs.push({
        blob: new Blob([bytes], { type: "application/pdf" }),
        filename: `${file.name.replace(/\.pdf$/i, "")}_pages_${start}-${end}.pdf`,
        pageCount: copiedPages.length
      });
    }

    return outputs;
  });

  return toResult<SplitOutput[]>(result.data, result.error, startedAt);
};

export const splitEveryN = async (file: File, n: number): Promise<ProcessingResult<SplitOutput[]>> => {
  const startedAt = performance.now();

  if (!Number.isInteger(n) || n <= 0) {
    return toResult<SplitOutput[]>(
      null,
      new PDFEngineError(PDFEngineErrorCode.INVALID_FILE, "Split size must be a positive integer"),
      startedAt
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  const result = await withPdfLib(async (pdfLib) => {
    const sourceDoc = await pdfLib.PDFDocument.load(bytes);
    const totalPages = sourceDoc.getPageCount();

    const ranges: PageRange[] = [];
    for (let start = 1; start <= totalPages; start += n) {
      ranges.push({ start, end: Math.min(totalPages, start + n - 1) });
    }

    const outputs: SplitOutput[] = [];
    for (const range of ranges) {
      const document = await pdfLib.PDFDocument.create();
      const indices = Array.from({ length: range.end - range.start + 1 }, (_, index) => range.start - 1 + index);
      const copiedPages = await document.copyPages(sourceDoc, indices);
      copiedPages.forEach((page) => document.addPage(page));
      const outputBytes = await document.save({ useObjectStreams: true, addDefaultPage: false });
      outputs.push({
        blob: new Blob([outputBytes], { type: "application/pdf" }),
        filename: `${file.name.replace(/\.pdf$/i, "")}_chunk_${range.start}-${range.end}.pdf`,
        pageCount: copiedPages.length
      });
    }

    return outputs;
  });

  return toResult<SplitOutput[]>(result.data, result.error, startedAt);
};

export const extractPages = async (
  file: File,
  pageNumbers: number[]
): Promise<ProcessingResult<{ blob: Blob; filename: string; pageCount: number }>> => {
  const startedAt = performance.now();

  if (!pageNumbers.length) {
    return toResult<{ blob: Blob; filename: string; pageCount: number }>(
      null,
      new PDFEngineError(PDFEngineErrorCode.INVALID_FILE, "At least one page number is required"),
      startedAt
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await withPdfLib(async (pdfLib) => {
    const sourceDoc = await pdfLib.PDFDocument.load(bytes);
    const totalPages = sourceDoc.getPageCount();
    const uniquePages = [...new Set(pageNumbers)]
      .filter((page) => page >= 1 && page <= totalPages)
      .map((page) => page - 1)
      .sort((a, b) => a - b);

    const outputDoc = await pdfLib.PDFDocument.create();
    const copiedPages = await outputDoc.copyPages(sourceDoc, uniquePages);
    copiedPages.forEach((page) => outputDoc.addPage(page));

    const outputBytes = await outputDoc.save({ useObjectStreams: true, addDefaultPage: false });
    return {
      blob: new Blob([outputBytes], { type: "application/pdf" }),
      filename: `${file.name.replace(/\.pdf$/i, "")}_extracted.pdf`,
      pageCount: copiedPages.length
    };
  });

  return toResult<{ blob: Blob; filename: string; pageCount: number }>(result.data, result.error, startedAt);
};
