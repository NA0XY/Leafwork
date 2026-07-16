import pako from "pako";

import { findEmbeddedImageCandidates } from "@/lib/pdf/compression/pdf-objects";
import { validatePdfBytes } from "@/lib/pdf/compression/validation";
import {
  MAX_CANVAS_PIXELS,
  MAX_RAW_IMAGE_PIXELS,
  PDF_IMAGE_FILTERS,
  type EmbeddedImageCandidate,
  type EmbeddedImageResult,
  type FlateDecodeParams,
  type ProgressCallback
} from "@/lib/pdf/compression/types";
import { stripPdfMetadata } from "@/lib/pdf/security";
import { logger } from "@/lib/utils/logger";
const getComponentsForColorSpace = (colorSpace: string): number | null => {
  if (colorSpace.includes("DeviceGray") || colorSpace.includes("/G")) {
    return 1;
  }
  if (colorSpace.includes("DeviceRGB") || colorSpace.includes("/RGB")) {
    return 3;
  }
  if (colorSpace.includes("DeviceCMYK") || colorSpace.includes("/CMYK")) {
    return 4;
  }
  return null;
};

const applyPngPredictor = (bytes: Uint8Array, width: number, height: number, components: number): Uint8Array | null => {
  const rowBytes = width * components;
  const filteredRowBytes = rowBytes + 1;
  if (bytes.length !== filteredRowBytes * height) {
    return null;
  }

  const output = new Uint8Array(rowBytes * height);
  for (let row = 0; row < height; row += 1) {
    const sourceOffset = row * filteredRowBytes;
    const targetOffset = row * rowBytes;
    const filter = bytes[sourceOffset];
    for (let column = 0; column < rowBytes; column += 1) {
      const raw = bytes[sourceOffset + 1 + column];
      const left = column >= components ? output[targetOffset + column - components] : 0;
      const up = row > 0 ? output[targetOffset + column - rowBytes] : 0;
      const upLeft = row > 0 && column >= components ? output[targetOffset + column - rowBytes - components] : 0;
      let value = raw;

      if (filter === 1) {
        value = raw + left;
      } else if (filter === 2) {
        value = raw + up;
      } else if (filter === 3) {
        value = raw + Math.floor((left + up) / 2);
      } else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        value = raw + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
      } else if (filter !== 0) {
        return null;
      }

      output[targetOffset + column] = value & 255;
    }
  }

  return output;
};

const rawPixelsToImageData = (
  raw: Uint8Array,
  width: number,
  height: number,
  components: number,
  colorSpace: string,
  decodeParms: FlateDecodeParams | null
): ImageData | null => {
  const predictor = decodeParms?.predictor ?? 1;
  const columns = decodeParms?.columns ?? width;
  const colors = decodeParms?.colors ?? components;
  const bitsPerComponent = decodeParms?.bitsPerComponent ?? 8;

  if (columns !== width || colors !== components || bitsPerComponent !== 8) {
    return null;
  }

  let pixelBytes: Uint8Array | null = null;
  if (predictor <= 1) {
    pixelBytes = raw.length >= width * height * components ? raw.slice(0, width * height * components) : null;
  } else if (predictor >= 10 && predictor <= 15) {
    pixelBytes = applyPngPredictor(raw, width, height, components);
  }

  if (!pixelBytes || pixelBytes.length < width * height * components) {
    return null;
  }

  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const source = pixel * components;
    const target = pixel * 4;

    if (components === 1) {
      const gray = pixelBytes[source];
      rgba[target] = gray;
      rgba[target + 1] = gray;
      rgba[target + 2] = gray;
      rgba[target + 3] = 255;
    } else if (components === 4 || colorSpace.includes("DeviceCMYK")) {
      const c = pixelBytes[source] / 255;
      const m = pixelBytes[source + 1] / 255;
      const y = pixelBytes[source + 2] / 255;
      const k = pixelBytes[source + 3] / 255;
      rgba[target] = Math.round(255 * (1 - c) * (1 - k));
      rgba[target + 1] = Math.round(255 * (1 - m) * (1 - k));
      rgba[target + 2] = Math.round(255 * (1 - y) * (1 - k));
      rgba[target + 3] = 255;
    } else {
      rgba[target] = pixelBytes[source];
      rgba[target + 1] = pixelBytes[source + 1];
      rgba[target + 2] = pixelBytes[source + 2];
      rgba[target + 3] = 255;
    }
  }

  return new ImageData(rgba, width, height);
};

const blobToUint8Array = async (blob: Blob): Promise<Uint8Array> => new Uint8Array(await blob.arrayBuffer());

const canvasToJpegBytes = async (canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array | null> => {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((nextBlob) => resolve(nextBlob), "image/jpeg", quality);
  });

  return blob ? blobToUint8Array(blob) : null;
};

const getConstrainedDimensions = (width: number, height: number, maxDimension: number): { width: number; height: number } => {
  const largest = Math.max(width, height);
  const pixelCount = width * height;
  const dimensionScale = largest > maxDimension ? maxDimension / largest : 1;
  const pixelScale = pixelCount > MAX_CANVAS_PIXELS ? Math.sqrt(MAX_CANVAS_PIXELS / pixelCount) : 1;
  const scale = Math.min(dimensionScale, pixelScale);

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
};

const imageCandidateToCanvas = async (candidate: EmbeddedImageCandidate, maxDimension: number): Promise<HTMLCanvasElement | null> => {
  const contents = candidate.stream.getContents();

  if (candidate.filters.includes(PDF_IMAGE_FILTERS.dct)) {
    const bitmap = await createImageBitmap(new Blob([contents], { type: "image/jpeg" }));

    if (bitmap.width * bitmap.height > MAX_CANVAS_PIXELS) {
      bitmap.close();
      return null;
    }

    const dimensions = getConstrainedDimensions(bitmap.width, bitmap.height, maxDimension);
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      bitmap.close();
      return null;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas;
  }

  if (!candidate.filters.includes(PDF_IMAGE_FILTERS.flate)) {
    return null;
  }

  if (candidate.bitsPerComponent !== 8) {
    return null;
  }

  if (candidate.width * candidate.height > MAX_RAW_IMAGE_PIXELS) {
    return null;
  }

  const components = getComponentsForColorSpace(candidate.colorSpace);
  if (!components) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = candidate.width;
  canvas.height = candidate.height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    return null;
  }

  const inflated = pako.inflate(contents);
  const imageData = rawPixelsToImageData(inflated, candidate.width, candidate.height, components, candidate.colorSpace, candidate.decodeParms);
  if (!imageData) {
    return null;
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
};

const downsampleCanvas = (source: HTMLCanvasElement, maxDimension: number): HTMLCanvasElement => {
  const largest = Math.max(source.width, source.height);
  if (largest <= maxDimension) {
    return source;
  }

  const scale = maxDimension / largest;
  const target = document.createElement("canvas");
  target.width = Math.max(1, Math.round(source.width * scale));
  target.height = Math.max(1, Math.round(source.height * scale));
  const context = target.getContext("2d", { alpha: false });
  if (!context) {
    return source;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, target.width, target.height);
  context.drawImage(source, 0, 0, target.width, target.height);
  return target;
};

export const convertCanvasToGrayscale = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const target = document.createElement("canvas");
  target.width = source.width;
  target.height = source.height;
  const context = target.getContext("2d", { alpha: false });
  if (!context) {
    return source;
  }

  context.drawImage(source, 0, 0);
  const imageData = context.getImageData(0, 0, target.width, target.height);
  const data = imageData.data;
  for (let index = 0; index < data.length; index += 4) {
    const gray = Math.round(data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114);
    data[index] = gray;
    data[index + 1] = gray;
    data[index + 2] = gray;
    data[index + 3] = 255;
  }
  context.putImageData(imageData, 0, 0);
  return target;
};

const getEmbeddedImageCompressionSettings = (
  targetRatio: number,
  allowAggressiveCompression: boolean
): Array<{ quality: number; maxDimension: number }> => {
  const candidates = [
    { quality: 0.86, maxDimension: 2200 },
    { quality: 0.78, maxDimension: 1800 },
    { quality: 0.68, maxDimension: 1600 },
    { quality: 0.56, maxDimension: 1300 },
    { quality: 0.46, maxDimension: 1100 }
  ];

  if (allowAggressiveCompression && targetRatio <= 0.35) {
    return [
      ...candidates,
      { quality: 0.36, maxDimension: 950 },
      { quality: 0.28, maxDimension: 760 }
    ];
  }
  if (targetRatio <= 0.55) {
    return candidates.slice(1);
  }
  if (targetRatio <= 0.78) {
    return candidates.slice(0, 4);
  }
  return candidates.slice(0, 3);
};

const applyEmbeddedImageCompressionPass = async (
  bytes: Uint8Array,
  options: { stripMetadata: boolean; allowAggressiveCompression: boolean; grayscale: boolean },
  settings: { quality: number; maxDimension: number },
  onProgress?: ProgressCallback
): Promise<EmbeddedImageResult | null> => {
  const pdfLib = await import("pdf-lib");
  const doc = await pdfLib.PDFDocument.load(bytes, { ignoreEncryption: true });
  const candidates = findEmbeddedImageCandidates(doc, pdfLib);
  let optimizedImageCount = 0;

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    try {
      const sourceCanvas = await imageCandidateToCanvas(candidate, settings.maxDimension);
      if (!sourceCanvas) {
        continue;
      }

      const outputCanvas = downsampleCanvas(sourceCanvas, settings.maxDimension);
      const finalCanvas = options.grayscale ? convertCanvasToGrayscale(outputCanvas) : outputCanvas;
      const jpegBytes = await canvasToJpegBytes(finalCanvas, settings.quality);
      if (!jpegBytes || jpegBytes.byteLength >= candidate.stream.getContents().byteLength) {
        continue;
      }

      const nextDict = pdfLib.PDFDict.withContext(doc.context);
      nextDict.set(pdfLib.PDFName.of("Type"), pdfLib.PDFName.of("XObject"));
      nextDict.set(pdfLib.PDFName.of("Subtype"), pdfLib.PDFName.of("Image"));
      nextDict.set(pdfLib.PDFName.of("Width"), pdfLib.PDFNumber.of(finalCanvas.width));
      nextDict.set(pdfLib.PDFName.of("Height"), pdfLib.PDFNumber.of(finalCanvas.height));
      nextDict.set(pdfLib.PDFName.of("BitsPerComponent"), pdfLib.PDFNumber.of(8));
      nextDict.set(pdfLib.PDFName.of("ColorSpace"), pdfLib.PDFName.of("DeviceRGB"));
      nextDict.set(pdfLib.PDFName.of("Filter"), pdfLib.PDFName.of("DCTDecode"));
      nextDict.delete(pdfLib.PDFName.of("DecodeParms"));
      nextDict.delete(pdfLib.PDFName.of("Length"));
      nextDict.delete(pdfLib.PDFName.of("Interpolate"));

      const newStream = pdfLib.PDFRawStream.of(nextDict, jpegBytes);
      doc.context.assign(candidate.ref, newStream);
      optimizedImageCount += 1;
    } catch (error) {
      logger.debug("pdf.compress.embedded_image.skipped", {
        imageIndex: index,
        error
      });
    }

    onProgress?.(Math.round(((index + 1) / Math.max(1, candidates.length)) * 100));
  }

  if (optimizedImageCount === 0) {
    return null;
  }

  if (options.stripMetadata) {
    stripPdfMetadata(pdfLib, doc);
  }

  const optimizedBytes = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
    objectsPerTick: 30
  });

  if (!(await validatePdfBytes(bytes, optimizedBytes, { requireSmaller: true }))) {
    return null;
  }

  return {
    bytes: optimizedBytes,
    optimizedImageCount,
    attemptedImageCount: candidates.length,
    quality: settings.quality,
    maxDimension: settings.maxDimension
  };
};

export const compressEmbeddedImages = async (
  bytes: Uint8Array,
  goalBytes: number,
  options: { stripMetadata: boolean; allowAggressiveCompression: boolean; grayscale: boolean },
  onProgress?: ProgressCallback
): Promise<EmbeddedImageResult | null> => {
  const targetRatio = goalBytes / Math.max(1, bytes.byteLength);
  const settingCandidates = getEmbeddedImageCompressionSettings(targetRatio, options.allowAggressiveCompression);
  let bestUnderTarget: EmbeddedImageResult | null = null;
  let smallestValid: EmbeddedImageResult | null = null;

  for (let index = 0; index < settingCandidates.length; index += 1) {
    const result = await applyEmbeddedImageCompressionPass(
      bytes,
      options,
      settingCandidates[index],
      (percent) => {
        const base = index / settingCandidates.length;
        const span = 1 / settingCandidates.length;
        onProgress?.(25 + Math.round((base + (percent / 100) * span) * 45));
      }
    );

    if (!result) {
      continue;
    }

    if (!smallestValid || result.bytes.byteLength < smallestValid.bytes.byteLength) {
      smallestValid = result;
    }

    if (result.bytes.byteLength <= goalBytes) {
      bestUnderTarget = result;
      break;
    }
  }

  return bestUnderTarget ?? smallestValid;
};