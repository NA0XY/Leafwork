export type ProgressCallback = (percent: number) => void;

export type CompressOutput = {
  blob: Blob;
  originalBytes: number;
  compressedBytes: number;
  quality: number;
  iterationsUsed: number;
  usedRasterization: boolean;
  targetBytes: number;
  hitTarget: boolean;
  renderScale: number;
  vectorTextPreserved: boolean;
  usedGrayscale: boolean;
};

export const MIN_QUALITY_IMAGE_DOC = 0.58;
export const MIN_QUALITY_RASTER_AGGRESSIVE = 0.36;
export const MAX_QUALITY = 0.93;
export const MAX_ITERATIONS = 8;
export const PRESERVE_SELECTABLE_TEXT = true;
export const MIN_REDUCTION_BEFORE_FALLBACK = 0.02;
export const TEXT_DENSITY_THRESHOLD = 0.35;
export const MIN_IMAGE_OPS_FOR_RASTER = 1;
export const MAX_RAW_IMAGE_PIXELS = 24_000_000;
export const MAX_CANVAS_PIXELS = 28_000_000;

export type PagePlan = {
  pageIndex: number;
  canvas: HTMLCanvasElement | null;
  width: number;
  height: number;
  hasSelectableText: boolean;
  hasDenseText: boolean;
  textDensity: number;
  imageOpCount: number;
  shouldRasterize: boolean;
};

export type EmbeddedImageCandidate = {
  ref: import("pdf-lib").PDFRef;
  stream: import("pdf-lib").PDFRawStream;
  width: number;
  height: number;
  filters: string[];
  colorSpace: string;
  colorSpaceNames: string[];
  bitsPerComponent: number;
  decodeParms: FlateDecodeParams | null;
};

export type EmbeddedImageResult = {
  bytes: Uint8Array;
  optimizedImageCount: number;
  attemptedImageCount: number;
  quality: number;
  maxDimension: number;
};

export type PdfLibModule = typeof import("pdf-lib");

export type FlateDecodeParams = {
  predictor: number;
  colors: number | null;
  columns: number | null;
  bitsPerComponent: number | null;
};

export type PdfJsViewport = {
  width: number;
  height: number;
};

export type PdfJsPage = {
  getViewport: (options: { scale: number }) => PdfJsViewport;
  render: (options: { canvasContext: CanvasRenderingContext2D; viewport: PdfJsViewport }) => { promise: Promise<void> };
  getTextContent: () => Promise<{ items: unknown[] }>;
};

export type PdfJsDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfJsPage>;
  destroy: () => Promise<void>;
};

export const PDF_IMAGE_FILTERS = {
  dct: "/DCTDecode",
  dctShort: "/DCT",
  flate: "/FlateDecode",
  flateShort: "/Fl",
  jpx: "/JPXDecode",
  jbig2: "/JBIG2Decode",
  ccitt: "/CCITTFaxDecode"
} as const;

export const LOSSY_OR_SPECIAL_IMAGE_FILTERS = new Set<string>([
  PDF_IMAGE_FILTERS.jpx,
  PDF_IMAGE_FILTERS.jbig2,
  PDF_IMAGE_FILTERS.ccitt
]);