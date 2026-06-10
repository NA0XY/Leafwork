import { clonePdfBytes, loadPdfJs } from "@/lib/pdf/pdfjs";
import { logger } from "@/lib/utils/logger";
import { findEmbeddedImageCandidates } from "@/lib/pdf/compression/pdf-objects";
import { PDF_IMAGE_FILTERS, type PdfJsDocument } from "@/lib/pdf/compression/types";
export const validatePdfBytes = async (
  originalBytes: Uint8Array,
  candidateBytes: Uint8Array,
  options?: { requireSmaller?: boolean }
): Promise<boolean> => {
  if (candidateBytes.byteLength < 5 || String.fromCharCode(...candidateBytes.slice(0, 5)) !== "%PDF-") {
    return false;
  }

  if (options?.requireSmaller && candidateBytes.byteLength >= originalBytes.byteLength) {
    return false;
  }

  try {
    const pdfLib = await import("pdf-lib");
    const [original, candidate] = await Promise.all([
      pdfLib.PDFDocument.load(originalBytes, { ignoreEncryption: true }),
      pdfLib.PDFDocument.load(candidateBytes, { ignoreEncryption: true })
    ]);

    if (original.getPageCount() !== candidate.getPageCount()) {
      return false;
    }

    const originalPages = original.getPages();
    const candidatePages = candidate.getPages();
    for (let index = 0; index < originalPages.length; index += 1) {
      const originalSize = originalPages[index].getSize();
      const candidateSize = candidatePages[index].getSize();
      if (Math.abs(originalSize.width - candidateSize.width) > 1 || Math.abs(originalSize.height - candidateSize.height) > 1) {
        return false;
      }
    }

    for (const image of findEmbeddedImageCandidates(candidate, pdfLib)) {
      const contents = image.stream.getContents();
      const startsWithJpeg = contents[0] === 0xff && contents[1] === 0xd8 && contents[2] === 0xff;
      if (image.filters.includes(PDF_IMAGE_FILTERS.dct) && !startsWithJpeg) {
        return false;
      }
      if (image.filters.includes(PDF_IMAGE_FILTERS.flate) && startsWithJpeg) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

const getSamplePageNumbers = (pageCount: number): number[] => {
  const samples = [1, Math.ceil(pageCount / 2), pageCount];
  return [...new Set(samples.filter((pageNumber) => pageNumber >= 1 && pageNumber <= pageCount))];
};

const renderInkRatio = async (source: PdfJsDocument, pageNumber: number): Promise<number> => {
  const page = await source.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(0.35, 420 / Math.max(baseViewport.width, baseViewport.height));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(viewport.width));
  canvas.height = Math.max(1, Math.ceil(viewport.height));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    return 0;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let inkPixels = 0;
  for (let index = 0; index < imageData.length; index += 4) {
    if (imageData[index] < 245 || imageData[index + 1] < 245 || imageData[index + 2] < 245) {
      inkPixels += 1;
    }
  }

  canvas.width = 1;
  canvas.height = 1;
  return inkPixels / Math.max(1, imageData.length / 4);
};

export const validateRenderedPdfBytes = async (
  originalBytes: Uint8Array,
  candidateBytes: Uint8Array,
  options?: { expectTextPreserved?: boolean }
): Promise<boolean> => {
  try {
    const pdfJs = await loadPdfJs();
    const [originalTask, candidateTask] = [
      pdfJs.getDocument({ data: clonePdfBytes(originalBytes) }),
      pdfJs.getDocument({ data: clonePdfBytes(candidateBytes) })
    ];
    const [originalRaw, candidateRaw] = await Promise.all([originalTask.promise, candidateTask.promise]);
    const original = originalRaw as unknown as PdfJsDocument;
    const candidate = candidateRaw as unknown as PdfJsDocument;

    try {
      if (original.numPages !== candidate.numPages) {
        return false;
      }

      for (const pageNumber of getSamplePageNumbers(original.numPages)) {
        const [originalPage, candidatePage] = await Promise.all([original.getPage(pageNumber), candidate.getPage(pageNumber)]);

        if (options?.expectTextPreserved) {
          const [originalText, candidateText] = await Promise.all([
            originalPage.getTextContent(),
            candidatePage.getTextContent()
          ]);
          if (originalText.items.length > 0 && candidateText.items.length < Math.max(1, Math.floor(originalText.items.length * 0.8))) {
            return false;
          }
        }

        const [originalInk, candidateInk] = await Promise.all([
          renderInkRatio(original, pageNumber),
          renderInkRatio(candidate, pageNumber)
        ]);
        if (originalInk > 0.005 && candidateInk < Math.max(0.001, originalInk * 0.2)) {
          return false;
        }
      }

      return true;
    } finally {
      await Promise.all([original.destroy(), candidate.destroy()]);
    }
  } catch (error) {
    logger.debug("pdf.compress.render_validation.failed", { error });
    return false;
  }
};