"use client";

import { FileText, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import { checkMagicBytes } from "@/lib/validations/file";
import { formatBytes, truncateFilename } from "@/lib/utils/format";

type DropZoneProps = {
  onFiles: (files: File[]) => void;
  onError?: (message: string) => void;
  label?: string;
  multiple?: boolean;
  accept?: string;
};

const readMagicBytes = async (file: File): Promise<boolean> => {
  const chunk = await file.slice(0, 1024).arrayBuffer();
  return checkMagicBytes(chunk);
};

const isMobileTouch = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
};

export const DropZone = ({
  onFiles,
  onError,
  label = "Drop PDF files here",
  multiple = true,
  accept = "application/pdf"
}: DropZoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTouchMode, setIsTouchMode] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsTouchMode(isMobileTouch());
  }, []);

  const emitFiles = useCallback(
    (nextFiles: File[]) => {
      setFiles(nextFiles);
      onFiles(nextFiles);
    },
    [onFiles]
  );

  const handleFileValidation = useCallback(
    async (incoming: File[]) => {
      if (!incoming.length) {
        return;
      }

      const validated: File[] = [];
      for (const file of incoming) {
        const hasPdfMagic = await readMagicBytes(file);
        if (!hasPdfMagic) {
          const message = `Not a PDF file: ${file.name}`;
          setError(message);
          onError?.(message);
          continue;
        }
        validated.push(file);
      }

      if (!validated.length) {
        return;
      }

      setError(null);
      const nextFiles = multiple ? [...files, ...validated] : [validated[0] as File];
      emitFiles(nextFiles);
    },
    [emitFiles, files, multiple, onError]
  );

  const handleInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const selected = Array.from(event.target.files ?? []);
      await handleFileValidation(selected);
      input.value = "";
    },
    [handleFileValidation]
  );

  const onDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (isTouchMode) {
        return;
      }
      setIsDragging(false);
      await handleFileValidation(Array.from(event.dataTransfer.files ?? []));
    },
    [handleFileValidation, isTouchMode]
  );

  const rowCountLabel = useMemo(() => `${files.length} file${files.length === 1 ? "" : "s"} ready`, [files.length]);

  const removeFile = useCallback(
    (index: number) => {
      const next = files.filter((_, fileIndex) => fileIndex !== index);
      emitFiles(next);
    },
    [emitFiles, files]
  );

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className="space-y-3">
      <div
        role="region"
        aria-label="PDF drop zone"
        className={cn(
          "relative min-h-[18rem] rounded-brutal border-2 border-ink bg-surface p-4 transition-all duration-150",
          files.length === 0 ? "border-dashed min-h-56" : "min-h-[10rem]",
          isDragging && !isTouchMode && "border-primary bg-green-100 scale-[1.01] dropzone-drag-pulse"
        )}
        onDragOver={(event) => {
          if (isTouchMode) {
            return;
          }
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (isTouchMode) {
            return;
          }
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={onDrop}
        onClick={() => {
          if (files.length === 0) {
            openPicker();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        tabIndex={0}
      >
        {files.length === 0 ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-center">
            <FileText className="h-12 w-12 text-primary" aria-hidden="true" />
            <p className="text-lg font-bold">{label}</p>
            <p className="text-sm text-muted">or click to browse</p>
            <p className="text-xs text-muted">Accepts PDF files only</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Badge tone="success">{rowCountLabel}</Badge>
              <Button type="button" size="sm" variant="secondary" onClick={openPicker}>
                <Plus className="h-3.5 w-3.5" />
                Add more files
              </Button>
            </div>

            <ul className="space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className="flex items-center gap-2 rounded-brutal border-2 border-ink bg-paper px-3 py-2"
                >
                  <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={file.name}>
                    {truncateFilename(file.name, 30)}
                  </span>
                  <span className="text-xs text-muted">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-brutal border-2 border-ink bg-surface text-ink"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="sr-only"
        />
      </div>

      {error ? (
        <Badge tone="warning" className="border-red-700 bg-red-100 text-red-900">
          {error}
        </Badge>
      ) : null}
    </div>
  );
};

