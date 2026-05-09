"use client";

import { useState } from "react";

import { WatermarkPanel } from "@/components/tools/WatermarkPanel";
import { DropZone } from "@/components/ui/DropZone";
import { useToast } from "@/hooks/useToast";
import { withPdfLib } from "@/lib/pdf/engine";
import type { WatermarkPosition } from "@/lib/pdf/types";
import { trackToolActivity } from "@/lib/utils/activity";
import { downloadBlob } from "@/lib/utils/file";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);
  const toast = useToast();

  const positionToCoords = (
    pageWidth: number,
    pageHeight: number,
    watermarkWidth: number,
    watermarkHeight: number,
    position: WatermarkPosition
  ): { x: number; y: number } => {
    const margin = 24;

    const horizontalMap: Record<WatermarkPosition, number> = {
      "top-left": margin,
      "top-center": (pageWidth - watermarkWidth) / 2,
      "top-right": pageWidth - watermarkWidth - margin,
      "middle-left": margin,
      center: (pageWidth - watermarkWidth) / 2,
      "middle-right": pageWidth - watermarkWidth - margin,
      "bottom-left": margin,
      "bottom-center": (pageWidth - watermarkWidth) / 2,
      "bottom-right": pageWidth - watermarkWidth - margin
    };

    const verticalMap: Record<WatermarkPosition, number> = {
      "top-left": pageHeight - watermarkHeight - margin,
      "top-center": pageHeight - watermarkHeight - margin,
      "top-right": pageHeight - watermarkHeight - margin,
      "middle-left": (pageHeight - watermarkHeight) / 2,
      center: (pageHeight - watermarkHeight) / 2,
      "middle-right": (pageHeight - watermarkHeight) / 2,
      "bottom-left": margin,
      "bottom-center": margin,
      "bottom-right": margin
    };

    return {
      x: horizontalMap[position],
      y: verticalMap[position]
    };
  };

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
            setAppliedCount(0);
            setDownloadComplete(false);
          })();
        }}
      />
    );
  }

  return (
    <WatermarkPanel
      file={file}
      bytes={bytes}
      progress={progress}
      isProcessing={isProcessing}
      downloadComplete={downloadComplete}
      appliedCount={appliedCount}
      onRemoveFile={() => {
        setFile(null);
        setBytes(null);
        setAppliedCount(0);
        setDownloadComplete(false);
      }}
      onTextWatermark={async (input) => {
        setIsProcessing(true);
        setProgress(10);
        setDownloadComplete(false);

        const result = await withPdfLib(async (pdfLib) => {
          const doc = await pdfLib.PDFDocument.load(bytes);
          const font = await doc.embedFont(pdfLib.StandardFonts.HelveticaBold);
          const page = doc.getPage(Math.max(0, input.pageNumber - 1));
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(input.text, input.fontSize);
          const textHeight = input.fontSize;
          const coords = positionToCoords(width, height, textWidth, textHeight, input.position);
          const color = hexToRgb(input.colorHex);

          page.drawText(input.text, {
            x: coords.x,
            y: coords.y,
            size: input.fontSize,
            font,
            color: pdfLib.rgb(color.r, color.g, color.b),
            rotate: pdfLib.degrees(input.rotation || 45),
            opacity: Math.max(0.05, Math.min(1, input.opacity))
          });

          setProgress(80);
          const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
          return output;
        });

        setIsProcessing(false);
        setProgress(0);

        if (!result.data) {
          toast.error("Watermark failed", result.error?.message ?? "Unable to place watermark");
          return;
        }

        setBytes(new Uint8Array(result.data));
        setAppliedCount((count) => count + 1);
        toast.success("Watermark placed", `Added to page ${input.pageNumber}.`);
      }}
      onTextWatermarkAll={async (input) => {
        setIsProcessing(true);
        setProgress(10);
        setDownloadComplete(false);

        const result = await withPdfLib(async (pdfLib) => {
          const doc = await pdfLib.PDFDocument.load(bytes);
          const font = await doc.embedFont(pdfLib.StandardFonts.HelveticaBold);

          for (const page of doc.getPages()) {
            const { width, height } = page.getSize();
            const textWidth = font.widthOfTextAtSize(input.text, input.fontSize);
            const textHeight = input.fontSize;
            const coords = positionToCoords(width, height, textWidth, textHeight, input.position);
            const color = hexToRgb(input.colorHex);

            page.drawText(input.text, {
              x: coords.x,
              y: coords.y,
              size: input.fontSize,
              font,
              color: pdfLib.rgb(color.r, color.g, color.b),
              rotate: pdfLib.degrees(input.rotation || 45),
              opacity: Math.max(0.05, Math.min(1, input.opacity))
            });
          }

          setProgress(80);
          const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
          return output;
        });

        setIsProcessing(false);
        setProgress(0);

        if (!result.data) {
          toast.error("Watermark failed", result.error?.message ?? "Unable to place watermark");
          return;
        }

        setBytes(new Uint8Array(result.data));
        setAppliedCount((count) => count + 1);
        toast.success("Watermark placed", "Added to all pages.");
      }}
      onImageWatermark={async (imageData, input) => {
        setIsProcessing(true);
        setProgress(10);
        setDownloadComplete(false);

        const result = await withPdfLib(async (pdfLib) => {
          const doc = await pdfLib.PDFDocument.load(bytes);
          const page = doc.getPage(Math.max(0, input.pageNumber - 1));
          const { width, height } = page.getSize();

          const imagePayload = imageData.split(",")[1] ?? "";
          const imageBytes = Uint8Array.from(atob(imagePayload), (char) => char.charCodeAt(0));
          const embedded = imageData.startsWith("data:image/png")
            ? await doc.embedPng(imageBytes)
            : await doc.embedJpg(imageBytes);

          const scaleCap = Math.max(0.1, Math.min(0.8, input.imageSize / 100));
          const maxWidth = width * scaleCap;
          const maxHeight = height * scaleCap;
          const scale = Math.min(maxWidth / embedded.width, maxHeight / embedded.height, 1);
          const watermarkWidth = embedded.width * scale;
          const watermarkHeight = embedded.height * scale;
          const coords = positionToCoords(width, height, watermarkWidth, watermarkHeight, input.position);

          page.drawImage(embedded, {
            x: coords.x,
            y: coords.y,
            width: watermarkWidth,
            height: watermarkHeight,
            rotate: pdfLib.degrees(input.rotation || 0),
            opacity: Math.max(0.05, Math.min(1, input.opacity))
          });

          setProgress(80);
          const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
          return output;
        });

        setIsProcessing(false);
        setProgress(0);

        if (!result.data) {
          toast.error("Watermark failed", result.error?.message ?? "Unable to place watermark");
          return;
        }

        setBytes(new Uint8Array(result.data));
        setAppliedCount((count) => count + 1);
        toast.success("Watermark placed", `Added to page ${input.pageNumber}.`);
      }}
      onImageWatermarkAll={async (imageData, input) => {
        setIsProcessing(true);
        setProgress(10);
        setDownloadComplete(false);

        const result = await withPdfLib(async (pdfLib) => {
          const doc = await pdfLib.PDFDocument.load(bytes);

          const imagePayload = imageData.split(",")[1] ?? "";
          const imageBytes = Uint8Array.from(atob(imagePayload), (char) => char.charCodeAt(0));
          const embedded = imageData.startsWith("data:image/png")
            ? await doc.embedPng(imageBytes)
            : await doc.embedJpg(imageBytes);

          for (const page of doc.getPages()) {
            const { width, height } = page.getSize();
            const scaleCap = Math.max(0.1, Math.min(0.8, input.imageSize / 100));
            const maxWidth = width * scaleCap;
            const maxHeight = height * scaleCap;
            const scale = Math.min(maxWidth / embedded.width, maxHeight / embedded.height, 1);
            const watermarkWidth = embedded.width * scale;
            const watermarkHeight = embedded.height * scale;
            const coords = positionToCoords(width, height, watermarkWidth, watermarkHeight, input.position);

            page.drawImage(embedded, {
              x: coords.x,
              y: coords.y,
              width: watermarkWidth,
              height: watermarkHeight,
              rotate: pdfLib.degrees(input.rotation || 0),
              opacity: Math.max(0.05, Math.min(1, input.opacity))
            });
          }

          setProgress(80);
          const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
          return output;
        });

        setIsProcessing(false);
        setProgress(0);

        if (!result.data) {
          toast.error("Watermark failed", result.error?.message ?? "Unable to place watermark");
          return;
        }

        setBytes(new Uint8Array(result.data));
        setAppliedCount((count) => count + 1);
        toast.success("Watermark placed", "Added to all pages.");
      }}
      onDownload={() => {
        const output = new Blob([bytes], { type: "application/pdf" });
        downloadBlob(output, `${file.name.replace(/\.pdf$/i, "")}_watermarked.pdf`);
        trackToolActivity({
          tool: "watermark",
          fileName: file.name,
          filesProcessed: 1,
          inputBytes: file.size,
          outputBytes: output.size
        });
        setDownloadComplete(true);
        window.setTimeout(() => setDownloadComplete(false), 3000);
        toast.success("Watermarked PDF downloaded");
      }}
    />
  );
};
