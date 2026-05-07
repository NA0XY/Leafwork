"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";

type LoadState = "idle" | "loading" | "ready" | "error";

export type CanvasFile = {
  id: string;
  name: string;
  bytes: Uint8Array;
  pageCount: number;
  thumbnails: string[];
  loadState: LoadState;
};

export type ToolPanel =
  | "merge"
  | "split"
  | "compress"
  | "watermark"
  | "sign"
  | "redact"
  | "rotate"
  | "metadata"
  | "pdf-to-word"
  | "pdf-to-images";

export type QueuedOperation = {
  id: string;
  type: string;
  payload: Record<string, string | number | boolean | null>;
  timestamp: number;
};

type OperationStacks = {
  past: QueuedOperation[];
  future: QueuedOperation[];
};

type CanvasStore = {
  files: CanvasFile[];
  pendingFileNames: string[];
  selectedPages: Set<string>;
  operations: QueuedOperation[];
  activeToolPanel: ToolPanel | null;
  isProcessing: boolean;
  processingProgress: number;
  processingMessage: string;
  error: string | null;
  operationStacks: OperationStacks;
  addFiles: (files: File[]) => Promise<void>;
  setPendingFileNames: (names: string[]) => void;
  clearPendingFileNames: () => void;
  removeFile: (fileId: string) => void;
  movePage: (fromFileId: string, fromPage: number, toFileId: string, toPage: number) => void;
  deletePage: (fileId: string, pageIndex: number) => void;
  rotatePage: (fileId: string, pageIndex: number, degrees: 90 | 180 | 270) => void;
  selectPage: (pageKey: string) => void;
  deselectPage: (pageKey: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setActiveToolPanel: (panel: ToolPanel | null) => void;
  setProcessing: (isProcessing: boolean, progress?: number, message?: string) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
  undo: () => void;
  redo: () => void;
  totalPageCount: () => number;
  selectedPageCount: () => number;
  canUndo: () => boolean;
  canRedo: () => boolean;
};

const MAX_HISTORY = 20;
const OPERATIONS_KEY = "leafwork:operations";

const serializeOperations = (operations: QueuedOperation[]): void => {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(OPERATIONS_KEY, JSON.stringify(operations));
};

const deserializeOperations = (): QueuedOperation[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = sessionStorage.getItem(OPERATIONS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as QueuedOperation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const pushOperation = (
  operationStacks: OperationStacks,
  operation: QueuedOperation
): OperationStacks => {
  const nextPast = [...operationStacks.past, operation].slice(-MAX_HISTORY);
  return {
    past: nextPast,
    future: []
  };
};

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  files: [],
  pendingFileNames: [],
  selectedPages: new Set<string>(),
  operations: deserializeOperations(),
  activeToolPanel: null,
  isProcessing: false,
  processingProgress: 0,
  processingMessage: "Processing PDF...",
  error: null,
  operationStacks: {
    past: deserializeOperations(),
    future: []
  },

  addFiles: async (files) => {
    set({ error: null });

    const loaded = await Promise.all(
      files.map(async (file): Promise<CanvasFile> => {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const pageCount = Math.max(1, (new TextDecoder("latin1").decode(bytes).match(/\/Type\s*\/Page(?!s)/g) ?? []).length);

        return {
          id: nanoid(),
          name: file.name,
          bytes,
          pageCount,
          thumbnails: [],
          loadState: "ready"
        };
      })
    );

    set((state) => ({
      files: [...state.files, ...loaded],
      pendingFileNames: loaded.map((file) => file.name)
    }));
  },

  setPendingFileNames: (names) =>
    set({
      pendingFileNames: names
    }),

  clearPendingFileNames: () =>
    set({
      pendingFileNames: []
    }),

  removeFile: (fileId) => {
    set((state) => ({
      files: state.files.filter((file) => file.id !== fileId),
      selectedPages: new Set([...state.selectedPages].filter((key) => !key.startsWith(`${fileId}:`)))
    }));
  },

  movePage: (fromFileId, fromPage, toFileId, toPage) => {
    const operation: QueuedOperation = {
      id: nanoid(),
      type: "move_page",
      payload: { fromFileId, fromPage, toFileId, toPage },
      timestamp: Date.now()
    };

    set((state) => {
      const operations = [...state.operations, operation].slice(-MAX_HISTORY);
      serializeOperations(operations);
      return {
        operations,
        operationStacks: pushOperation(state.operationStacks, operation)
      };
    });
  },

  deletePage: (fileId, pageIndex) => {
    const operation: QueuedOperation = {
      id: nanoid(),
      type: "delete_page",
      payload: { fileId, pageIndex },
      timestamp: Date.now()
    };

    set((state) => {
      const operations = [...state.operations, operation].slice(-MAX_HISTORY);
      serializeOperations(operations);
      return {
        operations,
        operationStacks: pushOperation(state.operationStacks, operation)
      };
    });
  },

  rotatePage: (fileId, pageIndex, degrees) => {
    const operation: QueuedOperation = {
      id: nanoid(),
      type: "rotate_page",
      payload: { fileId, pageIndex, degrees },
      timestamp: Date.now()
    };

    set((state) => {
      const operations = [...state.operations, operation].slice(-MAX_HISTORY);
      serializeOperations(operations);
      return {
        operations,
        operationStacks: pushOperation(state.operationStacks, operation)
      };
    });
  },

  selectPage: (pageKey) => {
    set((state) => {
      const next = new Set(state.selectedPages);
      next.add(pageKey);
      return { selectedPages: next };
    });
  },

  deselectPage: (pageKey) => {
    set((state) => {
      const next = new Set(state.selectedPages);
      next.delete(pageKey);
      return { selectedPages: next };
    });
  },

  selectAll: () => {
    const files = get().files;
    const next = new Set<string>();

    files.forEach((file) => {
      for (let page = 0; page < file.pageCount; page += 1) {
        next.add(`${file.id}:${page}`);
      }
    });

    set({ selectedPages: next });
  },

  deselectAll: () => set({ selectedPages: new Set<string>() }),

  setActiveToolPanel: (panel) => set({ activeToolPanel: panel }),

  setProcessing: (isProcessing, progress = 0, message = "Processing PDF...") => {
    set({ isProcessing, processingProgress: progress, processingMessage: message });
  },

  setError: (error) => set({ error }),

  clearAll: () => {
    serializeOperations([]);
    set({
      files: [],
      selectedPages: new Set<string>(),
      operations: [],
      operationStacks: { past: [], future: [] },
      activeToolPanel: null,
      error: null,
      processingProgress: 0,
      processingMessage: "Processing PDF...",
      pendingFileNames: [],
      isProcessing: false
    });
  },

  undo: () => {
    set((state) => {
      const last = state.operationStacks.past.at(-1);
      if (!last) {
        return state;
      }

      const past = state.operationStacks.past.slice(0, -1);
      const future = [last, ...state.operationStacks.future];
      const operations = state.operations.filter((operation) => operation.id !== last.id);

      serializeOperations(operations);

      return {
        operations,
        operationStacks: { past, future }
      };
    });
  },

  redo: () => {
    set((state) => {
      const next = state.operationStacks.future.at(0);
      if (!next) {
        return state;
      }

      const future = state.operationStacks.future.slice(1);
      const past = [...state.operationStacks.past, next].slice(-MAX_HISTORY);
      const operations = [...state.operations, next].slice(-MAX_HISTORY);

      serializeOperations(operations);

      return {
        operations,
        operationStacks: { past, future }
      };
    });
  },

  totalPageCount: () => get().files.reduce((total, file) => total + file.pageCount, 0),

  selectedPageCount: () => get().selectedPages.size,

  canUndo: () => get().operationStacks.past.length > 0,

  canRedo: () => get().operationStacks.future.length > 0
}));
