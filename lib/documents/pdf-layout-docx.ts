"use client";

import {
  Document,
  FrameAnchorType,
  FrameWrap,
  HeightRule,
  Packer,
  Paragraph,
  TextRun,
  type ISectionOptions
} from "docx";

import { clonePdfBytes, loadPdfJs } from "@/lib/pdf/pdfjs";

const PDF_VIEWPORT_SCALE = 1.35;
const TWIPS_PER_CSS_PIXEL = 15;
const PAGE_PADDING_TWIPS = 720;

type PdfTextItem = {
  str?: string;
  transform?: number[];
  height?: number;
  width?: number;
};

const cssPxToTwips = (value: number): number => Math.max(1, Math.round(value * TWIPS_PER_CSS_PIXEL));
const cssPxToHalfPoints = (value: number): number => Math.max(8, Math.round(value * 1.5));

export const pdfToLayoutDocxBlob = async (bytes: Uint8Array): Promise<Blob> => {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: clonePdfBytes(bytes) });
  const pdf = await loadingTask.promise;

  try {
    const sections: ISectionOptions[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: PDF_VIEWPORT_SCALE });
      const textContent = await page.getTextContent();
      const paragraphs = (textContent.items as PdfTextItem[])
        .map((item) => {
          const raw = item.str ?? "";
          const str = raw.trim();
          if (!str) {
            return null;
          }

          const transform = Array.isArray(item.transform) ? item.transform : [1, 0, 0, 1, 0, 0];
          const x = transform[4] ?? 0;
          const y = transform[5] ?? 0;
          const height = Math.max(8, item.height ?? 12);
          const width = Math.max(1, item.width ?? str.length * (height * 0.45));
          const top = viewport.height - y - height;

          return new Paragraph({
            frame: {
              type: "absolute",
              position: {
                x: PAGE_PADDING_TWIPS + cssPxToTwips(x),
                y: PAGE_PADDING_TWIPS + cssPxToTwips(top)
              },
              width: cssPxToTwips(width),
              height: cssPxToTwips(height * 1.25),
              anchor: {
                horizontal: FrameAnchorType.PAGE,
                vertical: FrameAnchorType.PAGE
              },
              wrap: FrameWrap.NONE,
              rule: HeightRule.EXACT
            },
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({
                text: raw,
                size: cssPxToHalfPoints(height),
                font: "Times New Roman"
              })
            ]
          });
        })
        .filter((paragraph): paragraph is Paragraph => paragraph !== null);

      sections.push({
        properties: {
          page: {
            size: {
              width: cssPxToTwips(viewport.width) + PAGE_PADDING_TWIPS * 2,
              height: cssPxToTwips(viewport.height) + PAGE_PADDING_TWIPS * 2
            },
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
          }
        },
        children: paragraphs.length > 0 ? paragraphs : [new Paragraph("")]
      });
    }

    const doc = new Document({
      sections
    });

    return Packer.toBlob(doc);
  } finally {
    await pdf.destroy();
  }
};
