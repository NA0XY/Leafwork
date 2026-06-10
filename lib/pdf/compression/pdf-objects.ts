import {
  LOSSY_OR_SPECIAL_IMAGE_FILTERS,
  PDF_IMAGE_FILTERS,
  type EmbeddedImageCandidate,
  type FlateDecodeParams,
  type PdfLibModule
} from "@/lib/pdf/compression/types";
const getPdfObjectName = (value: unknown): string => (value && typeof value === "object" && "toString" in value ? String(value) : "");

const getPdfNameList = (value: unknown): string[] => {
  if (!value || typeof value !== "object") {
    return [];
  }

  if ("asArray" in value && typeof value.asArray === "function") {
    return value
      .asArray()
      .map((entry: unknown) => getPdfObjectName(entry))
      .filter(Boolean);
  }

  const name = getPdfObjectName(value);
  return name ? [name] : [];
};

const normalizePdfName = (name: string): string => {
  if (name === PDF_IMAGE_FILTERS.dctShort) {
    return PDF_IMAGE_FILTERS.dct;
  }
  if (name === PDF_IMAGE_FILTERS.flateShort) {
    return PDF_IMAGE_FILTERS.flate;
  }
  return name;
};

const getNormalizedPdfNameList = (value: unknown): string[] => getPdfNameList(value).map(normalizePdfName);

const getPdfNumber = (value: unknown): number | null => {
  if (value && typeof value === "object" && "asNumber" in value && typeof value.asNumber === "function") {
    const numberValue = value.asNumber();
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  return null;
};

const getPdfBoolean = (value: unknown): boolean | null => {
  const raw = getPdfObjectName(value);
  if (raw === "true") {
    return true;
  }
  if (raw === "false") {
    return false;
  }
  return null;
};

const getDecodeParmsDict = (
  pdfDoc: import("pdf-lib").PDFDocument,
  pdfLib: PdfLibModule,
  value: unknown
): import("pdf-lib").PDFDict | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("asArray" in value && typeof value.asArray === "function") {
    const entries = value.asArray();
    if (entries.length !== 1) {
      return null;
    }
    return getDecodeParmsDict(pdfDoc, pdfLib, entries[0]);
  }

  if ("get" in value && typeof value.get === "function") {
    return value as import("pdf-lib").PDFDict;
  }

  try {
    return pdfDoc.context.lookupMaybe(value as import("pdf-lib").PDFRef, pdfLib.PDFDict) ?? null;
  } catch {
    return null;
  }
};

const getFlateDecodeParams = (
  pdfDoc: import("pdf-lib").PDFDocument,
  pdfLib: PdfLibModule,
  value: unknown
): FlateDecodeParams | null => {
  const dict = getDecodeParmsDict(pdfDoc, pdfLib, value);
  if (!dict) {
    return null;
  }

  return {
    predictor: getPdfNumber(dict.get(pdfLib.PDFName.of("Predictor"))) ?? 1,
    colors: getPdfNumber(dict.get(pdfLib.PDFName.of("Colors"))),
    columns: getPdfNumber(dict.get(pdfLib.PDFName.of("Columns"))),
    bitsPerComponent: getPdfNumber(dict.get(pdfLib.PDFName.of("BitsPerComponent")))
  };
};

const hasUnsafeImageDictionary = (stream: import("pdf-lib").PDFRawStream, pdfLib: PdfLibModule): boolean =>
  getPdfBoolean(stream.dict.get(pdfLib.PDFName.of("ImageMask"))) === true ||
  stream.dict.has(pdfLib.PDFName.of("SMask")) ||
  stream.dict.has(pdfLib.PDFName.of("Mask")) ||
  stream.dict.has(pdfLib.PDFName.of("Decode"));

const isSupportedImageColorSpace = (colorSpaceNames: string[]): boolean => {
  if (colorSpaceNames.length === 0) {
    return true;
  }

  const primary = colorSpaceNames[0];
  return primary === "/DeviceGray" || primary === "/G" || primary === "/DeviceRGB" || primary === "/RGB" || primary === "/DeviceCMYK" || primary === "/CMYK";
};

export const findEmbeddedImageCandidates = (pdfDoc: import("pdf-lib").PDFDocument, pdfLib: PdfLibModule): EmbeddedImageCandidate[] => {
  const candidates: EmbeddedImageCandidate[] = [];

  for (const [ref, object] of pdfDoc.context.enumerateIndirectObjects()) {
    if (!object || typeof object !== "object" || !("dict" in object) || !("getContents" in object)) {
      continue;
    }

    const stream = object as import("pdf-lib").PDFRawStream;
    const subtype = getPdfObjectName(stream.dict.get(pdfLib.PDFName.of("Subtype")));
    if (subtype !== "/Image") {
      continue;
    }

    if (hasUnsafeImageDictionary(stream, pdfLib)) {
      continue;
    }

    const width = getPdfNumber(stream.dict.get(pdfLib.PDFName.of("Width")));
    const height = getPdfNumber(stream.dict.get(pdfLib.PDFName.of("Height")));
    const bitsPerComponent = getPdfNumber(stream.dict.get(pdfLib.PDFName.of("BitsPerComponent"))) ?? 8;
    const filters = getNormalizedPdfNameList(stream.dict.get(pdfLib.PDFName.of("Filter")));
    const colorSpaceValue = stream.dict.get(pdfLib.PDFName.of("ColorSpace"));
    const colorSpaceNames = getPdfNameList(colorSpaceValue);
    const colorSpace = colorSpaceNames.join(" ") || getPdfObjectName(colorSpaceValue) || "/DeviceRGB";

    if (!width || !height || width <= 0 || height <= 0) {
      continue;
    }

    if (filters.length !== 1 || LOSSY_OR_SPECIAL_IMAGE_FILTERS.has(filters[0]) || !isSupportedImageColorSpace(colorSpaceNames)) {
      continue;
    }

    if (filters[0] !== PDF_IMAGE_FILTERS.dct && filters[0] !== PDF_IMAGE_FILTERS.flate) {
      continue;
    }

    candidates.push({
      ref: ref as import("pdf-lib").PDFRef,
      stream,
      width,
      height,
      filters,
      colorSpace,
      colorSpaceNames,
      bitsPerComponent,
      decodeParms: filters[0] === PDF_IMAGE_FILTERS.flate ? getFlateDecodeParams(pdfDoc, pdfLib, stream.dict.get(pdfLib.PDFName.of("DecodeParms"))) : null
    });
  }

  return candidates;
};