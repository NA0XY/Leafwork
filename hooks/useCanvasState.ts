"use client";

import { useMemo } from "react";

import { useCanvasStore } from "@/store/canvas-store";

export const useCanvasState = () => {
  const files = useCanvasStore((state) => state.files);
  const selectedPages = useCanvasStore((state) => state.selectedPages);
  const operations = useCanvasStore((state) => state.operations);
  const activeToolPanel = useCanvasStore((state) => state.activeToolPanel);
  const isProcessing = useCanvasStore((state) => state.isProcessing);
  const processingProgress = useCanvasStore((state) => state.processingProgress);
  const error = useCanvasStore((state) => state.error);

  const actions = useMemo(
    () => ({
      addFiles: useCanvasStore.getState().addFiles,
      removeFile: useCanvasStore.getState().removeFile,
      movePage: useCanvasStore.getState().movePage,
      deletePage: useCanvasStore.getState().deletePage,
      rotatePage: useCanvasStore.getState().rotatePage,
      selectPage: useCanvasStore.getState().selectPage,
      deselectPage: useCanvasStore.getState().deselectPage,
      selectAll: useCanvasStore.getState().selectAll,
      deselectAll: useCanvasStore.getState().deselectAll,
      setActiveToolPanel: useCanvasStore.getState().setActiveToolPanel,
      setProcessing: useCanvasStore.getState().setProcessing,
      setError: useCanvasStore.getState().setError,
      clearAll: useCanvasStore.getState().clearAll,
      undo: useCanvasStore.getState().undo,
      redo: useCanvasStore.getState().redo
    }),
    []
  );

  return {
    files,
    selectedPages,
    operations,
    activeToolPanel,
    isProcessing,
    processingProgress,
    error,
    ...actions,
    totalPageCount: useCanvasStore.getState().totalPageCount(),
    selectedPageCount: useCanvasStore.getState().selectedPageCount(),
    canUndo: useCanvasStore.getState().canUndo(),
    canRedo: useCanvasStore.getState().canRedo()
  };
};
