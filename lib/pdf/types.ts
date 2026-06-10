export type PDFPageDimensions = {
  width: number;
  height: number;
};

export interface PDFDocumentState {
  file: File;
  bytes: Uint8Array;
  pageCount: number;
  pageDimensions: PDFPageDimensions[];
}

export type PageOperation =
  | { type: "rotate"; pageIndex: number; degrees: 90 | 180 | 270 }
  | { type: "delete"; pageIndex: number }
  | { type: "move"; fromPageIndex: number; toPageIndex: number }
  | { type: "extract"; pageIndices: number[] };

export enum CompressionLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CUSTOM = "custom"
}

export interface CompressionTarget {
  maxBytes?: number;
  quality?: number;
  targetKB?: number;
  stripMetadata?: boolean;
  allowRasterization?: boolean;
  keepTextSharp?: boolean;
  grayscale?: boolean;
}

export type WatermarkPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface WatermarkOptions {
  text: string;
  position: WatermarkPosition;
  opacity: number;
  fontSize: number;
  rotation: number;
  color: { r: number; g: number; b: number };
}

export interface SignatureOptions {
  imageData: string;
  x: number;
  y: number;
  page: number;
  width: number;
  height: number;
}

export enum PDFEngineErrorCode {
  INVALID_FILE = "INVALID_FILE",
  FILE_READ_FAILED = "FILE_READ_FAILED",
  PDF_PARSE_FAILED = "PDF_PARSE_FAILED",
  ENCRYPTED_PDF = "ENCRYPTED_PDF",
  PROCESSING_FAILED = "PROCESSING_FAILED",
  WORKER_FAILED = "WORKER_FAILED",
  UNSUPPORTED_OPERATION = "UNSUPPORTED_OPERATION"
}

export class PDFEngineError extends Error {
  public readonly code: PDFEngineErrorCode;
  public readonly originalError?: unknown;

  public constructor(code: PDFEngineErrorCode, message: string, originalError?: unknown) {
    super(message);
    this.name = "PDFEngineError";
    this.code = code;
    this.originalError = originalError;
  }
}

export interface ProcessingResult<T> {
  data: T | null;
  error: PDFEngineError | null;
  durationMs: number;
}
