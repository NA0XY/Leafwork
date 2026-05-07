"use client";

import { useEffect, useState } from "react";

import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { MergePanel } from "@/components/tools/MergePanel";
import { DropZone } from "@/components/ui/DropZone";
import { usePDFEngine } from "@/hooks/usePDFEngine";
import { usePendingFiles } from "@/hooks/usePendingFiles";
import { useCanvasStore } from "@/store/canvas-store";

export const MergeToolClient = () => {
  const pendingFiles = usePendingFiles();
  const [files, setFiles] = useState<File[]>([]);
  const pdf = usePDFEngine();
  const clearPending = useCanvasStore((state) => state.clearPendingFileNames);

  useEffect(() => {
    if (pendingFiles.length) {
      setFiles(pendingFiles);
      sessionStorage.removeItem("leafwork:pending-files-meta");
      clearPending();
    }
  }, [clearPending, pendingFiles]);

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
