"use client";

import { useState } from "react";

import { WatermarkPanel } from "@/components/tools/WatermarkPanel";
import { DropZone } from "@/components/ui/DropZone";
import { usePDFEngine } from "@/hooks/usePDFEngine";

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }

  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255
  };
};

export const WatermarkToolClient = () => {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const pdf = usePDFEngine();

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
    <WatermarkPanel
      file={file}
      bytes={bytes}
      progress={pdf.progress}
      isProcessing={pdf.isProcessing}
      downloadComplete={pdf.downloadComplete}
      onRemoveFile={() => {
        setFile(null);
        setBytes(null);
      }}
      onTextWatermark={async (input) => {
        await pdf.watermark(file, input.text, {
          fontSize: input.fontSize,
          opacity: input.opacity,
          rotation: input.rotation,
          position: input.position,
          color: hexToRgb(input.colorHex)
        });
      }}
      onImageWatermark={async (imageData, input) => {
        await pdf.imageWatermark(file, imageData, {
          opacity: input.opacity,
          rotation: input.rotation,
          position: input.position
        });
      }}
    />
  );
};
