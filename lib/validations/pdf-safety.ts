"use client";

export const PDF_SAFETY_LIMITS = {
  maxImagePixels: 28_000_000,
  maxRasterPixels: 24_000_000,
  redactionRenderScale: 2,
  imageExportScale: 2
} as const;

export type BrowserLocalFileKind = "pdf" | "image";

export const getSafeRasterScale = (
  width: number,
  height: number,
  requestedScale: number,
  maxPixels = PDF_SAFETY_LIMITS.maxRasterPixels
): { scale: number; wasConstrained: boolean; pixels: number } => {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const requestedPixels = Math.ceil(safeWidth * requestedScale) * Math.ceil(safeHeight * requestedScale);

  if (requestedPixels <= maxPixels) {
    return { scale: requestedScale, wasConstrained: false, pixels: requestedPixels };
  }

  const scale = Math.sqrt(maxPixels / (safeWidth * safeHeight));
  const boundedScale = Math.max(0.1, Math.min(requestedScale, scale));

  return {
    scale: boundedScale,
    wasConstrained: true,
    pixels: Math.ceil(safeWidth * boundedScale) * Math.ceil(safeHeight * boundedScale)
  };
};

export const assertCanvasPixelBudget = (
  width: number,
  height: number,
  context = "This page",
  maxPixels = PDF_SAFETY_LIMITS.maxRasterPixels
): void => {
  const pixels = Math.ceil(width) * Math.ceil(height);
  if (pixels > maxPixels) {
    throw new Error(`${context} would render ${pixels.toLocaleString()} pixels, above the browser-local pixel budget.`);
  }
};

export const getImageDimensions = async (file: File): Promise<{ width: number; height: number } | null> => {
  if (typeof createImageBitmap !== "function") {
    return null;
  }

  const bitmap = await createImageBitmap(file);
  try {
    return { width: bitmap.width, height: bitmap.height };
  } finally {
    bitmap.close();
  }
};

export const validateImagePixelBudget = async (
  file: File,
  maxPixels = PDF_SAFETY_LIMITS.maxImagePixels
): Promise<string | null> => {
  const dimensions = await getImageDimensions(file);
  if (!dimensions) {
    return null;
  }

  const pixels = dimensions.width * dimensions.height;
  if (pixels > maxPixels) {
    return `${file.name} is ${pixels.toLocaleString()} pixels, above the browser-local image pixel budget.`;
  }

  return null;
};
