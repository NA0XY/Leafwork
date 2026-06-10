"use client";

import { RotateCcw, RotateCw, Repeat } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { ZoomablePreview } from "@/components/tools/ZoomablePreview";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { useToast } from "@/hooks/useToast";
import { withPdfLib } from "@/lib/pdf/engine";
import { getPageCount, renderThumbnail } from "@/lib/pdf/renderer";
import { trackToolActivity } from "@/lib/utils/activity";
import { downloadBlob } from "@/lib/utils/file";

type Rotation = -90 | 90 | 180;

const normalizeRotationDelta = (rotation: Rotation): 90 | 180 | 270 => {
  if (rotation === -90) {
    return 270;
  }
  return rotation;
};

const formatRotation = (rotation: Rotation): string => {
  if (rotation === -90) {
    return "↺ 90 deg";
  }
  if (rotation === 90) {
    return "↻ 90 deg";
  }
  return "↻↻ 180 deg";
};

export const RotateToolClient = () => {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<"all" | "selected">("all");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [pageRotationPlan, setPageRotationPlan] = useState<Map<number, Rotation>>(new Map());
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
      setSelectedPages(new Set());
      setPageRotationPlan(new Map());

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

  const operationPlan = useMemo(() => {
    if (selectionMode === "all") {
      return Array.from({ length: pageCount }, (_, index) => ({
        pageIndex: index,
        delta: rotation
      }));
    }

    if (pageRotationPlan.size > 0) {
      return Array.from(pageRotationPlan.entries()).map(([pageIndex, delta]) => ({
        pageIndex,
        delta
      }));
    }

    return Array.from(selectedPages.values()).map((pageIndex) => ({
      pageIndex,
      delta: rotation
    }));
  }, [pageCount, pageRotationPlan, rotation, selectedPages, selectionMode]);

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
          setPageRotationPlan(new Map());
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

        {selectionMode === "selected" ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setSelectedPages(new Set(Array.from({ length: pageCount }, (_, index) => index)))}
            >
              Select all pages
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setPageRotationPlan(
                  new Map(Array.from({ length: pageCount }, (_, index) => [index, rotation] as [number, Rotation]))
                );
              }}
            >
              Set all pages: {formatRotation(rotation)}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedPages(new Set())}>
              Clear selection
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                if (!selectedPages.size) {
                  toast.info("No pages selected", "Select one or more pages first.");
                  return;
                }

                setPageRotationPlan((current) => {
                  const next = new Map(current);
                  selectedPages.forEach((pageIndex) => next.set(pageIndex, rotation));
                  return next;
                });
              }}
            >
              Set selected: {formatRotation(rotation)}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                setPageRotationPlan((current) => {
                  const next = new Map(current);
                  selectedPages.forEach((pageIndex) => next.delete(pageIndex));
                  return next;
                })
              }
            >
              Clear selected settings
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setPageRotationPlan(new Map())}>
              Clear all page settings
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {thumbnails.map((thumbnail, index) => {
            const selected = selectedPages.has(index);
            const plannedRotation = pageRotationPlan.get(index);
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
                <ZoomablePreview
                  src={thumbnail}
                  alt={`Page ${index + 1}`}
                  className="mb-2"
                  imageClassName="h-auto w-full rounded-brutal border border-ink"
                />
                <p className="text-xs font-semibold">Page {index + 1}</p>
                {plannedRotation ? (
                  <span className="absolute bottom-2 right-2 rounded-full border border-ink bg-yellow-200 px-2 py-0.5 text-[10px] font-bold">
                    {formatRotation(plannedRotation)}
                  </span>
                ) : selectionMode === "selected" && selected ? (
                  <span className="absolute bottom-2 right-2 rounded-full border border-ink bg-accent px-2 py-0.5 text-[10px] font-bold">
                    Selected
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          loading={busy}
          disabled={!operationPlan.length}
          onClick={async () => {
            setBusy(true);

            const result = await withPdfLib(async (pdfLib) => {
              const doc = await pdfLib.PDFDocument.load(bytes);

              operationPlan.forEach(({ pageIndex, delta }) => {
                const page = doc.getPage(pageIndex);
                const current = page.getRotation().angle;
                page.setRotation(pdfLib.degrees((current + normalizeRotationDelta(delta) + 360) % 360));
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
            trackToolActivity({
              tool: "rotate",
              fileName: file.name,
              filesProcessed: 1,
              inputBytes: file.size,
              outputBytes: result.data.size
            });
            toast.success("Rotated PDF downloaded");
          }}
        >
          Rotate and Download
        </Button>
      </section>
    </div>
  );
};
