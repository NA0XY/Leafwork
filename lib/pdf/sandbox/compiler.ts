"use client";

import { withPdfLib } from "@/lib/pdf/engine";
import { compressPDF } from "@/lib/pdf/compress";
import { validateRenderedPdfBytes } from "@/lib/pdf/compression/validation";
import { addRasterizedRedactionPage, stripPdfMetadata, type NormalizedRedactionRect } from "@/lib/pdf/security";
import type { SandboxCompileInput, SandboxCompileOutput, SandboxOperation, SandboxPageRef } from "@/lib/pdf/sandbox/types";
import { PDFEngineError, PDFEngineErrorCode, type ProcessingResult, type WatermarkPosition } from "@/lib/pdf/types";
import { validateBrowserLocalPageBudget } from "@/lib/validations/pdf-safety";

type PdfLibModule = typeof import("pdf-lib");
type PdfDocument = import("pdf-lib").PDFDocument;
type PdfPage = import("pdf-lib").PDFPage;

const sanitizeFilename = (filename: string | undefined): string => {
  const base = filename?.trim().replace(/\.pdf$/i, "") || "leafwork_sandbox";
  return `${base.replace(/[\\/:*?"<>|]+/g, "_")}.pdf`;
};

const toResult = <T>(data: T | null, error: PDFEngineError | null, startedAt: number): ProcessingResult<T> => ({
  data,
  error,
  durationMs: Math.max(0, Math.round(performance.now() - startedAt))
});

const normalizeRotation = (current: number, delta: number): 0 | 90 | 180 | 270 => {
  const next = (current + delta) % 360;
  const normalized = next < 0 ? next + 360 : next;
  return (normalized === 90 || normalized === 180 || normalized === 270 ? normalized : 0) as 0 | 90 | 180 | 270;
};

const positionToCoords = (
  pageWidth: number,
  pageHeight: number,
  watermarkWidth: number,
  watermarkHeight: number,
  position: WatermarkPosition
): { x: number; y: number } => {
  const margin = 24;
  const centerX = (pageWidth - watermarkWidth) / 2;
  const right = pageWidth - watermarkWidth - margin;
  const middleY = (pageHeight - watermarkHeight) / 2;
  const top = pageHeight - watermarkHeight - margin;

  const horizontalMap: Record<WatermarkPosition, number> = {
    "top-left": margin,
    "top-center": centerX,
    "top-right": right,
    "middle-left": margin,
    center: centerX,
    "middle-right": right,
    "bottom-left": margin,
    "bottom-center": centerX,
    "bottom-right": right
  };

  const verticalMap: Record<WatermarkPosition, number> = {
    "top-left": top,
    "top-center": top,
    "top-right": top,
    "middle-left": middleY,
    center: middleY,
    "middle-right": middleY,
    "bottom-left": margin,
    "bottom-center": margin,
    "bottom-right": margin
  };

  return {
    x: horizontalMap[position],
    y: verticalMap[position]
  };
};

const getOutputPageIndex = (pages: SandboxPageRef[], pageId: string): number => pages.findIndex((page) => page.id === pageId);

const applyTextWatermark = async (pdfLib: PdfLibModule, doc: PdfDocument, operation: Extract<SandboxOperation, { type: "watermark-text" }>) => {
  const font = await doc.embedFont(pdfLib.StandardFonts.HelveticaBold);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(operation.options.text, operation.options.fontSize);
    const textHeight = operation.options.fontSize;
    const coords = positionToCoords(width, height, textWidth, textHeight, operation.options.position);

    page.drawText(operation.options.text, {
      x: coords.x,
      y: coords.y,
      size: operation.options.fontSize,
      font,
      color: pdfLib.rgb(operation.options.color.r, operation.options.color.g, operation.options.color.b),
      rotate: pdfLib.degrees(operation.options.rotation || 45),
      opacity: Math.max(0.05, Math.min(1, operation.options.opacity))
    });
  }
};

const applySignature = async (doc: PdfDocument, page: PdfPage, operation: Extract<SandboxOperation, { type: "signature" }>) => {
  const payload = operation.imageData.split(",")[1] ?? "";
  const signatureBytes = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
  const image = operation.imageData.startsWith("data:image/png")
    ? await doc.embedPng(signatureBytes)
    : await doc.embedJpg(signatureBytes);

  const size = page.getSize();
  const { rect } = operation;
  const placementX = rect.x * size.width;
  const placementY = size.height - (rect.y + rect.height) * size.height;
  const placementWidth = rect.width * size.width;
  const placementHeight = rect.height * size.height;
  const fitRatio = Math.min(placementWidth / image.width, placementHeight / image.height);
  const drawWidth = image.width * fitRatio;
  const drawHeight = image.height * fitRatio;

  page.drawImage(image, {
    x: placementX + (placementWidth - drawWidth) / 2,
    y: placementY + (placementHeight - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight
  });
};

export const compileSandboxToPdf = async (
  input: SandboxCompileInput,
  onProgress?: (percent: number, message: string) => void
): Promise<ProcessingResult<SandboxCompileOutput>> => {
  const startedAt = performance.now();

  if (!input.files.length || !input.pages.length) {
    return toResult<SandboxCompileOutput>(
      null,
      new PDFEngineError(PDFEngineErrorCode.INVALID_FILE, "Add at least one page before exporting the sandbox."),
      startedAt
    );
  }

  const pageBudgetError = validateBrowserLocalPageBudget(input.pages.length, "This sandbox export");
  if (pageBudgetError) {
    return toResult<SandboxCompileOutput>(
      null,
      new PDFEngineError(PDFEngineErrorCode.INVALID_FILE, pageBudgetError),
      startedAt
    );
  }

  const warnings: string[] = [];
  const filename = sanitizeFilename(input.filename);
  const fileById = new Map(input.files.map((file) => [file.id, file]));
  const sourceDocs = new Map<string, PdfDocument>();
  const redactionsByPageId = new Map<string, NormalizedRedactionRect[]>();

  for (const operation of input.operations) {
    if (operation.type !== "redact") {
      continue;
    }

    const rects = redactionsByPageId.get(operation.rect.pageId) ?? [];
    rects.push(operation.rect);
    redactionsByPageId.set(operation.rect.pageId, rects);
  }

  try {
    onProgress?.(5, "Resolving sandbox pages");

    const materialized = await withPdfLib(async (pdfLib) => {
      const outputDoc = await pdfLib.PDFDocument.create();

      for (let index = 0; index < input.pages.length; index += 1) {
        const pageRef = input.pages[index];
        const sourceFile = fileById.get(pageRef.fileId);
        if (!sourceFile) {
          warnings.push("A removed source file was skipped during export.");
          continue;
        }

        let sourceDoc = sourceDocs.get(sourceFile.id);
        if (!sourceDoc) {
          sourceDoc = await pdfLib.PDFDocument.load(sourceFile.bytes, { ignoreEncryption: true });
          sourceDocs.set(sourceFile.id, sourceDoc);
        }

        if (pageRef.pageIndex >= sourceDoc.getPageCount()) {
          warnings.push(`${sourceFile.name} page ${pageRef.pageIndex + 1} was skipped because it no longer exists.`);
          continue;
        }

        const redactionRects = redactionsByPageId.get(pageRef.id);
        if (redactionRects?.length) {
          const raster = await addRasterizedRedactionPage(outputDoc, sourceFile.bytes, pageRef.pageIndex + 1, redactionRects);
          const page = outputDoc.getPage(outputDoc.getPageCount() - 1);
          if (pageRef.rotation !== 0) {
            page.setRotation(pdfLib.degrees(normalizeRotation(page.getRotation().angle, pageRef.rotation)));
          }
          if (raster.scaleWasConstrained) {
            warnings.push(`${sourceFile.name} page ${pageRef.pageIndex + 1} redaction render scale was reduced to stay within the browser pixel budget.`);
          }
        } else {
          const [copiedPage] = await outputDoc.copyPages(sourceDoc, [pageRef.pageIndex]);
          if (!copiedPage) {
            continue;
          }

          if (pageRef.rotation !== 0) {
            copiedPage.setRotation(pdfLib.degrees(normalizeRotation(copiedPage.getRotation().angle, pageRef.rotation)));
          }

          outputDoc.addPage(copiedPage);
        }
        onProgress?.(5 + Math.round(((index + 1) / input.pages.length) * 45), "Copying sandbox pages");
      }

      for (const operation of input.operations) {
        if (operation.type === "watermark-text") {
          await applyTextWatermark(pdfLib, outputDoc, operation);
        }

        if (operation.type === "signature") {
          const outputIndex = getOutputPageIndex(input.pages, operation.rect.pageId);
          const page = outputIndex >= 0 ? outputDoc.getPage(outputIndex) : null;
          if (page) {
            await applySignature(outputDoc, page, operation);
          }
        }

        if (operation.type === "metadata-strip") {
          stripPdfMetadata(pdfLib, outputDoc);
        }
      }

      if (redactionsByPageId.size > 0) {
        stripPdfMetadata(pdfLib, outputDoc);
      }

      onProgress?.(72, "Serializing sandbox PDF");
      const bytes = await outputDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        updateFieldAppearances: false,
        objectsPerTick: 30
      });

      return bytes;
    });

    if (!materialized.data) {
      return toResult<SandboxCompileOutput>(null, materialized.error, startedAt);
    }

    let outputBytes = materialized.data.slice();
    const compressOperation = [...input.operations].reverse().find((operation) => operation.type === "compress-final") as
      | Extract<SandboxOperation, { type: "compress-final" }>
      | undefined;

    if (compressOperation) {
      onProgress?.(78, "Compressing final sandbox PDF");
      const intermediate = new File([outputBytes], filename, { type: "application/pdf" });
      const compressed = await compressPDF(intermediate, compressOperation.target, (percent) => {
        onProgress?.(78 + Math.round(percent * 0.17), "Compressing final sandbox PDF");
      });

      if (compressed.data?.blob) {
        const candidateBytes = new Uint8Array(await compressed.data.blob.arrayBuffer());
        const valid = await validateRenderedPdfBytes(outputBytes, candidateBytes, { expectTextPreserved: true });
        if (valid && candidateBytes.byteLength <= outputBytes.byteLength) {
          outputBytes = candidateBytes;
        } else {
          warnings.push("Final compression was skipped because validation failed or did not reduce the PDF.");
        }
      } else {
        warnings.push(compressed.error?.message ?? "Final compression failed and was skipped.");
      }
    }

    const finalBlob = new Blob([outputBytes], { type: "application/pdf" });
    onProgress?.(100, "Sandbox export ready");

    return toResult(
      {
        blob: finalBlob,
        bytes: outputBytes,
        filename,
        pageCount: input.pages.length,
        warnings
      },
      null,
      startedAt
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to compile sandbox PDF";
    return toResult<SandboxCompileOutput>(null, new PDFEngineError(PDFEngineErrorCode.PROCESSING_FAILED, message, error), startedAt);
  }
};
