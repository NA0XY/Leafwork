"use client";

import { loadPDF, withPdfLib } from "@/lib/pdf/engine";
import { PDFEngineError, PDFEngineErrorCode, type ProcessingResult } from "@/lib/pdf/types";

type ProgressCallback = (percent: number) => void;

export type MergePageRange = {
  start: number;
  end: number;
};

export type MergeSelection = {
  fileIndex: number;
  ranges?: MergePageRange[];
};

const createResult = <T>(data: T | null, error: PDFEngineError | null, startedAt: number): ProcessingResult<T> => ({
  data,
  error,
  durationMs: Math.max(0, Math.round(performance.now() - startedAt))
});

const normalizeSelections = (files: File[], selections: number[] | MergeSelection[]): MergeSelection[] => {
  if (!selections.length) {
    return files.map((_, fileIndex) => ({ fileIndex }));
  }

  if (typeof selections[0] === "number") {
    return (selections as number[]).map((fileIndex) => ({ fileIndex }));
  }

  return selections as MergeSelection[];
};

const resolvePageIndices = (pageCount: number, ranges?: MergePageRange[]): number[] => {
  if (!ranges?.length) {
    return Array.from({ length: pageCount }, (_, index) => index);
  }

  const pageIndices: number[] = [];
  const seen = new Set<number>();

  for (const range of ranges) {
    const start = Math.min(range.start, range.end);
    const end = Math.max(range.start, range.end);

    if (start < 1 || end > pageCount) {
      throw new Error(`Page range ${start}-${end} is outside the ${pageCount} page document.`);
    }

    for (let page = start; page <= end; page += 1) {
      if (seen.has(page)) {
        throw new Error(`Page ${page} is included more than once in the merge range.`);
      }
      seen.add(page);
      pageIndices.push(page - 1);
    }
  }

  return pageIndices;
};

export const mergePDFs = async (
  files: File[],
  selections: number[] | MergeSelection[],
  onProgress?: ProgressCallback
): Promise<ProcessingResult<Blob>> => {
  const startedAt = performance.now();

  if (!files.length) {
    return createResult<Blob>(
      null,
      new PDFEngineError(PDFEngineErrorCode.INVALID_FILE, "At least one PDF is required"),
      startedAt
    );
  }

  const normalizedSelections = normalizeSelections(files, selections);

  return withPdfLib(async (pdfLib) => {
    const mergedDoc = await pdfLib.PDFDocument.create();
    const fileProgressWeight = 100 / normalizedSelections.length;

    for (let cursor = 0; cursor < normalizedSelections.length; cursor += 1) {
      const selection = normalizedSelections[cursor] as MergeSelection;
      const fileIndex = selection.fileIndex;
      const file = files[fileIndex];
      if (!file) {
        continue;
      }

      const loadResult = await loadPDF(file, (percent) => {
        onProgress?.(Math.min(99, cursor * fileProgressWeight + (percent / 100) * fileProgressWeight));
      });

      if (!loadResult.data) {
        if (loadResult.error?.code === PDFEngineErrorCode.ENCRYPTED_PDF) {
          console.warn("merge_skipping_encrypted_pdf", { name: file.name });
          continue;
        }

        throw loadResult.error ?? new Error(`Unable to load ${file.name}`);
      }

      const sourceDoc = await pdfLib.PDFDocument.load(loadResult.data.bytes, {
        ignoreEncryption: true
      });
      const pageIndices = resolvePageIndices(sourceDoc.getPageCount(), selection.ranges);
      const copiedPages = await mergedDoc.copyPages(sourceDoc, pageIndices);

      copiedPages.forEach((page) => {
        mergedDoc.addPage(page);
      });

      onProgress?.(Math.min(99, (cursor + 1) * fileProgressWeight));
    }

    const bytes = await mergedDoc.save({ useObjectStreams: true, addDefaultPage: false });
    onProgress?.(100);

    return new Blob([bytes], { type: "application/pdf" });
  }).then((result) => createResult<Blob>(result.data, result.error, startedAt));
};

