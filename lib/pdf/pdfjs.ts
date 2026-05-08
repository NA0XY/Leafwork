"use client";

type PdfJsModule = typeof import("pdfjs-dist");

let pdfJsPromise: Promise<PdfJsModule> | null = null;

const configureWorker = (pdfjs: PdfJsModule): void => {
  const workerVersion = (pdfjs as { version?: string }).version;
  if (!workerVersion) {
    return;
  }

  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${workerVersion}/build/pdf.worker.min.mjs`;
};

export const loadPdfJs = async (): Promise<PdfJsModule> => {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist").then((module) => {
      configureWorker(module);
      return module;
    });
  }

  return pdfJsPromise;
};

export const clonePdfBytes = (bytes: Uint8Array): Uint8Array => bytes.slice();
