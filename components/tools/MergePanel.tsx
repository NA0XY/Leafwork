"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ZoomablePreview } from "@/components/tools/ZoomablePreview";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatPageCount, truncateFilename } from "@/lib/utils/format";
import { formatMarkedPageNumbers } from "@/lib/pdf/sandbox/marked-pages";
import { getPageCount, renderThumbnail } from "@/lib/pdf/renderer";
import { cn } from "@/lib/utils/cn";
import type { MergePageRange, MergeSelection } from "@/lib/pdf/merge";
import { getSandboxFileMetadata } from "@/store/sandbox-store";

type MergePanelProps = {
  files: File[];
  onMerge: (selections: MergeSelection[]) => Promise<void>;
  onSaveToSandbox?: (selections: MergeSelection[]) => Promise<void>;
  onRemoveFile: (index: number) => void;
  progress: number;
  isProcessing: boolean;
  error?: string | null;
};

type MergeItem = {
  id: string;
  fileIndex: number;
};

const RANGE_REGEX = /^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/;

const parsePageRanges = (value: string, pageCount?: number): { ranges?: MergePageRange[]; invalid: boolean } => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { invalid: false };
  }

  if (!RANGE_REGEX.test(trimmed)) {
    return { invalid: true };
  }

  const seen = new Set<number>();
  const ranges: MergePageRange[] = [];

  for (const chunk of trimmed.split(",")) {
    const [startRaw, endRaw] = chunk.trim().split("-");
    const start = Number(startRaw);
    const end = Number(endRaw ?? startRaw);
    const normalizedStart = Math.min(start, end);
    const normalizedEnd = Math.max(start, end);

    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      normalizedStart < 1 ||
      (pageCount !== undefined && normalizedEnd > pageCount)
    ) {
      return { invalid: true };
    }

    for (let page = normalizedStart; page <= normalizedEnd; page += 1) {
      if (seen.has(page)) {
        return { invalid: true };
      }
      seen.add(page);
    }

    ranges.push({ start: normalizedStart, end: normalizedEnd });
  }

  return { ranges, invalid: false };
};

const SortableRow = ({
  item,
  file,
  pageCount,
  thumbnail,
  rangeValue,
  rangeError,
  onRemove,
  onRangeChange,
  onRangeBlur
}: {
  item: MergeItem;
  file: File;
  pageCount: number | null;
  thumbnail?: string;
  rangeValue: string;
  rangeError: boolean;
  onRemove: () => void;
  onRangeChange: (next: string) => void;
  onRangeBlur: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const sandboxMeta = getSandboxFileMetadata(file);
  const markedPages = sandboxMeta ? formatMarkedPageNumbers(sandboxMeta.markedPages) : "";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "rounded-brutal border-2 border-ink bg-paper p-3",
        isDragging && "opacity-50",
        "data-[over=true]:border-t-4 data-[over=true]:border-t-primary"
      )}
      data-over={isDragging ? "true" : "false"}
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[auto_auto_1fr_auto] lg:items-center">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-brutal border-2 border-ink bg-surface"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {thumbnail ? (
          <ZoomablePreview
            src={thumbnail}
            alt={`${file.name} preview`}
            className="w-20"
            imageClassName="h-24 w-20 rounded-brutal border border-ink bg-surface object-cover"
          />
        ) : (
          <div className="flex h-24 w-20 items-center justify-center rounded-brutal border border-ink bg-surface text-primary">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
        )}

        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" />
            <span className="truncate" title={file.name}>
              {truncateFilename(file.name, 40)}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted">{pageCount ? formatPageCount(pageCount) : "Counting pages..."}</p>
          {markedPages ? (
            <p className="mt-2 inline-flex rounded-brutal border border-ink bg-green-100 px-2 py-1 text-xs font-semibold">
              Marked: {markedPages}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-muted">
            Page range
            <input
              type="text"
              value={rangeValue}
              onChange={(event) => onRangeChange(event.target.value)}
              onBlur={onRangeBlur}
              className={cn(
                "mt-1 w-36 rounded-brutal border-2 bg-surface px-2 py-1 text-xs",
                rangeError ? "border-red-700" : "border-ink"
              )}
              placeholder="All pages"
              title={rangeError ? "Use format: 1-3, 5, 7-9" : undefined}
            />
          </label>
          <Button type="button" variant="danger" size="sm" onClick={onRemove}>
            <X className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
};

export const MergePanel = ({
  files,
  onMerge,
  onSaveToSandbox,
  onRemoveFile,
  progress,
  isProcessing,
  error
}: MergePanelProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [items, setItems] = useState<MergeItem[]>(() =>
    files.map((file, index) => ({ id: `${file.name}-${file.lastModified}-${index}`, fileIndex: index }))
  );
  const [pageCounts, setPageCounts] = useState<Record<number, number>>({});
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [ranges, setRanges] = useState<Record<string, string>>({});
  const [rangeErrors, setRangeErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setItems(files.map((file, index) => ({ id: `${file.name}-${file.lastModified}-${index}`, fileIndex: index })));
  }, [files]);

  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      const nextCounts: Record<number, number> = {};
      const nextThumbs: Record<number, string> = {};

      for (let index = 0; index < files.length; index += 1) {
        try {
          const bytes = new Uint8Array(await files[index].arrayBuffer());
          nextCounts[index] = await getPageCount(bytes);
          nextThumbs[index] = await renderThumbnail(bytes, 1);
        } catch {
          nextCounts[index] = 1;
        }
      }

      if (!cancelled) {
        setPageCounts(nextCounts);
        setThumbnails(nextThumbs);
      }
    };

    void loadCounts();

    return () => {
      cancelled = true;
    };
  }, [files]);

  const orderedFiles = useMemo(
    () => items.map((item) => ({ item, file: files[item.fileIndex] })).filter((entry) => Boolean(entry.file)),
    [files, items]
  );

  const totalPages = useMemo(
    () => orderedFiles.reduce((total, entry) => total + (pageCounts[entry.item.fileIndex] ?? 0), 0),
    [orderedFiles, pageCounts]
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setItems((current) => {
      const oldIndex = current.findIndex((item) => item.id === active.id);
      const newIndex = current.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }
      return arrayMove(current, oldIndex, newIndex);
    });
  };

  const hasRangeErrors = Object.values(rangeErrors).some(Boolean);

  const buildSelections = (): { selections: MergeSelection[]; hasErrors: boolean } => {
    const nextErrors: Record<string, boolean> = {};
    const selections = items.map((item) => {
      const parsed = parsePageRanges(ranges[item.id] ?? "", pageCounts[item.fileIndex]);
      nextErrors[item.id] = parsed.invalid;
      return {
        fileIndex: item.fileIndex,
        ranges: parsed.ranges
      };
    });

    setRangeErrors(nextErrors);
    return {
      selections,
      hasErrors: Object.values(nextErrors).some(Boolean)
    };
  };

  return (
    <section className="space-y-4 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
      <div>
        <h2 className="text-xl font-bold">Arrange files before merge</h2>
        <p className="text-sm text-muted">Drag rows to reorder. Optional page ranges can be entered per file.</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {orderedFiles.map((entry) => (
              <SortableRow
                key={entry.item.id}
                item={entry.item}
                file={entry.file as File}
                pageCount={pageCounts[entry.item.fileIndex] ?? null}
                thumbnail={thumbnails[entry.item.fileIndex]}
                rangeValue={ranges[entry.item.id] ?? ""}
                rangeError={rangeErrors[entry.item.id] ?? false}
                onRangeChange={(next) => {
                  setRanges((current) => ({ ...current, [entry.item.id]: next }));
                  setRangeErrors((current) => ({
                    ...current,
                    [entry.item.id]: parsePageRanges(next, pageCounts[entry.item.fileIndex]).invalid
                  }));
                }}
                onRangeBlur={() => {
                  const value = ranges[entry.item.id] ?? "";
                  const invalid = parsePageRanges(value, pageCounts[entry.item.fileIndex]).invalid;
                  setRangeErrors((current) => ({ ...current, [entry.item.id]: invalid }));
                }}
                onRemove={() => onRemoveFile(entry.item.fileIndex)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <p className="text-sm font-semibold text-muted">
        {orderedFiles.length} files - {formatPageCount(totalPages)} total
      </p>

      {error ? (
        <div className="rounded-brutal border-2 border-red-700 bg-red-100 p-3 text-sm text-red-900">
          <p className="font-semibold">Merge failed</p>
          <p>{error}</p>
          <Button type="button" variant="secondary" size="sm" className="mt-2">
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      ) : null}

      <ProgressBar value={progress} animated showLabel />

      <Button
        type="button"
        className="w-full"
        size="lg"
        loading={isProcessing}
        disabled={!orderedFiles.length || hasRangeErrors}
        onClick={() => {
          const { selections, hasErrors } = buildSelections();
          if (hasErrors) {
            return;
          }

          void onMerge(selections);
        }}
      >
        Merge and Download
      </Button>

      {onSaveToSandbox ? (
        <Button
          type="button"
          className="w-full"
          size="lg"
          variant="secondary"
          loading={isProcessing}
          disabled={!orderedFiles.length || hasRangeErrors}
          onClick={() => {
            const { selections, hasErrors } = buildSelections();
            if (hasErrors) {
              return;
            }

            void onSaveToSandbox(selections);
          }}
        >
          Save merged PDF to Sandbox
        </Button>
      ) : null}
    </section>
  );
};

