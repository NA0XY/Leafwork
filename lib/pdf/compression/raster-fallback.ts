import { clonePdfBytes, loadPdfJs } from "@/lib/pdf/pdfjs";
import { convertCanvasToGrayscale } from "@/lib/pdf/compression/embedded-images";
import {
  MAX_ITERATIONS,
  MIN_IMAGE_OPS_FOR_RASTER,
  TEXT_DENSITY_THRESHOLD,
  type PagePlan
} from "@/lib/pdf/compression/types";
import { logger } from "@/lib/utils/logger";
export const preparePagePlans = async (bytes: Uint8Array, scale: number, options?: { keepTextSharp?: boolean }): Promise<PagePlan[]> => {
  const pdfJs = await loadPdfJs();
  const { getDocument, OPS } = pdfJs;
  const loadingTask = getDocument({ data: clonePdfBytes(bytes) });
  const source = await loadingTask.promise;
  const keepTextSharp = options?.keepTextSharp ?? true;

  try {
    const pagePlans: PagePlan[] = [];
    for (let pageNumber = 1; pageNumber <= source.numPages; pageNumber += 1) {
      const sourcePage = await source.getPage(pageNumber);
      const viewport = sourcePage.getViewport({ scale });
      const textContent = await sourcePage.getTextContent();
      const operatorList = await sourcePage.getOperatorList();
      const imageOpCount = operatorList.fnArray.filter(
        (fn) =>
          fn === OPS.paintImageXObject ||
          fn === OPS.paintInlineImageXObject ||
          fn === OPS.paintImageMaskXObject
      ).length;
      const textDensity = textContent.items.length / Math.max(1, (viewport.width * viewport.height) / 25000);
      const hasSelectableText = textContent.items.length > 0;
      const hasDenseText = textDensity >= TEXT_DENSITY_THRESHOLD;
      const shouldRasterize = imageOpCount >= MIN_IMAGE_OPS_FOR_RASTER && (keepTextSharp ? !hasSelectableText : !hasDenseText);
      let canvas: HTMLCanvasElement | null = null;
      if (shouldRasterize) {
        canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) {
          throw new Error("Unable to create canvas context for compression");
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await sourcePage.render({ canvasContext: context, viewport }).promise;
      }

      pagePlans.push({
        pageIndex: pageNumber - 1,
        canvas,
        width: viewport.width / scale,
        height: viewport.height / scale,
        hasSelectableText,
        hasDenseText,
        textDensity,
        imageOpCount,
        shouldRasterize
      });
    }

    return pagePlans;
  } finally {
    await source.destroy();
  }
};

export const composeHybridPdf = async (
  baseBytes: Uint8Array,
  pages: PagePlan[],
  quality: number,
  options?: { keepTextSharp?: boolean; grayscale?: boolean }
): Promise<Uint8Array> => {
  const pdfLib = await import("pdf-lib");
  const source = await pdfLib.PDFDocument.load(baseBytes, { ignoreEncryption: true });
  const output = await pdfLib.PDFDocument.create();
  const keepTextSharp = options?.keepTextSharp ?? true;

  for (const page of pages) {
    if (!page.shouldRasterize) {
      const [copied] = await output.copyPages(source, [page.pageIndex]);
      output.addPage(copied);
      continue;
    }

    if (!page.canvas) {
      const [copied] = await output.copyPages(source, [page.pageIndex]);
      output.addPage(copied);
      continue;
    }

    const shouldUsePng = keepTextSharp && page.hasSelectableText;
    const imageCanvas = options?.grayscale ? convertCanvasToGrayscale(page.canvas) : page.canvas;
    const imageDataUrl = shouldUsePng ? imageCanvas.toDataURL("image/png") : imageCanvas.toDataURL("image/jpeg", quality);
    const imageBytes = Uint8Array.from(atob(imageDataUrl.split(",")[1] ?? ""), (char) => char.charCodeAt(0));
    const image = shouldUsePng ? await output.embedPng(imageBytes) : await output.embedJpg(imageBytes);
    const outputPage = output.addPage([page.width, page.height]);
    outputPage.drawImage(image, { x: 0, y: 0, width: page.width, height: page.height });
  }

  return output.save({ useObjectStreams: true, addDefaultPage: false });
};

export const getScaleCandidates = (targetRatio: number): number[] => {
  if (targetRatio <= 0.35) {
    return [1.8, 1.65, 1.5, 1.35, 1.2];
  }
  if (targetRatio <= 0.55) {
    return [2.0, 1.85, 1.7, 1.55, 1.4];
  }
  if (targetRatio <= 0.75) {
    return [2.2, 2.0, 1.85, 1.7];
  }
  return [2.4, 2.2, 2.0, 1.85];
};