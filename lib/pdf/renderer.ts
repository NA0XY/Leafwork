"use client";

import { createFileHash } from "@/lib/utils/file";

type PdfJsModule = typeof import("pdfjs-dist");

type CachedThumbnail = {
  dataUrl: string;
  cachedAt: number;
};

const THUMBNAIL_TTL_MS = 30 * 60 * 1000;
const MAX_CACHE_ITEMS = 200;

const thumbnailCache = new Map<string, Map<number, CachedThumbnail>>();
const cacheOrder: Array<{ fileHash: string; pageNumber: number }> = [];
let pdfJsPromise: Promise<PdfJsModule> | null = null;

const loadPdfJs = async (): Promise<PdfJsModule> => {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist").then((module) => {
      module.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs";
      return module;
    });
  }

  return pdfJsPromise;
};

const ensureNotAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    throw new DOMException("Rendering aborted", "AbortError");
  }
};

const getCacheSize = (): number => {
  let size = 0;
  thumbnailCache.forEach((perFile) => {
    size += perFile.size;
  });
  return size;
};

const removeCacheEntry = (fileHash: string, pageNumber: number): void => {
  const perFile = thumbnailCache.get(fileHash);
  if (!perFile) {
    return;
  }

  perFile.delete(pageNumber);
  if (perFile.size === 0) {
    thumbnailCache.delete(fileHash);
  }
};

export const clearStaleCache = (): void => {
  const now = Date.now();

  thumbnailCache.forEach((perFile, fileHash) => {
    perFile.forEach((entry, pageNumber) => {
      if (now - entry.cachedAt > THUMBNAIL_TTL_MS) {
        removeCacheEntry(fileHash, pageNumber);
      }
    });
  });

  for (let index = cacheOrder.length - 1; index >= 0; index -= 1) {
    const entry = cacheOrder[index];
    const cache = thumbnailCache.get(entry.fileHash)?.get(entry.pageNumber);
    if (!cache || now - cache.cachedAt > THUMBNAIL_TTL_MS) {
      cacheOrder.splice(index, 1);
    }
  }
};

const storeCachedThumbnail = (fileHash: string, pageNumber: number, dataUrl: string): void => {
  clearStaleCache();

  if (!thumbnailCache.has(fileHash)) {
    thumbnailCache.set(fileHash, new Map<number, CachedThumbnail>());
  }

  thumbnailCache.get(fileHash)?.set(pageNumber, {
    dataUrl,
    cachedAt: Date.now()
  });

  cacheOrder.push({ fileHash, pageNumber });

  while (getCacheSize() > MAX_CACHE_ITEMS) {
    const oldest = cacheOrder.shift();
    if (!oldest) {
      break;
    }
    removeCacheEntry(oldest.fileHash, oldest.pageNumber);
  }
};

export const renderPage = async (
  bytes: Uint8Array,
  pageNumber: number,
  scale: number,
  canvas: HTMLCanvasElement,
  signal?: AbortSignal
): Promise<void> => {
  ensureNotAborted(signal);
  const pdfjs = await loadPdfJs();

  const loadingTask = pdfjs.getDocument({ data: bytes });
  const onAbort = () => {
    loadingTask.destroy();
  };

  signal?.addEventListener("abort", onAbort, { once: true });

  const pdf = await loadingTask.promise;
  ensureNotAborted(signal);

  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Unable to obtain canvas context");
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const renderTask = page.render({
      canvasContext: context,
      viewport
    });

    const cancelRender = () => {
      renderTask.cancel();
    };

    signal?.addEventListener("abort", cancelRender, { once: true });
    await renderTask.promise;
    signal?.removeEventListener("abort", cancelRender);

    ensureNotAborted(signal);
  } finally {
    signal?.removeEventListener("abort", onAbort);
    await pdf.destroy();
  }
};

export const renderThumbnail = async (bytes: Uint8Array, pageNumber: number): Promise<string> => {
  clearStaleCache();

  const key = await createFileHash(bytes);
  const cachedThumbnail = thumbnailCache.get(key)?.get(pageNumber);
  if (cachedThumbnail) {
    return cachedThumbnail.dataUrl;
  }

  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;

  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const targetWidth = 150;
    const scale = targetWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to create thumbnail context");
    }

    canvas.width = Math.ceil(scaledViewport.width);
    canvas.height = Math.ceil(scaledViewport.height);

    await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
    const dataUrl = canvas.toDataURL("image/png");
    storeCachedThumbnail(key, pageNumber, dataUrl);
    return dataUrl;
  } finally {
    await pdf.destroy();
  }
};

export const getPageCount = async (bytes: Uint8Array): Promise<number> => {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;
  try {
    return pdf.numPages;
  } finally {
    await pdf.destroy();
  }
};

export const clearCache = (): void => {
  thumbnailCache.clear();
  cacheOrder.length = 0;
};
