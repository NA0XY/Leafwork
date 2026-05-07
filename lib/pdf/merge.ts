"use client";

import { loadPDF, withPdfLib } from "@/lib/pdf/engine";
import { PDFEngineError, PDFEngineErrorCode, type ProcessingResult } from "@/lib/pdf/types";

type ProgressCallback = (percent: number) => void;

const createResult = <T>(data: T | null, error: PDFEngineError | null, startedAt: number): ProcessingResult<T> => ({
  data,
  error,
  durationMs: Math.max(0, Math.round(performance.now() - startedAt))
});

export const mergePDFs = async (
  files: File[],
  order: number[],
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

  const indices = order.length > 0 ? order : files.map((_, index) => index);

  return withPdfLib(async (pdfLib) => {
    const mergedDoc = await pdfLib.PDFDocument.create();
    const fileProgressWeight = 100 / indices.length;

    for (let cursor = 0; cursor < indices.length; cursor += 1) {
      const fileIndex = indices[cursor];
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
      const pageIndices = sourceDoc.getPageIndices();
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

