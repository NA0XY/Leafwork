"use client";

import { withPdfLib } from "@/lib/pdf/engine";
import type { ProcessingResult } from "@/lib/pdf/types";

export type ImagePdfOutput = {
  blob: Blob;
  filename: string;
  pageCount: number;
};

export type ImagePdfLayout = "fit-page" | "original-size";

export type ImagesToPdfOptions = {
  layout?: ImagePdfLayout;
};

const A4 = {
  width: 595.28,
  height: 841.89
};

const embedImage = async (doc: import("pdf-lib").PDFDocument, file: File) => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (type === "image/png" || name.endsWith(".png")) {
    return doc.embedPng(bytes);
  }

  if (type === "image/jpeg" || name.endsWith(".jpg") || name.endsWith(".jpeg")) {
    return doc.embedJpg(bytes);
  }

  throw new Error(`Unsupported image type: ${file.type || file.name}`);
};

const baseName = (file: File): string => file.name.replace(/\.(png|jpe?g)$/i, "");

const addImagePage = (doc: import("pdf-lib").PDFDocument, image: import("pdf-lib").PDFImage, layout: ImagePdfLayout) => {
  if (layout === "original-size") {
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height
    });
    return;
  }

  const landscape = image.width > image.height;
  const pageWidth = landscape ? A4.height : A4.width;
  const pageHeight = landscape ? A4.width : A4.height;
  const margin = 24;
  const maxWidth = pageWidth - margin * 2;
  const maxHeight = pageHeight - margin * 2;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const width = image.width * scale;
  const height = image.height * scale;
  const page = doc.addPage([pageWidth, pageHeight]);

  page.drawImage(image, {
    x: (pageWidth - width) / 2,
    y: (pageHeight - height) / 2,
    width,
    height
  });
};

export const imagesToPdf = async (
  files: File[],
  filename = "images.pdf",
  options: ImagesToPdfOptions = {}
): Promise<ProcessingResult<ImagePdfOutput>> => {
  const result = await withPdfLib(async (pdfLib) => {
    const doc = await pdfLib.PDFDocument.create();
    const layout = options.layout ?? "fit-page";

    for (const file of files) {
      const image = await embedImage(doc, file);
      addImagePage(doc, image, layout);
    }

    const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    return {
      blob: new Blob([bytes], { type: "application/pdf" }),
      filename,
      pageCount: files.length
    };
  });

  return result;
};

export const imagesToIndividualPdfs = async (
  files: File[],
  options: ImagesToPdfOptions = {}
): Promise<ProcessingResult<ImagePdfOutput[]>> => {
  const result = await withPdfLib(async (pdfLib) => {
    const outputs: ImagePdfOutput[] = [];
    const layout = options.layout ?? "fit-page";

    for (const file of files) {
      const doc = await pdfLib.PDFDocument.create();
      const image = await embedImage(doc, file);
      addImagePage(doc, image, layout);
      const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
      outputs.push({
        blob: new Blob([bytes], { type: "application/pdf" }),
        filename: `${baseName(file)}.pdf`,
        pageCount: 1
      });
    }

    return outputs;
  });

  return result;
};
