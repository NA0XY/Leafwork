"use client";

import { Lock, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getPageCount } from "@/lib/pdf/renderer";
import { formatBytes, formatPageCount, truncateFilename } from "@/lib/utils/format";

type FileInfoCardProps = {
  file: File;
  bytes?: Uint8Array;
  onRemove: () => void;
};

export const FileInfoCard = ({ file, bytes, onRemove }: FileInfoCardProps) => {
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(Boolean(bytes));

  useEffect(() => {
    let cancelled = false;

    const loadPageCount = async () => {
      setLoadingCount(true);

      try {
        const sourceBytes = bytes ?? new Uint8Array(await file.arrayBuffer());
        const count = await getPageCount(sourceBytes);
        if (!cancelled) {
          setPageCount(count);
        }
      } catch {
        if (!cancelled) {
          setPageCount(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingCount(false);
        }
      }
    };

    void loadPageCount();

    return () => {
      cancelled = true;
    };
  }, [bytes, file]);

  const modified = useMemo(() => new Date(file.lastModified).toLocaleDateString(), [file.lastModified]);

  return (
    <section className="rounded-brutal border-2 border-green-700 bg-green-50 p-3 shadow-brutal-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold" title={file.name}>
            {truncateFilename(file.name, 44)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>{formatBytes(file.size)}</span>
            <span>Updated {modified}</span>
            <span className="inline-flex items-center gap-1">
              {loadingCount ? (
                <Skeleton variant="text" className="h-3 w-16" />
              ) : pageCount ? (
                formatPageCount(pageCount)
              ) : (
                "Page count unavailable"
              )}
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-green-800 bg-green-100 px-2 py-1 text-xs font-semibold text-green-900">
            <Lock className="h-3 w-3" /> File stays local
          </span>
          <Button type="button" variant="danger" size="sm" onClick={onRemove}>
            <X className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      </div>
    </section>
  );
};
