"use client";

import JSZip from "jszip";
import { Download, Image as ImageIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { LazyPdfThumbnail } from "@/components/tools/LazyPdfThumbnail";
import { ReplaceFileDropTarget } from "@/components/tools/ReplaceFileDropTarget";
import { ZoomablePreview } from "@/components/tools/ZoomablePreview";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { useToast } from "@/hooks/useToast";
import { clonePdfBytes, loadPdfJs } from "@/lib/pdf/pdfjs";
import { getPageCount, renderPage } from "@/lib/pdf/renderer";
import { trackToolActivity } from "@/lib/utils/activity";
import { downloadBlob } from "@/lib/utils/file";
import { getSafeRasterScale } from "@/lib/validations/pdf-safety";

type ConvertedImage = {
  page: number;
  filename: string;
  dataUrl: string;
  blob: Blob;
};

const SCALE_MAP = {
  screen: 1,
  print: 1.5,
  high: 3
} as const;

const getSafePageScale = async (bytes: Uint8Array, pageNumber: number, requestedScale: number) => {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: clonePdfBytes(bytes) });
  const pdf = await loadingTask.promise;

  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    return getSafeRasterScale(viewport.width, viewport.height, requestedScale);
  } finally {
    await pdf.destroy();
  }
};

export const PdfToImagesToolClient = () => {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [resolution, setResolution] = useState<"screen" | "print" | "high">("screen");
  const [busy, setBusy] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [results, setResults] = useState<ConvertedImage[]>([]);

  useEffect(() => {
    if (!bytes) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      const count = await getPageCount(bytes);
      if (cancelled) {
        return;
      }

      setPageCount(count);
      setSelectedPages(new Set(Array.from({ length: count }, (_, index) => index)));
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [bytes, toast]);

  const selectedList = useMemo(() => Array.from(selectedPages.values()).sort((a, b) => a - b), [selectedPages]);

  const loadFile = async (next: File) => {
    setFile(next);
    setBytes(new Uint8Array(await next.arrayBuffer()));
    setPageCount(0);
    setResults([]);
  };

  if (!file || !bytes) {
    return (
      <DropZone
        multiple={false}
        onFiles={(files) => {
          const next = files[0];
          if (!next) {
            return;
          }

          void (async () => {
            await loadFile(next);
          })();
        }}
      />
    );
  }

  return (
    <ReplaceFileDropTarget onFile={loadFile}>
      <FileInfoCard
        file={file}
        bytes={bytes}
        onRemove={() => {
          setFile(null);
          setBytes(null);
          setPageCount(0);
          setResults([]);
          setSelectedPages(new Set());
        }}
      />

      <section className="space-y-4 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
        <div className="flex flex-wrap gap-2 text-sm">
          <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedPages(new Set(Array.from({ length: pageCount }, (_, index) => index)))}>
            Select all
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedPages(new Set())}>
            Deselect all
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Format</p>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={format === "png" ? "primary" : "secondary"} onClick={() => setFormat("png")}>
                PNG
              </Button>
              <Button type="button" size="sm" variant={format === "jpg" ? "primary" : "secondary"} onClick={() => setFormat("jpg")}>
                JPG
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Resolution</p>
            <div className="flex flex-wrap gap-2">
              {[
                ["screen", "Screen (96 DPI)"],
                ["print", "Print (150 DPI)"],
                ["high", "High (300 DPI)"]
              ].map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={resolution === value ? "primary" : "secondary"}
                  onClick={() => setResolution(value as "screen" | "print" | "high")}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: pageCount }, (_, index) => {
            const selected = selectedPages.has(index);
            return (
              <LazyPdfThumbnail
                key={`thumb-${index + 1}`}
                bytes={bytes}
                pageNumber={index + 1}
                selected={selected}
                onClick={() => {
                  setSelectedPages((current) => {
                    const next = new Set(current);
                    if (next.has(index)) {
                      next.delete(index);
                    } else {
                      next.add(index);
                    }
                    return next;
                  });
                }}
              >
                <p className="text-xs font-semibold">Page {index + 1}</p>
                {selected ? <span className="absolute right-2 top-2 rounded-full bg-accent px-2 text-[10px] font-bold">On</span> : null}
              </LazyPdfThumbnail>
            );
          })}
        </div>

        <Button
          type="button"
          loading={busy}
          disabled={!selectedList.length}
          onClick={async () => {
            setBusy(true);
            setResults([]);

            const nextResults: ConvertedImage[] = [];
            const mimeType = format === "png" ? "image/png" : "image/jpeg";
            const quality = format === "png" ? 1 : 0.92;

            for (let i = 0; i < selectedList.length; i += 1) {
              const pageIndex = selectedList[i] as number;
              const pageNumber = pageIndex + 1;
              setProgressText(`Converting page ${i + 1} of ${selectedList.length}...`);

              const canvas = document.createElement("canvas");
              const safeScale = await getSafePageScale(bytes, pageNumber, SCALE_MAP[resolution]);
              if (safeScale.wasConstrained) {
                toast.info("Resolution reduced", `Page ${pageNumber} was scaled down to stay within the browser pixel budget.`);
              }

              await renderPage(bytes, pageNumber, safeScale.scale, canvas);
              const dataUrl = canvas.toDataURL(mimeType, quality);

              const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob(
                  (value) => {
                    resolve(value ?? new Blob());
                  },
                  mimeType,
                  quality
                );
              });

              nextResults.push({
                page: pageNumber,
                filename: `${file.name.replace(/\.pdf$/i, "")}_page_${pageNumber}.${format}`,
                dataUrl,
                blob
              });
            }

            setBusy(false);
            setProgressText("");
            setResults(nextResults);
            toast.success("Pages converted", `${nextResults.length} image files ready`);
          }}
        >
          Convert {selectedList.length} selected pages
        </Button>

        {progressText ? <p className="text-sm text-muted">{progressText}</p> : null}
      </section>

      {results.length ? (
        <section className="space-y-3 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-bold">Converted images</h2>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={async () => {
                const zip = new JSZip();
                results.forEach((entry) => {
                  zip.file(entry.filename, entry.blob);
                });
                const blob = await zip.generateAsync({ type: "blob" });
                downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}_images.zip`);
                trackToolActivity({
                  tool: "pdf-to-images",
                  fileName: file.name,
                  filesProcessed: selectedList.length,
                  inputBytes: file.size,
                  outputBytes: blob.size
                });
              }}
            >
              <Download className="h-3.5 w-3.5" /> Download all as ZIP
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((entry) => (
              <article key={entry.filename} className="rounded-brutal border-2 border-ink bg-paper p-2">
                <ZoomablePreview
                  src={entry.dataUrl}
                  alt={entry.filename}
                  imageClassName="h-auto w-full rounded-brutal border border-ink"
                />
                <p className="mt-2 text-xs font-semibold">{entry.filename}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="mt-2 w-full"
                  onClick={() => {
                    downloadBlob(entry.blob, entry.filename);
                    trackToolActivity({
                      tool: "pdf-to-images",
                      fileName: entry.filename,
                      filesProcessed: 1,
                      inputBytes: 0,
                      outputBytes: entry.blob.size
                    });
                  }}
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Download
                </Button>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </ReplaceFileDropTarget>
  );
};
