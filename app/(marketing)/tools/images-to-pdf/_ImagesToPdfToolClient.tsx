"use client";

import JSZip from "jszip";
import { ArrowDown, ArrowUp, Download, FileArchive, FileText, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { ZoomablePreview } from "@/components/tools/ZoomablePreview";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { useToast } from "@/hooks/useToast";
import { imagesToIndividualPdfs, imagesToPdf, type ImagePdfLayout } from "@/lib/pdf/images-to-pdf";
import { trackToolActivity } from "@/lib/utils/activity";
import { cn } from "@/lib/utils/cn";
import { downloadBlob } from "@/lib/utils/file";
import { formatBytes, truncateFilename } from "@/lib/utils/format";

type ImageItem = {
  id: string;
  file: File;
  previewUrl: string;
};

type DownloadMode = "combined" | "files" | "zip" | "both";

const DOWNLOAD_OPTIONS = [
  { value: "combined", label: "One PDF", icon: FileText },
  { value: "files", label: "PDF files", icon: Download },
  { value: "zip", label: "ZIP", icon: FileArchive },
  { value: "both", label: "Files + ZIP", icon: Download }
] satisfies { value: DownloadMode; label: string; icon: typeof FileText }[];

const makeItem = (file: File, index: number): ImageItem => ({
  id: `${file.name}-${file.lastModified}-${file.size}-${index}-${crypto.randomUUID()}`,
  file,
  previewUrl: URL.createObjectURL(file)
});

const isSupportedImage = (file: File): boolean => {
  const type = file.type.toLowerCase();
  return type === "image/png" || type === "image/jpeg" || /\.(png|jpe?g)$/i.test(file.name);
};

export const ImagesToPdfToolClient = () => {
  const toast = useToast();
  const [items, setItems] = useState<ImageItem[]>([]);
  const [layout, setLayout] = useState<ImagePdfLayout>("fit-page");
  const [downloadMode, setDownloadMode] = useState<DownloadMode>("combined");
  const [busy, setBusy] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const itemsRef = useRef<ImageItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => () => {
    itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  const inputBytes = useMemo(() => items.reduce((total, item) => total + item.file.size, 0), [items]);

  const setFiles = (files: File[]) => {
    setItems((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return files.map(makeItem);
    });
  };

  const addFiles = useCallback((files: File[]) => {
    setItems((current) => [...current, ...files.map(makeItem)]);
  }, []);

  const appendImageFiles = useCallback(
    (incoming: File[]) => {
      const selected = incoming.filter(isSupportedImage);
      const skipped = incoming.length - selected.length;

      if (selected.length) {
        addFiles(selected);
      }

      if (skipped) {
        toast.error("Some files were skipped", "Images to PDF accepts PNG and JPG files only.");
      }
    },
    [addFiles, toast]
  );

  const handleAddInput = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    appendImageFiles(Array.from(input.files ?? []));
    input.value = "";
  };

  const handleImageDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDropActive(false);
      appendImageFiles(Array.from(event.dataTransfer.files ?? []));
    },
    [appendImageFiles]
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsDropActive(false);
  }, []);

  const removeItem = (id: string) => {
    setItems((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setItems((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item as ImageItem);
      return next;
    });
  };

  const downloadIndividual = async (files: File[], asZip: boolean) => {
    const result = await imagesToIndividualPdfs(files, { layout });
    if (!result.data) {
      toast.error("Conversion failed", result.error?.message ?? "Unable to create PDFs");
      return 0;
    }

    if (asZip) {
      const zip = new JSZip();
      result.data.forEach((entry) => zip.file(entry.filename, entry.blob));
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, "images_to_pdf_files.zip");
      return blob.size;
    }

    let outputBytes = 0;
    result.data.forEach((entry) => {
      outputBytes += entry.blob.size;
      downloadBlob(entry.blob, entry.filename);
    });
    return outputBytes;
  };

  if (!items.length) {
    return (
      <DropZone
        fileKind="image"
        accept="image/png,image/jpeg"
        label="Drop PNG or JPG images here"
        multiple
        onFiles={setFiles}
        onError={(message) => toast.error("Image rejected", message)}
      />
    );
  }

  return (
    <div
      className="space-y-4"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setIsDropActive(true);
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleImageDrop}
    >
      <section className="space-y-4 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{items.length} image(s) ready</h2>
            <p className="text-sm text-muted">{formatBytes(inputBytes)} total input</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setItems((current) => {
                current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
                return [];
              });
            }}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>

        <div
          className={cn(
            "flex flex-col gap-2 rounded-brutal border-2 border-dashed border-ink bg-paper p-3 transition-colors sm:flex-row sm:items-center sm:justify-between",
            isDropActive && "border-primary bg-green-100"
          )}
        >
          <p className="text-sm font-semibold text-muted">Drop more PNG or JPG images here.</p>
          <Button type="button" size="sm" variant="secondary" onClick={() => addInputRef.current?.click()}>
            Add more images
          </Button>
          <input
            ref={addInputRef}
            type="file"
            accept="image/png,image/jpeg"
            multiple
            onChange={handleAddInput}
            className="sr-only"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <article key={item.id} className="rounded-brutal border-2 border-ink bg-paper p-3">
              <ZoomablePreview
                src={item.previewUrl}
                alt={item.file.name}
                imageClassName="h-48 w-full rounded-brutal border border-ink bg-surface object-contain"
              />
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" title={item.file.name}>
                    {truncateFilename(item.file.name, 36)}
                  </p>
                  <p className="text-xs text-muted">{formatBytes(item.file.size)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    aria-label={`Move ${item.file.name} up`}
                    title="Move up"
                    disabled={index === 0}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-brutal border-2 border-ink bg-surface disabled:opacity-40"
                    onClick={() => moveItem(index, -1)}
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${item.file.name} down`}
                    title="Move down"
                    disabled={index === items.length - 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-brutal border-2 border-ink bg-surface disabled:opacity-40"
                    onClick={() => moveItem(index, 1)}
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${item.file.name}`}
                    title="Remove"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-brutal border-2 border-ink bg-red-100 text-red-900"
                    onClick={() => removeItem(item.id)}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Page layout</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant={layout === "fit-page" ? "primary" : "secondary"} onClick={() => setLayout("fit-page")}>
                Fit to page
              </Button>
              <Button type="button" size="sm" variant={layout === "original-size" ? "primary" : "secondary"} onClick={() => setLayout("original-size")}>
                Original size
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Download</p>
            <div className="flex flex-wrap gap-2">
              {DOWNLOAD_OPTIONS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={downloadMode === value ? "primary" : "secondary"}
                  onClick={() => setDownloadMode(value)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          className="w-full"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            const files = items.map((item) => item.file);
            let outputBytes = 0;

            if (downloadMode === "combined") {
              const result = await imagesToPdf(files, "images_combined.pdf", { layout });
              if (!result.data) {
                setBusy(false);
                toast.error("Conversion failed", result.error?.message ?? "Unable to create PDF");
                return;
              }
              outputBytes = result.data.blob.size;
              downloadBlob(result.data.blob, result.data.filename);
            }

            if (downloadMode === "files" || downloadMode === "both") {
              outputBytes += await downloadIndividual(files, false);
            }

            if (downloadMode === "zip" || downloadMode === "both") {
              outputBytes += await downloadIndividual(files, true);
            }

            trackToolActivity({
              tool: "images-to-pdf",
              fileName: downloadMode === "combined" ? "images_combined.pdf" : "images_to_pdf_files",
              filesProcessed: files.length,
              inputBytes,
              outputBytes
            });
            setBusy(false);
            toast.success("Images converted", `${files.length} image(s) processed`);
          }}
        >
          Convert {items.length} image(s)
        </Button>
      </section>
    </div>
  );
};
