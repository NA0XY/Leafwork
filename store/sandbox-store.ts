"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";

import { imagesToIndividualPdfs } from "@/lib/pdf/images-to-pdf";
import { getPageCount } from "@/lib/pdf/renderer";
import type { SandboxFile, SandboxOperation, SandboxOperationInput, SandboxPageRef } from "@/lib/pdf/sandbox/types";
import {
  validateBrowserLocalFile,
  validateBrowserLocalPageBudget,
  validateBrowserLocalTotalBytes,
  validateImagePixelBudget
} from "@/lib/validations/pdf-safety";

type SandboxSnapshot = {
  pages: SandboxPageRef[];
  operations: SandboxOperation[];
};

type SandboxStore = {
  files: SandboxFile[];
  pages: SandboxPageRef[];
  selectedPageIds: Set<string>;
  markedPageIds: Set<string>;
  operations: SandboxOperation[];
  past: SandboxSnapshot[];
  future: SandboxSnapshot[];
  isProcessing: boolean;
  processingProgress: number;
  processingMessage: string;
  error: string | null;
  addFiles: (files: File[]) => Promise<void>;
  addGeneratedPdf: (name: string, blob: Blob) => Promise<void>;
  removeFile: (fileId: string) => void;
  togglePageSelection: (pageId: string) => void;
  togglePageMark: (pageId: string) => void;
  clearFilePageMarks: (fileId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  deleteSelectedPages: () => void;
  extractSelectedPages: () => void;
  rotateSelectedPages: (degrees: 90 | 180 | 270) => void;
  movePage: (pageId: string, toIndex: number) => void;
  addOperation: (operation: SandboxOperationInput) => void;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
  setProcessing: (isProcessing: boolean, progress?: number, message?: string) => void;
  setError: (error: string | null) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

const MAX_HISTORY = 50;

const isPdf = (file: File): boolean => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
const isImage = (file: File): boolean =>
  file.type === "image/png" ||
  file.type === "image/jpeg" ||
  /\.(png|jpe?g)$/i.test(file.name);

export const SANDBOX_FILE_DRAG_MIME = "application/x-leafwork-sandbox-file-ids";

export type SandboxFileMetadata = {
  source: "sandbox";
  sandboxFileId: string;
  name: string;
  markedPages: number[];
  pageCount: number;
};

const sandboxFileMetadata = new WeakMap<File, SandboxFileMetadata>();

export const getSandboxFileMetadata = (file: File): SandboxFileMetadata | undefined => sandboxFileMetadata.get(file);

export const getSandboxNativeFiles = (fileIds: string[]): File[] => {
  const { files, pages, markedPageIds } = useSandboxStore.getState();
  const fileById = new Map(files.map((file) => [file.id, file]));

  return fileIds
    .map((fileId) => fileById.get(fileId))
    .filter((file): file is SandboxFile => Boolean(file))
    .map((file) => {
      const nativeFile = new File([file.bytes.slice()], file.name, { type: "application/pdf" });
      const markedPages = pages
        .filter((page) => page.fileId === file.id && markedPageIds.has(page.id))
        .map((page) => page.pageIndex + 1)
        .sort((a, b) => a - b);

      sandboxFileMetadata.set(nativeFile, {
        source: "sandbox",
        sandboxFileId: file.id,
        name: file.name,
        markedPages,
        pageCount: file.pageCount
      });

      return nativeFile;
    });
};

const makePages = (file: SandboxFile): SandboxPageRef[] =>
  Array.from({ length: file.pageCount }, (_, pageIndex) => ({
    id: nanoid(),
    fileId: file.id,
    pageIndex,
    rotation: 0
  }));

const pushSnapshot = (state: Pick<SandboxStore, "pages" | "operations" | "past">): SandboxSnapshot[] =>
  [...state.past, { pages: state.pages, operations: state.operations }].slice(-MAX_HISTORY);

const withOperation = (
  state: SandboxStore,
  operation: SandboxOperation,
  pages: SandboxPageRef[]
): Pick<SandboxStore, "operations" | "pages" | "past" | "future" | "selectedPageIds" | "markedPageIds"> => ({
  operations: [...state.operations, operation],
  pages,
  past: pushSnapshot(state),
  future: [],
  selectedPageIds: new Set<string>(),
  markedPageIds: new Set([...state.markedPageIds].filter((pageId) => pages.some((page) => page.id === pageId)))
});

export const useSandboxStore = create<SandboxStore>((set, get) => ({
  files: [],
  pages: [],
  selectedPageIds: new Set<string>(),
  markedPageIds: new Set<string>(),
  operations: [],
  past: [],
  future: [],
  isProcessing: false,
  processingProgress: 0,
  processingMessage: "Preparing sandbox...",
  error: null,

  addFiles: async (files) => {
    set({ error: null, isProcessing: true, processingProgress: 5, processingMessage: "Loading files into sandbox..." });

    try {
      const loadedFiles: SandboxFile[] = [];
      const existingBytes = get().files.reduce((total, file) => total + file.size, 0);
      const incomingBytes = files.reduce((total, file) => total + file.size, 0);
      const totalBudgetError = validateBrowserLocalTotalBytes(existingBytes, incomingBytes);
      if (totalBudgetError) {
        throw new Error(totalBudgetError);
      }

      for (const file of files) {
        const fileBudgetError = validateBrowserLocalFile(file, { kind: isImage(file) ? "image" : "pdf" });
        if (fileBudgetError) {
          throw new Error(fileBudgetError);
        }

        if (isPdf(file)) {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const pageCount = await getPageCount(bytes);
          const pageBudgetError = validateBrowserLocalPageBudget(get().pages.length + loadedFiles.reduce((total, loaded) => total + loaded.pageCount, 0) + pageCount, "This sandbox");
          if (pageBudgetError) {
            throw new Error(pageBudgetError);
          }
          loadedFiles.push({
            id: nanoid(),
            name: file.name,
            bytes,
            pageCount,
            size: file.size,
            kind: "pdf"
          });
        } else if (isImage(file)) {
          const pixelBudgetError = await validateImagePixelBudget(file);
          if (pixelBudgetError) {
            throw new Error(pixelBudgetError);
          }

          const output = await imagesToIndividualPdfs([file], { layout: "fit-page" });
          const converted = output.data?.[0];
          if (!converted) {
            throw output.error ?? new Error(`Unable to convert ${file.name} into a sandbox page.`);
          }
          loadedFiles.push({
            id: nanoid(),
            name: converted.filename,
            bytes: new Uint8Array(await converted.blob.arrayBuffer()),
            pageCount: converted.pageCount,
            size: converted.blob.size,
            kind: "image"
          });
        }
      }

      if (!loadedFiles.length) {
        set({ isProcessing: false, error: "Add PDFs, PNG images, or JPG images." });
        return;
      }

      set((state) => ({
        files: [...state.files, ...loadedFiles],
        pages: [...state.pages, ...loadedFiles.flatMap(makePages)],
        isProcessing: false,
        processingProgress: 0,
        processingMessage: "Preparing sandbox..."
      }));
    } catch (error) {
      set({
        isProcessing: false,
        error: error instanceof Error ? error.message : "Unable to load files into sandbox."
      });
    }
  },

  addGeneratedPdf: async (name, blob) => {
    const file = new File([blob], name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`, { type: "application/pdf" });
    await get().addFiles([file]);
  },

  removeFile: (fileId) => {
    set((state) => {
      const nextPages = state.pages.filter((page) => page.fileId !== fileId);
      return {
        files: state.files.filter((file) => file.id !== fileId),
        pages: nextPages,
        selectedPageIds: new Set([...state.selectedPageIds].filter((pageId) => nextPages.some((page) => page.id === pageId))),
        markedPageIds: new Set([...state.markedPageIds].filter((pageId) => nextPages.some((page) => page.id === pageId))),
        past: pushSnapshot(state),
        future: []
      };
    });
  },

  togglePageSelection: (pageId) => {
    set((state) => {
      const next = new Set(state.selectedPageIds);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return { selectedPageIds: next };
    });
  },

  togglePageMark: (pageId) => {
    set((state) => {
      const next = new Set(state.markedPageIds);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return { markedPageIds: next };
    });
  },

  clearFilePageMarks: (fileId) => {
    set((state) => {
      const filePageIds = new Set(state.pages.filter((page) => page.fileId === fileId).map((page) => page.id));
      return {
        markedPageIds: new Set([...state.markedPageIds].filter((pageId) => !filePageIds.has(pageId)))
      };
    });
  },

  selectAll: () => set((state) => ({ selectedPageIds: new Set(state.pages.map((page) => page.id)) })),
  deselectAll: () => set({ selectedPageIds: new Set<string>() }),

  deleteSelectedPages: () => {
    const state = get();
    const pageIds = [...state.selectedPageIds];
    if (!pageIds.length) {
      return;
    }

    const operation: SandboxOperation = {
      id: nanoid(),
      type: "delete-pages",
      pageIds,
      timestamp: Date.now()
    };

    set(withOperation(state, operation, state.pages.filter((page) => !state.selectedPageIds.has(page.id))));
  },

  extractSelectedPages: () => {
    const state = get();
    const pageIds = [...state.selectedPageIds];
    if (!pageIds.length) {
      return;
    }

    const operation: SandboxOperation = {
      id: nanoid(),
      type: "extract-selection",
      pageIds,
      timestamp: Date.now()
    };

    set(withOperation(state, operation, state.pages.filter((page) => state.selectedPageIds.has(page.id))));
  },

  rotateSelectedPages: (degrees) => {
    const state = get();
    const pageIds = [...state.selectedPageIds];
    if (!pageIds.length) {
      return;
    }

    const operation: SandboxOperation = {
      id: nanoid(),
      type: "rotate-pages",
      pageIds,
      degrees,
      timestamp: Date.now()
    };

    const selected = state.selectedPageIds;
    const pages = state.pages.map((page) => {
      if (!selected.has(page.id)) {
        return page;
      }
      const rotation = ((page.rotation + degrees) % 360) as 0 | 90 | 180 | 270;
      return { ...page, rotation };
    });

    set(withOperation(state, operation, pages));
  },

  movePage: (pageId, toIndex) => {
    const state = get();
    const fromIndex = state.pages.findIndex((page) => page.id === pageId);
    if (fromIndex < 0) {
      return;
    }
    const boundedToIndex = Math.max(0, Math.min(state.pages.length - 1, toIndex));
    if (fromIndex === boundedToIndex) {
      return;
    }

    const pages = [...state.pages];
    const [page] = pages.splice(fromIndex, 1);
    if (!page) {
      return;
    }
    pages.splice(boundedToIndex, 0, page);

    const operation: SandboxOperation = {
      id: nanoid(),
      type: "reorder-pages",
      pageId,
      fromIndex,
      toIndex: boundedToIndex,
      timestamp: Date.now()
    };

    set(withOperation(state, operation, pages));
  },

  addOperation: (operationInput) => {
    const state = get();
    const operation = {
      ...operationInput,
      id: nanoid(),
      timestamp: Date.now()
    } as SandboxOperation;

    set({
      operations: [...state.operations, operation],
      past: pushSnapshot(state),
      future: []
    });
  },

  undo: () => {
    set((state) => {
      const previous = state.past.at(-1);
      if (!previous) {
        return state;
      }
      return {
        pages: previous.pages,
        operations: previous.operations,
        past: state.past.slice(0, -1),
        future: [{ pages: state.pages, operations: state.operations }, ...state.future].slice(0, MAX_HISTORY),
        selectedPageIds: new Set<string>()
      };
    });
  },

  redo: () => {
    set((state) => {
      const next = state.future.at(0);
      if (!next) {
        return state;
      }
      return {
        pages: next.pages,
        operations: next.operations,
        past: [...state.past, { pages: state.pages, operations: state.operations }].slice(-MAX_HISTORY),
        future: state.future.slice(1),
        selectedPageIds: new Set<string>()
      };
    });
  },

  clearAll: () =>
    set({
      files: [],
      pages: [],
      selectedPageIds: new Set<string>(),
      markedPageIds: new Set<string>(),
      operations: [],
      past: [],
      future: [],
      isProcessing: false,
      processingProgress: 0,
      processingMessage: "Preparing sandbox...",
      error: null
    }),

  setProcessing: (isProcessing, processingProgress = 0, processingMessage = "Preparing sandbox...") =>
    set({ isProcessing, processingProgress, processingMessage }),

  setError: (error) => set({ error }),

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0
}));
