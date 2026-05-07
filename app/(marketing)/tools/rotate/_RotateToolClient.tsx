"use client";

import { RotateCcw, RotateCw, Repeat } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { useToast } from "@/hooks/useToast";
import { withPdfLib } from "@/lib/pdf/engine";
import { getPageCount, renderThumbnail } from "@/lib/pdf/renderer";
import { downloadBlob } from "@/lib/utils/file";

type Rotation = -90 | 90 | 180;

export const RotateToolClient = () => {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<"all" | "selected">("all");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rotation, setRotation] = useState<Rotation>(90);
  const [busy, setBusy] = useState(false);

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

      const nextThumbs: string[] = [];
      for (let page = 1; page <= count; page += 1) {
        nextThumbs.push(await renderThumbnail(bytes, page));
      }

      if (!cancelled) {
        setThumbnails(nextThumbs);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [bytes]);

  const pagesToRotate = useMemo(() => {
    if (selectionMode === "all") {
      return Array.from({ length: pageCount }, (_, index) => index);
    }
    return Array.from(selectedPages.values());
  }, [pageCount, selectedPages, selectionMode]);

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
            setFile(next);
            setBytes(new Uint8Array(await next.arrayBuffer()));
          })();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <FileInfoCard
        file={file}
        bytes={bytes}
        onRemove={() => {
          setFile(null);
          setBytes(null);
          setThumbnails([]);
          setSelectedPages(new Set());
        }}
      />

      <section className="space-y-4 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant={rotation === -90 ? "primary" : "secondary"} onClick={() => setRotation(-90)}>
            <RotateCcw className="h-4 w-4" /> 90 deg
          </Button>
          <Button type="button" variant={rotation === 90 ? "primary" : "secondary"} onClick={() => setRotation(90)}>
            <RotateCw className="h-4 w-4" /> 90 deg
          </Button>
          <Button type="button" variant={rotation === 180 ? "primary" : "secondary"} onClick={() => setRotation(180)}>
            <Repeat className="h-4 w-4" /> 180 deg
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button type="button" size="sm" variant={selectionMode === "all" ? "primary" : "secondary"} onClick={() => setSelectionMode("all")}>
            Rotate all pages
          </Button>
          <Button
            type="button"
            size="sm"
            variant={selectionMode === "selected" ? "primary" : "secondary"}
            onClick={() => setSelectionMode("selected")}
          >
            Rotate selected pages
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {thumbnails.map((thumbnail, index) => {
            const selected = selectedPages.has(index);
            return (
              <button
                key={`rotate-thumb-${index}`}
                type="button"
                className={`relative rounded-brutal border-2 p-2 text-left shadow-brutal-sm ${selected ? "border-primary bg-green-100" : "border-ink bg-paper"}`}
                onClick={() => {
                  if (selectionMode !== "selected") {
                    return;
                  }
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
                <img src={thumbnail} alt={`Page ${index + 1}`} className="mb-2 h-auto w-full" />
                <p className="text-xs font-semibold">Page {index + 1}</p>
                {selectionMode === "selected" && selected ? (
                  <span className="absolute bottom-2 right-2 rounded-full border border-ink bg-accent px-2 py-0.5 text-[10px] font-bold">
                    Rotating
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          loading={busy}
          disabled={!pagesToRotate.length}
          onClick={async () => {
            setBusy(true);

            const result = await withPdfLib(async (pdfLib) => {
              const doc = await pdfLib.PDFDocument.load(bytes);

              pagesToRotate.forEach((pageIndex) => {
                const page = doc.getPage(pageIndex);
                const current = page.getRotation().angle;
                page.setRotation(pdfLib.degrees((current + rotation + 360) % 360));
              });

              const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
              return new Blob([output], { type: "application/pdf" });
            });

            setBusy(false);

            if (!result.data) {
              toast.error("Rotation failed", result.error?.message ?? "Unable to rotate pages");
              return;
            }

            downloadBlob(result.data, `${file.name.replace(/\.pdf$/i, "")}_rotated.pdf`);
            toast.success("Rotated PDF downloaded");
          }}
        >
          Rotate and Download
        </Button>
      </section>
    </div>
  );
};
