"use client";

import { checkMagicBytes } from "@/lib/validations/file";
import {
  PDFDocumentState,
  PDFEngineError,
  PDFEngineErrorCode,
  type ProcessingResult
} from "@/lib/pdf/types";

type ProgressCallback = (percent: number) => void;
type PdfLibModule = typeof import("pdf-lib");
type PDFDocumentType = import("pdf-lib").PDFDocument;

type WorkerRequestPayload = {
  id: string;
  action: "inspect";
  bytes: ArrayBuffer;
};

type WorkerResponsePayload = {
  id: string;
  pageCount: number;
  dimensions: { width: number; height: number }[];
};

const LARGE_FILE_THRESHOLD_BYTES = 5 * 1024 * 1024;

const now = (): number => performance.now();

const toProcessingResult = <T>(
  startTime: number,
  payload: { data: T | null; error: PDFEngineError | null }
): ProcessingResult<T> => ({
  ...payload,
  durationMs: Math.max(0, Math.round(now() - startTime))
});

const mapError = (
  code: PDFEngineErrorCode,
  message: string,
  originalError?: unknown
): PDFEngineError => new PDFEngineError(code, message, originalError);

const loadPdfLib = async (): Promise<PdfLibModule> => import("pdf-lib");

const inspectPdfInWorker = async (bytes: Uint8Array): Promise<WorkerResponsePayload | null> => {
  if (typeof window === "undefined" || typeof Worker === "undefined") {
    return null;
  }

  return new Promise((resolve) => {
    let settled = false;
    const worker = new Worker("/workers/pdf.processor.js");
    const requestId = crypto.randomUUID();

    const cleanup = () => {
      worker.terminate();
    };

    worker.onmessage = (event: MessageEvent<WorkerResponsePayload>) => {
      if (event.data.id !== requestId || settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(event.data);
    };

    worker.onerror = () => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(null);
    };

    // Use a cloned buffer for worker transfer so the caller keeps its original bytes.
    const workerBytes = bytes.slice();
    const payload: WorkerRequestPayload = {
      id: requestId,
      action: "inspect",
      bytes: workerBytes.buffer
    };

    worker.postMessage(payload, [workerBytes.buffer]);
  });
};

export const loadPDF = async (
  file: File,
  onProgress?: ProgressCallback
): Promise<ProcessingResult<PDFDocumentState>> => {
  const startedAt = now();

  try {
    if (typeof window === "undefined") {
      return toProcessingResult<PDFDocumentState>(startedAt, {
        data: null,
        error: mapError(PDFEngineErrorCode.UNSUPPORTED_OPERATION, "PDF loading is client-side only")
      });
    }

    onProgress?.(5);

    const buffer = await file.arrayBuffer();
    if (!checkMagicBytes(buffer)) {
      return toProcessingResult<PDFDocumentState>(startedAt, {
        data: null,
        error: mapError(PDFEngineErrorCode.INVALID_FILE, "File is not a valid PDF")
      });
    }

    const bytes = new Uint8Array(buffer);
    onProgress?.(25);

    if (file.size > LARGE_FILE_THRESHOLD_BYTES) {
      console.warn("large_pdf_detected", {
        name: file.name,
        sizeBytes: file.size
      });
    }

    const workerInspection = file.size > LARGE_FILE_THRESHOLD_BYTES ? await inspectPdfInWorker(bytes) : null;

    if (workerInspection) {
      onProgress?.(100);
      return toProcessingResult<PDFDocumentState>(startedAt, {
        data: {
          file,
          bytes,
          pageCount: workerInspection.pageCount,
          pageDimensions: workerInspection.dimensions
        },
        error: null
      });
    }

    const pdfLib = await loadPdfLib();
    const pdfDoc = await pdfLib.PDFDocument.load(bytes, { ignoreEncryption: false });

    const pageCount = pdfDoc.getPageCount();
    const pageDimensions = Array.from({ length: pageCount }, (_, index) => {
      const size = pdfDoc.getPage(index).getSize();
      return { width: size.width, height: size.height };
    });

    onProgress?.(100);

    return toProcessingResult<PDFDocumentState>(startedAt, {
      data: {
        file,
        bytes,
        pageCount,
        pageDimensions
      },
      error: null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown PDF load error";
    const code = message.toLowerCase().includes("encrypted")
      ? PDFEngineErrorCode.ENCRYPTED_PDF
      : PDFEngineErrorCode.PDF_PARSE_FAILED;

    return toProcessingResult<PDFDocumentState>(startedAt, {
      data: null,
      error: mapError(code, message, error)
    });
  }
};

export const savePDF = async (
  document: PDFDocumentType,
  filename: string,
  onProgress?: ProgressCallback
): Promise<ProcessingResult<Blob>> => {
  const startedAt = now();

  try {
    if (typeof window === "undefined") {
      return toProcessingResult<Blob>(startedAt, {
        data: null,
        error: mapError(PDFEngineErrorCode.UNSUPPORTED_OPERATION, "PDF saving is client-side only")
      });
    }

    onProgress?.(20);
    const outputBytes = await document.save({
      useObjectStreams: true,
      addDefaultPage: false,
      updateFieldAppearances: false
    });
    onProgress?.(90);

    const blob = new Blob([outputBytes], { type: "application/pdf" });
    onProgress?.(100);

    if (!filename.toLowerCase().endsWith(".pdf")) {
      console.warn("pdf_filename_without_extension", { filename });
    }

    return toProcessingResult<Blob>(startedAt, {
      data: blob,
      error: null
    });
  } catch (error) {
    return toProcessingResult<Blob>(startedAt, {
      data: null,
      error: mapError(PDFEngineErrorCode.PROCESSING_FAILED, "Unable to serialize PDF", error)
    });
  }
};

export const withPdfLib = async <T>(
  executor: (pdfLib: PdfLibModule) => Promise<T>
): Promise<ProcessingResult<T>> => {
  const startedAt = now();

  try {
    const pdfLib = await loadPdfLib();
    const result = await executor(pdfLib);
    return toProcessingResult<T>(startedAt, {
      data: result,
      error: null
    });
  } catch (error) {
    return toProcessingResult<T>(startedAt, {
      data: null,
      error: mapError(PDFEngineErrorCode.PROCESSING_FAILED, "PDF operation failed", error)
    });
  }
};
