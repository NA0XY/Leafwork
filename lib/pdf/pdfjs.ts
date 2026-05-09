"use client";

type PdfJsModule = typeof import("pdfjs-dist");

let pdfJsPromise: Promise<PdfJsModule> | null = null;

const configureWorker = (pdfjs: PdfJsModule): void => {
  void pdfjs;
  // Keep worker same-origin so CSP stays strict and no CDN script is required.
  pdfjs.GlobalWorkerOptions.workerSrc = "/workers/pdf.worker.min.mjs";
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
