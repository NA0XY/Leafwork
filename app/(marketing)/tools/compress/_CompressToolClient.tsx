"use client";

import { useState } from "react";

import { CompressPanel } from "@/components/tools/CompressPanel";
import { DropZone } from "@/components/ui/DropZone";
import { usePDFEngine } from "@/hooks/usePDFEngine";

export const CompressToolClient = () => {
  const [file, setFile] = useState<File | null>(null);
  const pdf = usePDFEngine();

  return !file ? (
    <DropZone onFiles={(files) => setFile(files[0] ?? null)} multiple={false} />
  ) : (
    <CompressPanel
      file={file}
      progress={pdf.progress}
      isProcessing={pdf.isProcessing}
      downloadComplete={pdf.downloadComplete}
      error={pdf.error}
      onRemoveFile={() => setFile(null)}
      onCompress={async (targetKB, stripMetadata, allowAggressiveCompression, grayscale, preserveSelectableText) =>
        pdf.compress(file, targetKB, {
          stripMetadata,
          allowRasterization: allowAggressiveCompression,
          keepTextSharp: preserveSelectableText,
          grayscale
        })}
    />
  );
};
