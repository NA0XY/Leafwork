"use client";

import {
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  FileText,
  FolderOpen,
  GripVertical,
  Minus,
  PanelRightOpen,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { renderPage, renderThumbnail } from "@/lib/pdf/renderer";
import { compileSandboxToPdf } from "@/lib/pdf/sandbox/compiler";
import { formatMarkedPageNumbers } from "@/lib/pdf/sandbox/marked-pages";
import type { SandboxFile, SandboxPageRef } from "@/lib/pdf/sandbox/types";
import { trackToolActivity } from "@/lib/utils/activity";
import { cn } from "@/lib/utils/cn";
import { downloadBlob } from "@/lib/utils/file";
import { formatBytes, formatPageCount, truncateFilename } from "@/lib/utils/format";
import { SANDBOX_FILE_DRAG_MIME, useSandboxStore } from "@/store/sandbox-store";

type PageRowProps = {
  page: SandboxPageRef;
  file: SandboxFile;
  index: number;
  selected: boolean;
  marked: boolean;
  onToggle: () => void;
};

const formatActivePages = (pages: SandboxPageRef[], activePageIds: Set<string>): string => {
  const marked = pages
    .filter((page) => activePageIds.has(page.id))
    .map((page) => page.pageIndex + 1)
    .sort((a, b) => a - b);

  return formatMarkedPageNumbers(marked);
};

const WorkspacePageRow = ({ page, file, index, selected, marked, onToggle }: PageRowProps) => {
  const [src, setSrc] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const rowRef = useRef<HTMLButtonElement | null>(null);
  const active = selected || marked;

  useEffect(() => {
    const node = rowRef.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "1000px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || src !== null) return;

    let cancelled = false;
    void renderThumbnail(file.bytes, page.pageIndex + 1)
      .then((thumbnail) => {
        if (!cancelled) setSrc(thumbnail);
      })
      .catch(() => {
        if (!cancelled) setSrc("");
      });

    return () => {
      cancelled = true;
    };
  }, [file.bytes, page.pageIndex, src, visible]);

  return (
    <button
      ref={rowRef}
      type="button"
      className={cn(
        "grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-brutal border-2 border-ink bg-surface px-2 py-1.5 text-left",
        "transition-colors hover:bg-green-50",
        active && "border-primary bg-green-100 ring-1 ring-primary"
      )}
      aria-pressed={active}
      onClick={onToggle}
    >
      <span className="flex h-9 w-7 items-center justify-center overflow-hidden rounded-brutal border border-ink bg-paper">
        {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <FileText className="h-4 w-4 text-muted" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold">Page {page.pageIndex + 1}</span>
        <span className={cn("block truncate text-[11px]", active ? "font-semibold text-ink" : "text-muted")}>
          Output #{index + 1}
          {active ? " - Selected" : ""}
        </span>
      </span>
      <span className="text-[11px] font-semibold text-muted">{page.rotation ? `${page.rotation}deg` : ""}</span>
    </button>
  );
};

const ReaderPage = ({
  file,
  page,
  marked,
  zoom,
  onToggle
}: {
  file: SandboxFile;
  page: SandboxPageRef;
  marked: boolean;
  zoom: number;
  onToggle: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(Boolean(entry?.isIntersecting));
      },
      { rootMargin: "1200px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (!active) {
      canvas.width = 0;
      canvas.height = 0;
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setStatus("loading");

    void renderPage(file.bytes, page.pageIndex + 1, zoom, canvas, controller.signal)
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((error) => {
        if (!cancelled && !(error instanceof DOMException && error.name === "AbortError")) {
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [active, file.bytes, page.pageIndex, zoom]);

  return (
    <section ref={sectionRef} className="mx-auto min-h-[70vh] w-full max-w-[920px]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-bold">Page {page.pageIndex + 1}</p>
        <Button type="button" size="sm" variant={marked ? "primary" : "secondary"} onClick={onToggle}>
          {marked ? "Selected" : "Select page"}
        </Button>
      </div>
      <div
        className={cn(
          "relative overflow-auto rounded-brutal border-2 border-ink bg-paper p-3 shadow-brutal",
          marked && "border-primary bg-green-50"
        )}
      >
        {status !== "ready" ? (
          <div className="absolute inset-3 flex items-center justify-center rounded-brutal bg-surface/80 text-sm font-semibold text-muted">
            {status === "error" ? "Unable to render page" : status === "idle" ? "Page queued" : "Rendering page..."}
          </div>
        ) : null}
        <canvas ref={canvasRef} className="mx-auto block max-w-none rounded-sm bg-white" />
      </div>
    </section>
  );
};

const SandboxFileViewer = ({
  file,
  pages,
  selectedPageIds,
  markedPageIds,
  onClose,
  onTogglePage,
  onSelectAll,
  onClearPages,
  onRotatePages,
  onDeletePages
}: {
  file: SandboxFile;
  pages: SandboxPageRef[];
  selectedPageIds: Set<string>;
  markedPageIds: Set<string>;
  onClose: () => void;
  onTogglePage: (pageId: string) => void;
  onSelectAll: (pageIds: string[]) => void;
  onClearPages: (pageIds: string[]) => void;
  onRotatePages: (pageIds: string[], degrees: 90 | 180 | 270) => void;
  onDeletePages: (pageIds: string[]) => void;
}) => {
  const activePageIds = useMemo(() => new Set([...selectedPageIds, ...markedPageIds]), [markedPageIds, selectedPageIds]);
  const markedSummary = formatActivePages(pages, activePageIds);
  const pageIds = useMemo(() => pages.map((page) => page.id), [pages]);
  const selectedPageIdsForFile = useMemo(() => pageIds.filter((pageId) => activePageIds.has(pageId)), [activePageIds, pageIds]);
  const selectedCount = selectedPageIdsForFile.length;
  const [zoom, setZoom] = useState(1.25);
  const zoomLabel = `${Math.round(zoom * 100)}%`;

  return (
    <div className="fixed inset-0 z-50 bg-ink/50" role="dialog" aria-modal="true" aria-label={`View ${file.name}`}>
      <div className="absolute inset-x-3 bottom-3 top-3 mx-auto flex max-w-6xl flex-col overflow-hidden rounded-brutal border-2 border-ink bg-surface shadow-brutal">
        <div className="flex flex-col gap-3 border-b-2 border-ink bg-paper p-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Sandbox viewer</p>
            <h3 className="truncate text-lg font-bold" title={file.name}>
              {file.name}
            </h3>
            <p className="mt-1 text-xs text-muted">
              {formatPageCount(pages.length)}
              {markedSummary ? ` - Selected: ${markedSummary}` : " - No pages selected"}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="inline-flex items-center overflow-hidden rounded-brutal border-2 border-ink bg-surface">
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center border-r-2 border-ink disabled:opacity-50"
                aria-label="Zoom out"
                disabled={zoom <= 0.75}
                onClick={() => setZoom((value) => Math.max(0.75, Number((value - 0.15).toFixed(2))))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-16 px-2 text-center text-xs font-bold">{zoomLabel}</span>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center border-l-2 border-ink disabled:opacity-50"
                aria-label="Zoom in"
                disabled={zoom >= 2}
                onClick={() => setZoom((value) => Math.min(2, Number((value + 0.15).toFixed(2))))}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button type="button" size="sm" variant="secondary" disabled={!pages.length} onClick={() => onSelectAll(pageIds)}>
              Select all
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={!selectedCount} onClick={() => onClearPages(pageIds)}>
              Clear
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={!selectedCount} onClick={() => onRotatePages(selectedPageIdsForFile, 270)}>
              <RotateCcw className="h-3.5 w-3.5" />
              Rotate
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={!selectedCount} onClick={() => onRotatePages(selectedPageIdsForFile, 90)}>
              <RotateCw className="h-3.5 w-3.5" />
              Rotate
            </Button>
            <Button type="button" size="sm" variant="danger" disabled={!selectedCount} onClick={() => onDeletePages(selectedPageIdsForFile)}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
            <button
              type="button"
              title="Close viewer"
              aria-label="Close viewer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-brutal border-2 border-ink bg-surface"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-neutral-200 p-3 sm:p-5">
          <div className="space-y-8">
            {pages.map((page) => (
              <ReaderPage
                key={page.id}
                file={file}
                page={page}
                marked={markedPageIds.has(page.id) || selectedPageIds.has(page.id)}
                zoom={zoom}
                onToggle={() => onTogglePage(page.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SandboxRailContent = ({ onClose }: { onClose?: () => void }) => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [expandedFileIds, setExpandedFileIds] = useState<Set<string>>(new Set<string>());
  const [isDragging, setIsDragging] = useState(false);
  const [viewingFileId, setViewingFileId] = useState<string | null>(null);

  const {
    files,
    pages,
    selectedPageIds,
    markedPageIds,
    operations,
    isProcessing,
    processingProgress,
    processingMessage,
    error,
    addFiles,
    removeFile,
    togglePageSelection,
    clearFilePageMarks,
    selectPageIds,
    clearPageIds,
    deletePageIds,
    deleteSelectedPages,
    rotatePageIds,
    clearAll,
    setProcessing,
    setError
  } = useSandboxStore();

  const fileById = useMemo(() => new Map(files.map((file) => [file.id, file])), [files]);
  const pagesByFile = useMemo(() => {
    const grouped = new Map<string, SandboxPageRef[]>();
    pages.forEach((page) => {
      const current = grouped.get(page.fileId) ?? [];
      current.push(page);
      grouped.set(page.fileId, current);
    });
    return grouped;
  }, [pages]);

  const inputBytes = files.reduce((total, file) => total + file.size, 0);
  const activePageIds = useMemo(() => new Set([...selectedPageIds, ...markedPageIds]), [markedPageIds, selectedPageIds]);
  const selectedCount = activePageIds.size;
  const viewingFile = viewingFileId ? fileById.get(viewingFileId) : undefined;
  const viewingPages = viewingFileId ? pagesByFile.get(viewingFileId) ?? [] : [];

  const addIncomingFiles = useCallback(
    async (incoming: File[]) => {
      if (incoming.length) await addFiles(incoming);
    },
    [addFiles]
  );

  const toggleFile = useCallback((fileId: string) => {
    setExpandedFileIds((current) => {
      const next = new Set(current);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  }, []);

  const exportWorkspace = useCallback(async () => {
    setProcessing(true, 2, "Exporting storage...");
    const result = await compileSandboxToPdf(
      {
        files,
        pages,
        operations,
        filename: "leafwork_storage.pdf"
      },
      (percent, message) => setProcessing(true, percent, message)
    );
    setProcessing(false);

    if (!result.data) {
      const message = result.error?.message ?? "Unable to export storage.";
      setError(message);
      toast.error("Export failed", message);
      return;
    }

    downloadBlob(result.data.blob, result.data.filename);
    trackToolActivity({
      tool: "sandbox",
      fileName: result.data.filename,
      filesProcessed: files.length,
      inputBytes,
      outputBytes: result.data.blob.size
    });
    toast.success("Storage exported", `${formatPageCount(result.data.pageCount)} saved as ${formatBytes(result.data.blob.size)}.`);
  }, [files, inputBytes, operations, pages, setError, setProcessing, toast]);

  return (
    <div
      className={cn("flex h-full flex-col bg-surface", isDragging && "bg-green-50")}
      onDragOver={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);
        void addIncomingFiles(Array.from(event.dataTransfer.files ?? []));
      }}
    >
      <div className="border-b-2 border-ink p-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Storage</p>
            <h2 className="truncate text-base font-bold">Sandbox</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Add files"
              aria-label="Add files"
              className="inline-flex h-8 w-8 items-center justify-center rounded-brutal border-2 border-ink bg-paper"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </button>
            {onClose ? (
              <button
                type="button"
                title="Close storage"
                aria-label="Close storage"
                className="inline-flex h-8 w-8 items-center justify-center rounded-brutal border-2 border-ink bg-paper xl:hidden"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <Badge tone={files.length ? "success" : "default"} className="justify-center">
            {files.length} files
          </Badge>
          <Badge tone={pages.length ? "success" : "default"} className="justify-center">
            {pages.length} pages
          </Badge>
          <Badge tone={selectedCount ? "success" : "default"} className="justify-center">
            {selectedCount} sel
          </Badge>
        </div>

        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          multiple
          accept="application/pdf,image/png,image/jpeg"
          onChange={(event) => {
            const selected = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = "";
            void addIncomingFiles(selected);
          }}
        />
      </div>

      {isProcessing ? (
        <div className="border-b-2 border-ink bg-paper p-2.5">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold">
            <span className="truncate">{processingMessage}</span>
            <span>{Math.round(processingProgress)}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full border border-ink bg-surface">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(2, Math.min(100, processingProgress))}%` }} />
          </div>
        </div>
      ) : null}

      {error ? <div className="border-b-2 border-ink bg-red-100 p-2.5 text-xs font-semibold text-red-900">{error}</div> : null}

      <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
        {files.length ? (
          <div className="space-y-2">
            {files.map((file) => {
              const filePages = pagesByFile.get(file.id) ?? [];
              const expanded = expandedFileIds.has(file.id);
              const markedSummary = formatActivePages(filePages, activePageIds);
              return (
                <div
                  key={file.id}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "copy";
                    event.dataTransfer.setData(SANDBOX_FILE_DRAG_MIME, JSON.stringify([file.id]));
                    event.dataTransfer.setData("text/plain", file.name);
                  }}
                  className="rounded-brutal border-2 border-ink bg-paper"
                >
                  <div className="flex items-center gap-2 p-2">
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-brutal border-2 border-ink bg-surface"
                      aria-label={expanded ? "Collapse file" : "Expand file"}
                      onClick={() => toggleFile(file.id)}
                    >
                      {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </button>
                    <GripVertical className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                    <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => toggleFile(file.id)}>
                      <span className="block truncate text-sm font-bold" title={file.name}>
                        {truncateFilename(file.name, 26)}
                      </span>
                      <span className="block text-[11px] text-muted">
                        {formatPageCount(filePages.length)} / {formatBytes(file.size)}
                      </span>
                      {markedSummary ? (
                        <span className="mt-1 inline-flex rounded-brutal border border-ink bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold">
                          Selected: {markedSummary}
                        </span>
                      ) : null}
                    </button>
                    <button
                      type="button"
                      title={`View ${file.name}`}
                      aria-label={`View ${file.name}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-brutal border-2 border-ink bg-surface"
                      onClick={() => setViewingFileId(file.id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete file"
                      aria-label={`Delete ${file.name}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-brutal border-2 border-ink bg-surface"
                      onClick={() => removeFile(file.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {expanded ? (
                    <div className="space-y-1 border-t-2 border-ink p-2">
                      {filePages.map((page) => {
                        const outputIndex = pages.findIndex((candidate) => candidate.id === page.id);
                        const active = activePageIds.has(page.id);
                        return (
                          <WorkspacePageRow
                            key={page.id}
                            page={page}
                            file={fileById.get(page.fileId) ?? file}
                            index={outputIndex}
                            selected={active}
                            marked={markedPageIds.has(page.id)}
                            onToggle={() => togglePageSelection(page.id)}
                          />
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            className="flex min-h-52 w-full flex-col items-center justify-center gap-2 rounded-brutal border-2 border-dashed border-ink bg-paper p-4 text-center"
            onClick={() => inputRef.current?.click()}
          >
            <FolderOpen className="h-9 w-9 text-primary" />
            <span className="text-sm font-bold">Drop PDFs or images</span>
            <span className="text-xs text-muted">Drag stored files onto tools.</span>
          </button>
        )}
      </div>

      <div className="space-y-2 border-t-2 border-ink bg-paper p-2.5">
        <Button type="button" size="sm" variant="danger" disabled={!selectedCount} className="w-full" onClick={deleteSelectedPages}>
          <Trash2 className="h-3.5 w-3.5" />
          Delete selected pages
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={!pages.length} className="w-full" onClick={exportWorkspace}>
          <Download className="h-3.5 w-3.5" />
          Export storage
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={!files.length} className="w-full" onClick={clearAll}>
          Clear storage
        </Button>
      </div>

      {viewingFile ? (
        <SandboxFileViewer
          file={viewingFile}
          pages={viewingPages}
          selectedPageIds={selectedPageIds}
          markedPageIds={markedPageIds}
          onClose={() => setViewingFileId(null)}
          onTogglePage={togglePageSelection}
          onSelectAll={selectPageIds}
          onClearPages={(pageIds) => {
            clearPageIds(pageIds);
            clearFilePageMarks(viewingFile.id);
          }}
          onRotatePages={rotatePageIds}
          onDeletePages={(pageIds) => {
            deletePageIds(pageIds);
            if (pageIds.length >= viewingPages.length) {
              setViewingFileId(null);
            }
          }}
        />
      ) : null}
    </div>
  );
};

export const SandboxRail = () => {
  const [open, setOpen] = useState(false);
  const { pages, selectedPageIds } = useSandboxStore();

  return (
    <>
      <aside className="sticky top-20 hidden h-[calc(100dvh-5rem)] overflow-hidden rounded-brutal border-2 border-ink bg-surface shadow-brutal xl:block">
        <SandboxRailContent />
      </aside>

      <button
        type="button"
        className="fixed bottom-4 right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-brutal border-2 border-ink bg-accent text-sm font-bold shadow-brutal sm:w-auto sm:gap-2 sm:px-3 sm:py-2 xl:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open sandbox storage"
      >
        <PanelRightOpen className="h-4 w-4" />
        <span className="sr-only sm:not-sr-only">Storage</span>
        {pages.length ? <Badge>{selectedPageIds.size || pages.length}</Badge> : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-ink/50 xl:hidden" role="dialog" aria-modal="true" aria-label="Sandbox storage">
          <div className="absolute bottom-0 right-0 flex h-[88dvh] w-full max-w-md overflow-hidden rounded-t-brutal border-2 border-ink bg-surface shadow-brutal">
            <SandboxRailContent onClose={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
};
