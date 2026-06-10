"use client";

import { useState } from "react";

import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { ReplaceFileDropTarget } from "@/components/tools/ReplaceFileDropTarget";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { usePDFEngine } from "@/hooks/usePDFEngine";

export const MetadataStripToolClient = () => {
  const [file, setFile] = useState<File | null>(null);
  const pdf = usePDFEngine();

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone multiple={false} onFiles={(files) => setFile(files[0] ?? null)} />
      ) : (
        <ReplaceFileDropTarget onFile={setFile}>
          <FileInfoCard file={file} onRemove={() => setFile(null)} />
          <section className="rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
            <p className="text-sm text-muted">Remove author, producer, and hidden metadata from the exported file.</p>
            <div className="mt-3 flex items-center gap-3">
              <Button loading={pdf.isProcessing} onClick={() => void pdf.stripMetadata(file)}>
                Remove Metadata and Download
              </Button>
              {pdf.downloadComplete ? <span className="text-xs font-semibold text-primary">Downloaded OK</span> : null}
            </div>
          </section>
        </ReplaceFileDropTarget>
      )}
      {pdf.error ? <p className="text-sm text-red-900">{pdf.error}</p> : null}
    </div>
  );
};
