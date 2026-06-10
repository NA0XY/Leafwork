"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { MergePanel } from "@/components/tools/MergePanel";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { usePDFEngine } from "@/hooks/usePDFEngine";
import { usePendingFiles } from "@/hooks/usePendingFiles";
import { useToast } from "@/hooks/useToast";
import { mergePDFs } from "@/lib/pdf/merge";
import { cn } from "@/lib/utils/cn";
import { checkMagicBytes } from "@/lib/validations/file";
import { useCanvasStore } from "@/store/canvas-store";
import { getSandboxNativeFiles, SANDBOX_FILE_DRAG_MIME, useSandboxStore } from "@/store/sandbox-store";

const isPdfFile = async (file: File): Promise<boolean> => {
  const chunk = await file.slice(0, 1024).arrayBuffer();
  return checkMagicBytes(chunk);
};

export const MergeToolClient = () => {
  const pendingFiles = usePendingFiles();
  const [files, setFiles] = useState<File[]>([]);
  const [savingToSandbox, setSavingToSandbox] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);
  const pdf = usePDFEngine();
  const toast = useToast();
  const clearPending = useCanvasStore((state) => state.clearPendingFileNames);
  const addGeneratedPdf = useSandboxStore((state) => state.addGeneratedPdf);
  const addInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (pendingFiles.length) {
      setFiles(pendingFiles);
      sessionStorage.removeItem("leafwork:pending-files-meta");
      clearPending();
    }
  }, [clearPending, pendingFiles]);

  const appendValidatedFiles = useCallback(
    async (incoming: File[]) => {
      if (!incoming.length) {
        return;
      }

      const validated: File[] = [];
      let skipped = 0;

      for (const file of incoming) {
        if (await isPdfFile(file)) {
          validated.push(file);
        } else {
          skipped += 1;
        }
      }

      if (validated.length) {
        setFiles((current) => [...current, ...validated]);
      }

      if (skipped) {
        toast.error("Some files were skipped", "Merge accepts PDF files only.");
      }
    },
    [toast]
  );

  const getDroppedFiles = useCallback(
    (event: DragEvent<HTMLDivElement>): File[] => {
      const sandboxPayload = event.dataTransfer.getData(SANDBOX_FILE_DRAG_MIME);
      if (!sandboxPayload) {
        return Array.from(event.dataTransfer.files ?? []);
      }

      try {
        const fileIds = JSON.parse(sandboxPayload) as string[];
        return getSandboxNativeFiles(fileIds);
      } catch {
        toast.error("Unable to read sandbox files", "Try dragging the file from storage again.");
        return [];
      }
    },
    [toast]
  );

  const handleAddMore = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    await appendValidatedFiles(Array.from(input.files ?? []));
    input.value = "";
  };

  const handleDropMore = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDropActive(false);
      await appendValidatedFiles(getDroppedFiles(event));
    },
    [appendValidatedFiles, getDroppedFiles]
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsDropActive(false);
  }, []);

  return (
    <div className="space-y-4">
      {!files.length ? (
        <DropZone
          onFiles={(nextFiles) => setFiles(nextFiles)}
          onError={(message) => {
            console.error("dropzone_error", message);
          }}
        />
      ) : (
        <div
          className="space-y-4"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setIsDropActive(true);
          }}
          onDragLeave={handleDragLeave}
          onDrop={handleDropMore}
        >
          <div
            className={cn(
              "rounded-brutal border-2 border-dashed border-ink bg-surface p-3 transition-colors",
              isDropActive && "border-primary bg-green-100"
            )}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-muted">Drop more PDFs here from storage or your desktop.</p>
              <Button type="button" size="sm" variant="secondary" onClick={() => addInputRef.current?.click()}>
                <Plus className="h-3.5 w-3.5" />
                Add more PDFs
              </Button>
            </div>
            <input
              ref={addInputRef}
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleAddMore}
              className="sr-only"
            />
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <FileInfoCard
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              />
            ))}
          </div>
          <MergePanel
            files={files}
            progress={pdf.progress}
            isProcessing={pdf.isProcessing || savingToSandbox}
            error={pdf.error}
            onRemoveFile={(index) => {
              setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
            }}
            onMerge={async (selections) => {
              await pdf.merge(files, selections);
            }}
            onSaveToSandbox={async (selections) => {
              setSavingToSandbox(true);
              try {
                const result = await mergePDFs(files, selections);
                if (!result.data) {
                  toast.error("Merge failed", result.error?.message ?? "Unable to merge files into sandbox");
                  return;
                }

                await addGeneratedPdf("merged_from_tool.pdf", result.data);
                toast.success("Saved to Sandbox", "The merged PDF is now available in storage.");
              } finally {
                setSavingToSandbox(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
