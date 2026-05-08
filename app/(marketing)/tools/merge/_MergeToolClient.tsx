"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { MergePanel } from "@/components/tools/MergePanel";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { usePDFEngine } from "@/hooks/usePDFEngine";
import { usePendingFiles } from "@/hooks/usePendingFiles";
import { useCanvasStore } from "@/store/canvas-store";

const PDF_MAGIC = "%PDF-";

const readMagicBytes = async (file: File): Promise<string> => {
  const chunk = await file.slice(0, 5).arrayBuffer();
  return new TextDecoder("latin1").decode(chunk);
};

export const MergeToolClient = () => {
  const pendingFiles = usePendingFiles();
  const [files, setFiles] = useState<File[]>([]);
  const pdf = usePDFEngine();
  const clearPending = useCanvasStore((state) => state.clearPendingFileNames);
  const addInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (pendingFiles.length) {
      setFiles(pendingFiles);
      sessionStorage.removeItem("leafwork:pending-files-meta");
      clearPending();
    }
  }, [clearPending, pendingFiles]);

  const handleAddMore = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const selected = Array.from(input.files ?? []);
    if (!selected.length) {
      input.value = "";
      return;
    }

    const validated: File[] = [];
    for (const file of selected) {
      const magic = await readMagicBytes(file);
      if (magic === PDF_MAGIC) {
        validated.push(file);
      }
    }

    if (validated.length) {
      setFiles((current) => [...current, ...validated]);
    }

    input.value = "";
  };

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
        <>
          <div className="flex justify-end">
            <Button type="button" size="sm" variant="secondary" onClick={() => addInputRef.current?.click()}>
              <Plus className="h-3.5 w-3.5" />
              Add more PDFs
            </Button>
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
            isProcessing={pdf.isProcessing}
            error={pdf.error}
            onRemoveFile={(index) => {
              setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
            }}
            onMerge={async (order) => {
              await pdf.merge(files, order);
            }}
          />
        </>
      )}
    </div>
  );
};
