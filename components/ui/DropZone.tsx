"use client";

import { FileText, Plus, X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import { formatMarkedPageNumbers } from "@/lib/pdf/sandbox/marked-pages";
import { checkMagicBytes } from "@/lib/validations/file";
import { validateBrowserLocalFile, validateBrowserLocalTotalBytes, validateImagePixelBudget } from "@/lib/validations/pdf-safety";
import { formatBytes, truncateFilename } from "@/lib/utils/format";
import { getSandboxFileMetadata, getSandboxImageFiles, getSandboxNativeFiles, SANDBOX_FILE_DRAG_MIME } from "@/store/sandbox-store";

type DropZoneProps = {
  onFiles: (files: File[]) => void;
  onError?: (message: string) => void;
  label?: string;
  multiple?: boolean;
  accept?: string;
  fileKind?: "pdf" | "image";
};

const readMagicBytes = async (file: File): Promise<boolean> => {
  const chunk = await file.slice(0, 1024).arrayBuffer();
  return checkMagicBytes(chunk);
};

const isSupportedImage = (file: File): boolean => {
  const type = file.type.toLowerCase();
  return type === "image/png" || type === "image/jpeg" || /\.(png|jpe?g)$/i.test(file.name);
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
  accept = "application/pdf",
  fileKind = "pdf"
}: DropZoneProps) => {
  const inputId = useId();
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
        const valid = fileKind === "image" ? isSupportedImage(file) : await readMagicBytes(file);
        if (!valid) {
          const message = fileKind === "image" ? `Not a supported PNG/JPG image: ${file.name}` : `Not a PDF file: ${file.name}`;
          setError(message);
          onError?.(message);
          continue;
        }

        const fileBudgetError = validateBrowserLocalFile(file, { kind: fileKind });
        if (fileBudgetError) {
          setError(fileBudgetError);
          onError?.(fileBudgetError);
          continue;
        }

        const pixelBudgetError = fileKind === "image" ? await validateImagePixelBudget(file) : null;
        if (pixelBudgetError) {
          setError(pixelBudgetError);
          onError?.(pixelBudgetError);
          continue;
        }

        validated.push(file);
      }

      if (!validated.length) {
        return;
      }

      const totalBudgetError = validateBrowserLocalTotalBytes(
        files.reduce((total, file) => total + file.size, 0),
        validated.reduce((total, file) => total + file.size, 0)
      );
      if (totalBudgetError) {
        setError(totalBudgetError);
        onError?.(totalBudgetError);
        return;
      }

      setError(null);
      const nextFiles = multiple ? [...files, ...validated] : [validated[0] as File];
      emitFiles(nextFiles);
    },
    [emitFiles, fileKind, files, multiple, onError]
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
      setIsDragging(false);
      const sandboxPayload = event.dataTransfer.getData(SANDBOX_FILE_DRAG_MIME);
      if (sandboxPayload) {
        try {
          const fileIds = JSON.parse(sandboxPayload) as string[];
          await handleFileValidation(fileKind === "image" ? getSandboxImageFiles(fileIds) : getSandboxNativeFiles(fileIds));
          return;
        } catch {
          const message = "Unable to read sandbox files from this drag.";
          setError(message);
          onError?.(message);
          return;
        }
      }

      await handleFileValidation(Array.from(event.dataTransfer.files ?? []));
    },
    [fileKind, handleFileValidation, onError]
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
          files.length === 0 && "cursor-pointer",
          isDragging && !isTouchMode && "border-primary bg-green-100 scale-[1.01] dropzone-drag-pulse"
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={onDrop}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        tabIndex={0}
      >
        {files.length === 0 ? (
          <label htmlFor={inputId} className="absolute inset-0 flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center">
            <FileText className="h-12 w-12 text-primary" aria-hidden="true" />
            <p className="text-lg font-bold">{label}</p>
            <p className="text-sm text-muted">or click to browse</p>
            <p className="text-xs text-muted">{fileKind === "image" ? "Accepts PNG and JPG images" : "Accepts PDF files only"}</p>
          </label>
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
              {files.map((file, index) => {
                const sandboxMeta = getSandboxFileMetadata(file);
                const markedPages = sandboxMeta ? formatMarkedPageNumbers(sandboxMeta.markedPages) : "";

                return (
                  <li
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="flex items-center gap-2 rounded-brutal border-2 border-ink bg-paper px-3 py-2"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold" title={file.name}>
                        {truncateFilename(file.name, 30)}
                      </span>
                      {markedPages ? (
                        <span className="mt-1 inline-flex rounded-brutal border border-ink bg-green-100 px-1.5 py-0.5 text-[11px] font-semibold">
                          Marked: {markedPages}
                        </span>
                      ) : null}
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
                );
              })}
            </ul>
          </div>
        )}

        <input
          id={inputId}
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

