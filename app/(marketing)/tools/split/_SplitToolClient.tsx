"use client";

import JSZip from "jszip";
import { useEffect, useMemo, useState } from "react";

import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { useToast } from "@/hooks/useToast";
import { extractPages, splitByPages, splitEveryN, type PageRange } from "@/lib/pdf/split";
import { getPageCount, renderThumbnail } from "@/lib/pdf/renderer";
import { downloadBlob } from "@/lib/utils/file";
import { formatPageCount } from "@/lib/utils/format";

const parseRanges = (value: string): PageRange[] =>
  value
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [startRaw, endRaw] = chunk.split("-");
      const start = Number(startRaw);
      const end = Number(endRaw ?? startRaw);
      return { start, end };
    })
    .filter((range) => Number.isFinite(range.start) && Number.isFinite(range.end));

const rangesAreValid = (ranges: PageRange[], maxPages: number): boolean => {
  if (!ranges.length) {
    return false;
  }

  const visited = new Set<number>();

  for (const range of ranges) {
    const start = Math.min(range.start, range.end);
    const end = Math.max(range.start, range.end);
    if (start < 1 || end > maxPages) {
      return false;
    }

    for (let page = start; page <= end; page += 1) {
      if (visited.has(page)) {
        return false;
      }
      visited.add(page);
    }
  }

  return true;
};

export const SplitToolClient = () => {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [mode, setMode] = useState<"range" | "every" | "extract">("range");
  const [rangesInput, setRangesInput] = useState("1-2, 3-4");
  const [everyN, setEveryN] = useState(2);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!bytes) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const count = await getPageCount(bytes);
        if (cancelled) {
          return;
        }
        setPageCount(count);

        const nextThumbs: string[] = [];
        for (let page = 1; page <= count; page += 1) {
          nextThumbs.push(await renderThumbnail(bytes, page));
        }

        if (!cancelled) {
          setThumbnails(nextThumbs);
          setSelectedPages(new Set(Array.from({ length: count }, (_, index) => index)));
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        setPageCount(0);
        setThumbnails([]);
        setSelectedPages(new Set());
        toast.error(
          "Could not read PDF pages",
          error instanceof Error ? error.message : "Please try another file."
        );
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [bytes, toast]);

  const ranges = useMemo(() => parseRanges(rangesInput), [rangesInput]);
  const rangeValid = useMemo(() => rangesAreValid(ranges, pageCount), [pageCount, ranges]);
  const extractList = useMemo(() => Array.from(selectedPages.values()).sort((a, b) => a - b).map((page) => page + 1), [selectedPages]);

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
        }}
      />

      <section className="space-y-4 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={mode === "range" ? "primary" : "secondary"} onClick={() => setMode("range")}>
            By page range
          </Button>
          <Button type="button" size="sm" variant={mode === "every" ? "primary" : "secondary"} onClick={() => setMode("every")}>
            Every N pages
          </Button>
          <Button type="button" size="sm" variant={mode === "extract" ? "primary" : "secondary"} onClick={() => setMode("extract")}>
            Extract pages
          </Button>
        </div>

        {mode === "range" ? (
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Ranges (example: 1-3, 4-7, 8-12)
              <input
                value={rangesInput}
                onChange={(event) => setRangesInput(event.target.value)}
                className="mt-1 w-full rounded-brutal border-2 border-ink bg-surface px-3 py-2"
              />
            </label>
            {!rangeValid ? <p className="text-sm text-red-900">Ranges overlap or exceed page count.</p> : null}
            {rangeValid ? (
              <ul className="space-y-1 text-sm text-muted">
                {ranges.map((range, index) => {
                  const start = Math.min(range.start, range.end);
                  const end = Math.max(range.start, range.end);
                  const count = end - start + 1;
                  return <li key={`${start}-${end}`}>Chunk {index + 1}: {formatPageCount(count)}</li>;
                })}
              </ul>
            ) : null}
          </div>
        ) : null}

        {mode === "every" ? (
          <div className="space-y-2">
            <label className="text-sm font-semibold">
              Split every N pages
              <input
                type="number"
                min={1}
                value={everyN}
                onChange={(event) => setEveryN(Number(event.target.value) || 1)}
                className="mt-1 w-32 rounded-brutal border-2 border-ink bg-surface px-3 py-2"
              />
            </label>
            <p className="text-sm text-muted">
              Would create {Math.ceil(pageCount / Math.max(1, everyN))} file(s) with up to {everyN} page(s) each.
            </p>
          </div>
        ) : null}

        {mode === "extract" ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">Select the pages you want to extract into one PDF file.</p>
            <p className="text-sm font-semibold">{extractList.length} page(s) selected</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {thumbnails.map((thumbnail, index) => {
            const selected = selectedPages.has(index);

            return (
              <button
                key={`split-thumb-${index}`}
                type="button"
                className={`rounded-brutal border-2 p-2 text-left ${selected ? "border-primary bg-green-100" : "border-ink bg-paper"}`}
                onClick={() => {
                  if (mode !== "extract") {
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
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          loading={busy}
          disabled={(mode === "range" && !rangeValid) || (mode === "extract" && !extractList.length)}
          onClick={async () => {
            setBusy(true);

            if (mode === "range") {
              const result = await splitByPages(file, ranges);
              setBusy(false);
              if (!result.data) {
                toast.error("Split failed", result.error?.message ?? "Unable to split PDF");
                return;
              }

              const zip = new JSZip();
              result.data.forEach((entry) => {
                zip.file(entry.filename, entry.blob);
              });
              const blob = await zip.generateAsync({ type: "blob" });
              downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}_split_ranges.zip`);
              toast.success("Split complete", `${result.data.length} files created`);
              return;
            }

            if (mode === "every") {
              const result = await splitEveryN(file, everyN);
              setBusy(false);
              if (!result.data) {
                toast.error("Split failed", result.error?.message ?? "Unable to split PDF");
                return;
              }
              const zip = new JSZip();
              result.data.forEach((entry) => zip.file(entry.filename, entry.blob));
              const blob = await zip.generateAsync({ type: "blob" });
              downloadBlob(blob, `${file.name.replace(/\.pdf$/i, "")}_split_chunks.zip`);
              toast.success("Split complete", `${result.data.length} files created`);
              return;
            }

            const result = await extractPages(file, extractList);
            setBusy(false);
            if (!result.data) {
              toast.error("Extraction failed", result.error?.message ?? "Unable to extract pages");
              return;
            }
            downloadBlob(result.data.blob, result.data.filename);
            toast.success("Pages extracted", `${result.data.pageCount} page(s) exported`);
          }}
        >
          Split and Download
        </Button>
      </section>
    </div>
  );
};
