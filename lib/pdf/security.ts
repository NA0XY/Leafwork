"use client";

import { clonePdfBytes, loadPdfJs } from "@/lib/pdf/pdfjs";
import { assertCanvasPixelBudget, getSafeRasterScale, PDF_SAFETY_LIMITS } from "@/lib/validations/pdf-safety";

type PdfLibModule = typeof import("pdf-lib");
type PdfDocument = import("pdf-lib").PDFDocument;
type PdfDict = import("pdf-lib").PDFDict;

export type NormalizedRedactionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PageRedaction = NormalizedRedactionRect & {
  pageNumber: number;
};

type RasterizedPage = {
  imageBytes: Uint8Array;
  width: number;
  height: number;
  scaleWasConstrained: boolean;
};

const INFO_KEYS = ["Title", "Author", "Subject", "Keywords", "Creator", "Producer", "CreationDate", "ModDate", "Trapped"];
const CATALOG_METADATA_KEYS = ["Metadata", "PieceInfo", "OutputIntents", "PageLabels", "Lang", "MarkInfo", "ViewerPreferences", "Legal"];
const PAGE_METADATA_KEYS = ["Metadata", "PieceInfo", "LastModified"];

const clamp01 = (value: number): number => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export const normalizeRedactionRect = (rect: NormalizedRedactionRect): NormalizedRedactionRect | null => {
  const x = clamp01(rect.x);
  const y = clamp01(rect.y);
  const maxWidth = 1 - x;
  const maxHeight = 1 - y;
  const width = Math.min(maxWidth, Math.max(0, rect.width));
  const height = Math.min(maxHeight, Math.max(0, rect.height));

  if (width <= 0 || height <= 0) {
    return null;
  }

  return { x, y, width, height };
};

const deleteDictEntry = (pdfLib: PdfLibModule, doc: PdfDocument, dict: PdfDict, key: string): void => {
  const name = pdfLib.PDFName.of(key);
  const value = dict.get(name);

  if (value instanceof pdfLib.PDFRef) {
    doc.context.delete(value);
  }

  dict.delete(name);
};

const stripInfoDictionary = (pdfLib: PdfLibModule, doc: PdfDocument): void => {
  const info = doc.context.trailerInfo.Info;
  const infoDict = info ? doc.context.lookupMaybe(info, pdfLib.PDFDict) : undefined;

  if (infoDict) {
    for (const key of INFO_KEYS) {
      deleteDictEntry(pdfLib, doc, infoDict, key);
    }
  }

  if (info instanceof pdfLib.PDFRef) {
    doc.context.delete(info);
  }

  delete doc.context.trailerInfo.Info;
  delete doc.context.trailerInfo.ID;
};

export const stripPdfMetadata = (pdfLib: PdfLibModule, doc: PdfDocument): void => {
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setCreator("");
  doc.setProducer("");
  doc.setCreationDate(new Date(0));
  doc.setModificationDate(new Date(0));

  for (const key of CATALOG_METADATA_KEYS) {
    deleteDictEntry(pdfLib, doc, doc.catalog, key);
  }

  for (const page of doc.getPages()) {
    for (const key of PAGE_METADATA_KEYS) {
      deleteDictEntry(pdfLib, doc, page.node, key);
    }
  }

  stripInfoDictionary(pdfLib, doc);
};

const canvasToBytes = async (canvas: HTMLCanvasElement): Promise<Uint8Array> => {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((value) => resolve(value), "image/jpeg", 0.95);
  });

  if (!blob) {
    throw new Error("Unable to encode redacted page image.");
  }

  return new Uint8Array(await blob.arrayBuffer());
};

const rasterizePageWithRedactions = async (
  sourceBytes: Uint8Array,
  pageNumber: number,
  rects: NormalizedRedactionRect[]
): Promise<RasterizedPage> => {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: clonePdfBytes(sourceBytes) });
  const pdf = await loadingTask.promise;

  try {
    const page = await pdf.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const safeScale = getSafeRasterScale(
      baseViewport.width,
      baseViewport.height,
      PDF_SAFETY_LIMITS.redactionRenderScale
    );
    const viewport = page.getViewport({ scale: safeScale.scale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });

    if (!context) {
      throw new Error("Unable to create redaction canvas.");
    }

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    assertCanvasPixelBudget(canvas.width, canvas.height, `Page ${pageNumber}`);

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;

    context.fillStyle = "#000000";
    for (const rect of rects) {
      const normalized = normalizeRedactionRect(rect);
      if (!normalized) {
        continue;
      }

      context.fillRect(
        normalized.x * canvas.width,
        normalized.y * canvas.height,
        normalized.width * canvas.width,
        normalized.height * canvas.height
      );
    }

    return {
      imageBytes: await canvasToBytes(canvas),
      width: baseViewport.width,
      height: baseViewport.height,
      scaleWasConstrained: safeScale.wasConstrained
    };
  } finally {
    await pdf.destroy();
  }
};

export const addRasterizedRedactionPage = async (
  outputDoc: PdfDocument,
  sourceBytes: Uint8Array,
  pageNumber: number,
  rects: NormalizedRedactionRect[]
): Promise<{ scaleWasConstrained: boolean }> => {
  const rasterized = await rasterizePageWithRedactions(sourceBytes, pageNumber, rects);
  const image = await outputDoc.embedJpg(rasterized.imageBytes);
  const page = outputDoc.addPage([rasterized.width, rasterized.height]);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: rasterized.width,
    height: rasterized.height
  });

  return { scaleWasConstrained: rasterized.scaleWasConstrained };
};

export const secureRedactPdfBytes = async (
  pdfLib: PdfLibModule,
  sourceBytes: Uint8Array,
  redactions: PageRedaction[]
): Promise<{ bytes: Uint8Array; warnings: string[] }> => {
  const sourceDoc = await pdfLib.PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const outputDoc = await pdfLib.PDFDocument.create();
  const warnings: string[] = [];
  const redactionsByPage = new Map<number, NormalizedRedactionRect[]>();

  for (const redaction of redactions) {
    const normalized = normalizeRedactionRect(redaction);
    if (!normalized) {
      continue;
    }

    const pageRects = redactionsByPage.get(redaction.pageNumber) ?? [];
    pageRects.push(normalized);
    redactionsByPage.set(redaction.pageNumber, pageRects);
  }

  for (let pageIndex = 0; pageIndex < sourceDoc.getPageCount(); pageIndex += 1) {
    const pageNumber = pageIndex + 1;
    const pageRedactions = redactionsByPage.get(pageNumber);

    if (pageRedactions?.length) {
      const raster = await addRasterizedRedactionPage(outputDoc, sourceBytes, pageNumber, pageRedactions);
      if (raster.scaleWasConstrained) {
        warnings.push(`Page ${pageNumber} redaction render scale was reduced to stay within the browser pixel budget.`);
      }
    } else {
      const [copiedPage] = await outputDoc.copyPages(sourceDoc, [pageIndex]);
      if (copiedPage) {
        outputDoc.addPage(copiedPage);
      }
    }
  }

  stripPdfMetadata(pdfLib, outputDoc);

  const bytes = await outputDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
    objectsPerTick: 30
  });

  return { bytes, warnings };
};
