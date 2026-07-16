"use client";

import JSZip from "jszip";
import {
  ArrowDown,
  ArrowUp,
  Download,
  EyeOff,
  FileArchive,
  FileImage,
  FileText,
  ImagePlus,
  Layers,
  Minimize2,
  RotateCw,
  Scissors,
  Stamp,
  Trash2,
  Undo2,
  Upload,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";

import { ZoomablePreview } from "@/components/tools/ZoomablePreview";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { clonePdfBytes, loadPdfJs } from "@/lib/pdf/pdfjs";
import { renderThumbnail } from "@/lib/pdf/renderer";
import { compileSandboxToPdf } from "@/lib/pdf/sandbox/compiler";
import type { SandboxFile, SandboxOperation, SandboxPageRef } from "@/lib/pdf/sandbox/types";
import type { WatermarkPosition } from "@/lib/pdf/types";
import { getSafeRasterScale } from "@/lib/validations/pdf-safety";
import { trackToolActivity } from "@/lib/utils/activity";
import { cn } from "@/lib/utils/cn";
import { downloadBlob } from "@/lib/utils/file";
import { formatBytes, formatPageCount, truncateFilename } from "@/lib/utils/format";
import { useSandboxStore } from "@/store/sandbox-store";

type ThumbnailProps = {
  page: SandboxPageRef;
  file?: SandboxFile;
  index: number;
  selected: boolean;
  dragging: boolean;
  onToggle: () => void;
  onMove: (toIndex: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
};

const watermarkPositions: WatermarkPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right"
];

const describeOperation = (operation: SandboxOperation): string => {
  if (operation.type === "reorder-pages") return `Moved page ${operation.fromIndex + 1} to ${operation.toIndex + 1}`;
  if (operation.type === "delete-pages") return `Deleted ${operation.pageIds.length} page${operation.pageIds.length === 1 ? "" : "s"}`;
  if (operation.type === "rotate-pages") return `Rotated ${operation.pageIds.length} page${operation.pageIds.length === 1 ? "" : "s"} ${operation.degrees}deg`;
  if (operation.type === "extract-selection") return `Kept ${operation.pageIds.length} selected page${operation.pageIds.length === 1 ? "" : "s"}`;
  if (operation.type === "watermark-text") return `Watermark: ${operation.options.text}`;
  if (operation.type === "signature") return "Placed signature";
  if (operation.type === "redact") return "Added redaction box";
  if (operation.type === "metadata-strip") return "Strip metadata on export";
  return `Compress final PDF to ${operation.target.targetKB ?? "auto"} KB`;
};

const fileKey = (file: File): string => `${file.name}-${file.size}-${file.lastModified}`;

const PageThumbnail = ({
  page,
  file,
  index,
  selected,
  dragging,
  onToggle,
  onMove,
  onDragStart,
  onDragEnd
}: ThumbnailProps) => {
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const itemRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = itemRef.current;
    if (!node || visible) {
      return;
    }

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
    if (!visible || !file || src || error) {
      return;
    }

    let cancelled = false;
    void renderThumbnail(file.bytes, page.pageIndex + 1)
      .then((thumbnail) => {
        if (!cancelled) {
          setSrc(thumbnail);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [error, file, page.pageIndex, src, visible]);

  return (
    <div
      ref={itemRef}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", page.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onMove(index);
      }}
      className={cn(
        "group rounded-brutal border-2 border-ink bg-surface p-2 shadow-brutal-sm transition-all",
        selected && "bg-green-100 ring-2 ring-primary",
        dragging && "opacity-40"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left text-xs font-bold"
          onClick={onToggle}
          title={file?.name}
        >
          {index + 1}. {truncateFilename(file?.name ?? "Missing file", 20)}
        </button>
        <Badge tone={selected ? "success" : "default"}>{selected ? "Selected" : `P${page.pageIndex + 1}`}</Badge>
      </div>

      <div
        role="button"
        tabIndex={0}
        className="block w-full"
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        aria-pressed={selected}
        aria-label={`Select page ${index + 1}`}
      >
        {src ? (
          <ZoomablePreview
            src={src}
            alt={`Page ${index + 1}`}
            className="border-2 border-ink bg-paper"
            imageClassName={cn("mx-auto h-44 w-full object-contain", page.rotation !== 0 && "rotate-1")}
          />
        ) : (
          <div className="flex h-44 items-center justify-center rounded-brutal border-2 border-ink bg-paper text-xs font-semibold text-muted">
            {error ? "Preview unavailable" : "Loading preview"}
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-muted">{page.rotation ? `${page.rotation}deg` : "0deg"}</span>
        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-brutal border-2 border-ink bg-paper"
            aria-label="Move page earlier"
            onClick={() => onMove(Math.max(0, index - 1))}
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded-brutal border-2 border-ink bg-paper"
            aria-label="Move page later"
            onClick={() => onMove(index + 1)}
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const SandboxToolClient = () => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const signatureRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [draggingPageId, setDraggingPageId] = useState<string | null>(null);
  const [filename, setFilename] = useState("leafwork_sandbox.pdf");
  const [watermarkText, setWatermarkText] = useState("Leafwork");
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>("center");
  const [targetKB, setTargetKB] = useState(0);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [exportWarnings, setExportWarnings] = useState<string[]>([]);

  const {
    files,
    pages,
    selectedPageIds,
    operations,
    isProcessing,
    processingProgress,
    processingMessage,
    error,
    addFiles,
    removeFile,
    togglePageSelection,
    selectAll,
    deselectAll,
    deleteSelectedPages,
    extractSelectedPages,
    rotateSelectedPages,
    movePage,
    addOperation,
    undo,
    redo,
    clearAll,
    setProcessing,
    setError,
    canUndo,
    canRedo
  } = useSandboxStore();

  const fileById = useMemo(() => new Map(files.map((file) => [file.id, file])), [files]);
  const selectedPages = useMemo(() => pages.filter((page) => selectedPageIds.has(page.id)), [pages, selectedPageIds]);
  const selectedCount = selectedPageIds.size;
  const inputBytes = files.reduce((total, file) => total + file.size, 0);

  const addIncomingFiles = useCallback(
    async (incoming: File[]) => {
      const unique = incoming.filter((file, index, all) => all.findIndex((candidate) => fileKey(candidate) === fileKey(file)) === index);
      if (!unique.length) {
        return;
      }
      await addFiles(unique);
    },
    [addFiles]
  );

  const compileCurrentSandbox = useCallback(async () => {
    setExportWarnings([]);
    setProcessing(true, 2, "Exporting sandbox...");
    const result = await compileSandboxToPdf(
      {
        files,
        pages,
        operations,
        filename
      },
      (percent, message) => setProcessing(true, percent, message)
    );
    setProcessing(false);

    if (!result.data) {
      const message = result.error?.message ?? "Unable to export sandbox PDF.";
      setError(message);
      toast.error("Export failed", message);
      return null;
    }

    setExportWarnings(result.data.warnings);
    return result.data;
  }, [files, filename, operations, pages, setError, setProcessing, toast]);

  const exportPdf = useCallback(async () => {
    const output = await compileCurrentSandbox();
    if (!output) {
      return;
    }

    downloadBlob(output.blob, output.filename);
    trackToolActivity({
      tool: "sandbox",
      fileName: output.filename,
      filesProcessed: files.length,
      inputBytes,
      outputBytes: output.blob.size
    });
    toast.success("Sandbox PDF downloaded", `${formatPageCount(output.pageCount)} exported as ${formatBytes(output.blob.size)}.`);
  }, [compileCurrentSandbox, files.length, inputBytes, toast]);

  const exportImagesZip = useCallback(async () => {
    const output = await compileCurrentSandbox();
    if (!output) {
      return;
    }

    setProcessing(true, 5, "Rendering PDF pages to images...");
    try {
      const pdfjs = await loadPdfJs();
      const task = pdfjs.getDocument({ data: clonePdfBytes(output.bytes) });
      const pdf = await task.promise;
      const zip = new JSZip();

      try {
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const safeScale = getSafeRasterScale(baseViewport.width, baseViewport.height, 2);
          const viewport = page.getViewport({ scale: safeScale.scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("Unable to render page image.");
          }

          await page.render({ canvasContext: context, viewport }).promise;
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((imageBlob) => {
              if (imageBlob) {
                resolve(imageBlob);
              } else {
                reject(new Error("Unable to encode page image."));
              }
            }, "image/png");
          });
          zip.file(`page-${String(pageNumber).padStart(3, "0")}.png`, blob);
          setProcessing(true, Math.round((pageNumber / pdf.numPages) * 80), "Rendering PDF pages to images...");
        }
      } finally {
        await pdf.destroy();
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, filename.replace(/\.pdf$/i, "") + "_images.zip");
      toast.success("Images ZIP downloaded", `${pdf.numPages} page image${pdf.numPages === 1 ? "" : "s"} exported.`);
    } catch (zipError) {
      const message = zipError instanceof Error ? zipError.message : "Unable to export page images.";
      setError(message);
      toast.error("Image export failed", message);
    } finally {
      setProcessing(false);
    }
  }, [compileCurrentSandbox, filename, setError, setProcessing, toast]);

  const handleSignatureFile = useCallback((file: File | undefined) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSignatureData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const selectedFirstPageId = selectedPages[0]?.id;

  return (
    <div className="space-y-4">
      <section
        className={cn(
          "rounded-brutal border-2 border-ink bg-surface p-3 shadow-brutal",
          isDraggingFiles && "bg-green-100"
        )}
        onDragOver={(event: DragEvent<HTMLElement>) => {
          event.preventDefault();
          setIsDraggingFiles(true);
        }}
        onDragLeave={(event: DragEvent<HTMLElement>) => {
          event.preventDefault();
          setIsDraggingFiles(false);
        }}
        onDrop={(event: DragEvent<HTMLElement>) => {
          event.preventDefault();
          setIsDraggingFiles(false);
          void addIncomingFiles(Array.from(event.dataTransfer.files ?? []));
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">{formatPageCount(pages.length)}</Badge>
            <Badge>{files.length} source{files.length === 1 ? "" : "s"}</Badge>
            <Badge>{selectedCount} selected</Badge>
            <Badge>{formatBytes(inputBytes)}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Add files
            </Button>
            <Button type="button" variant="ghost" disabled={!files.length} onClick={clearAll}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
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
      </section>

      {error ? (
        <div className="rounded-brutal border-2 border-danger bg-red-100 p-3 text-sm font-semibold text-red-900">{error}</div>
      ) : null}

      {isProcessing ? (
        <div className="rounded-brutal border-2 border-ink bg-paper p-3">
          <div className="flex items-center justify-between gap-3 text-sm font-semibold">
            <span>{processingMessage}</span>
            <span>{Math.round(processingProgress)}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full border border-ink bg-surface">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(2, Math.min(100, processingProgress))}%` }} />
          </div>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[17rem_minmax(0,1fr)_20rem]">
        <aside className="space-y-3">
          <div className="rounded-brutal border-2 border-ink bg-surface p-3 shadow-brutal">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Sources</h2>
            <div className="mt-3 space-y-2">
              {files.length ? (
                files.map((file) => (
                  <div key={file.id} className="rounded-brutal border-2 border-ink bg-paper p-2">
                    <div className="flex items-start gap-2">
                      {file.kind === "image" ? <ImagePlus className="mt-1 h-4 w-4 text-primary" /> : <FileText className="mt-1 h-4 w-4 text-primary" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold" title={file.name}>
                          {truncateFilename(file.name, 28)}
                        </p>
                        <p className="text-xs text-muted">
                          {formatPageCount(file.pageCount)} / {formatBytes(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-brutal border-2 border-ink bg-surface"
                        aria-label={`Remove ${file.name}`}
                        onClick={() => removeFile(file.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <button
                  type="button"
                  className="flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-brutal border-2 border-dashed border-ink bg-paper p-4 text-center"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 text-primary" />
                  <span className="text-sm font-bold">Drop PDFs or images</span>
                </button>
              )}
            </div>
          </div>
        </aside>

        <main className="min-w-0 rounded-brutal border-2 border-ink bg-paper p-3 shadow-brutal">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="secondary" disabled={!pages.length} onClick={selectAll}>
                Select all
              </Button>
              <Button type="button" size="sm" variant="ghost" disabled={!selectedCount} onClick={deselectAll}>
                Clear selection
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant="secondary" disabled={!canUndo()} onClick={undo}>
                <Undo2 className="h-3.5 w-3.5" />
                Undo
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!canRedo()} onClick={redo}>
                Redo
              </Button>
            </div>
          </div>

          {pages.length ? (
            <div className="grid max-h-[48rem] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {pages.map((page, index) => (
                <PageThumbnail
                  key={page.id}
                  page={page}
                  file={fileById.get(page.fileId)}
                  index={index}
                  selected={selectedPageIds.has(page.id)}
                  dragging={draggingPageId === page.id}
                  onToggle={() => togglePageSelection(page.id)}
                  onMove={(toIndex) => movePage(draggingPageId ?? page.id, toIndex)}
                  onDragStart={() => setDraggingPageId(page.id)}
                  onDragEnd={() => setDraggingPageId(null)}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[28rem] items-center justify-center rounded-brutal border-2 border-dashed border-ink bg-surface p-6 text-center">
              <div>
                <Layers className="mx-auto h-12 w-12 text-primary" />
                <p className="mt-3 text-lg font-bold">Sandbox is empty</p>
              </div>
            </div>
          )}
        </main>

        <aside className="space-y-3">
          <section className="rounded-brutal border-2 border-ink bg-surface p-3 shadow-brutal">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button type="button" size="sm" variant="secondary" disabled={!selectedCount} onClick={() => rotateSelectedPages(90)}>
                <RotateCw className="h-3.5 w-3.5" />
                Rotate
              </Button>
              <Button type="button" size="sm" variant="danger" disabled={!selectedCount} onClick={deleteSelectedPages}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!selectedCount} onClick={extractSelectedPages}>
                <Scissors className="h-3.5 w-3.5" />
                Extract
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  addOperation({
                    type: "metadata-strip"
                  })
                }
              >
                <EyeOff className="h-3.5 w-3.5" />
                Metadata
              </Button>
            </div>
          </section>

          <section className="space-y-3 rounded-brutal border-2 border-ink bg-surface p-3 shadow-brutal">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Watermark</h2>
            <Input value={watermarkText} onChange={(event) => setWatermarkText(event.target.value)} aria-label="Watermark text" />
            <select
              value={watermarkPosition}
              onChange={(event) => setWatermarkPosition(event.target.value as WatermarkPosition)}
              className="w-full rounded-brutal border-2 border-ink bg-surface px-3 py-2 text-sm shadow-brutal"
              aria-label="Watermark position"
            >
              {watermarkPositions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!watermarkText.trim()}
              onClick={() =>
                addOperation({
                  type: "watermark-text",
                  options: {
                    text: watermarkText.trim(),
                    position: watermarkPosition,
                    opacity: 0.35,
                    fontSize: 42,
                    rotation: 45,
                    color: { r: 0.1, g: 0.42, b: 0.24 }
                  }
                })
              }
            >
              <Stamp className="h-3.5 w-3.5" />
              Queue watermark
            </Button>
          </section>

          <section className="space-y-3 rounded-brutal border-2 border-ink bg-surface p-3 shadow-brutal">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Overlays</h2>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!selectedFirstPageId}
              onClick={() => {
                if (!selectedFirstPageId) return;
                addOperation({
                  type: "redact",
                  rect: { pageId: selectedFirstPageId, x: 0.22, y: 0.22, width: 0.36, height: 0.1 }
                });
              }}
            >
              <EyeOff className="h-3.5 w-3.5" />
              Redact selected
            </Button>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => signatureRef.current?.click()}>
                <FileImage className="h-3.5 w-3.5" />
                Signature image
              </Button>
              <input
                ref={signatureRef}
                type="file"
                className="sr-only"
                accept="image/png,image/jpeg"
                onChange={(event) => {
                  handleSignatureFile(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!selectedFirstPageId || !signatureData}
              onClick={() => {
                if (!selectedFirstPageId || !signatureData) return;
                addOperation({
                  type: "signature",
                  imageData: signatureData,
                  rect: { pageId: selectedFirstPageId, x: 0.58, y: 0.68, width: 0.28, height: 0.1 }
                });
              }}
            >
              Place signature
            </Button>
          </section>

          <section className="space-y-3 rounded-brutal border-2 border-ink bg-surface p-3 shadow-brutal">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Final Export</h2>
            <Input value={filename} onChange={(event) => setFilename(event.target.value)} aria-label="Output filename" />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                value={targetKB}
                onChange={(event) => setTargetKB(Number(event.target.value))}
                aria-label="Compression target KB"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  addOperation({
                    type: "compress-final",
                    target: {
                      targetKB: targetKB > 0 ? targetKB : undefined,
                      stripMetadata: true,
                      keepTextSharp: true,
                      allowRasterization: false
                    }
                  })
                }
              >
                <Minimize2 className="h-3.5 w-3.5" />
                Compress
              </Button>
            </div>
            <Button type="button" className="w-full" disabled={!pages.length} loading={isProcessing} onClick={exportPdf}>
              <Download className="h-4 w-4" />
              Export final PDF
            </Button>
            <Button type="button" className="w-full" variant="secondary" disabled={!pages.length} loading={isProcessing} onClick={exportImagesZip}>
              <FileArchive className="h-4 w-4" />
              Export images ZIP
            </Button>
          </section>

          <section className="rounded-brutal border-2 border-ink bg-surface p-3 shadow-brutal">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Timeline</h2>
            <ol className="mt-3 max-h-72 space-y-2 overflow-y-auto">
              {operations.length ? (
                operations.map((operation, index) => (
                  <li key={operation.id} className="rounded-brutal border-2 border-ink bg-paper p-2 text-xs font-semibold">
                    {index + 1}. {describeOperation(operation)}
                  </li>
                ))
              ) : (
                <li className="rounded-brutal border-2 border-ink bg-paper p-2 text-xs font-semibold text-muted">No queued operations</li>
              )}
            </ol>
          </section>
        </aside>
      </section>

      {exportWarnings.length ? (
        <section className="rounded-brutal border-2 border-ink bg-yellow-100 p-3 text-sm font-semibold">
          {exportWarnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </section>
      ) : null}
    </div>
  );
};
