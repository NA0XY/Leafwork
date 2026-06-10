"use client";

import type { CompressionTarget, WatermarkOptions } from "@/lib/pdf/types";

export type SandboxFileKind = "pdf" | "image";

export type SandboxFile = {
  id: string;
  name: string;
  bytes: Uint8Array;
  pageCount: number;
  size: number;
  kind: SandboxFileKind;
};

export type SandboxPageRef = {
  id: string;
  fileId: string;
  pageIndex: number;
  rotation: 0 | 90 | 180 | 270;
};

export type SandboxRect = {
  pageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SandboxOperation =
  | {
      id: string;
      type: "reorder-pages";
      pageId: string;
      fromIndex: number;
      toIndex: number;
      timestamp: number;
    }
  | {
      id: string;
      type: "delete-pages";
      pageIds: string[];
      timestamp: number;
    }
  | {
      id: string;
      type: "rotate-pages";
      pageIds: string[];
      degrees: 90 | 180 | 270;
      timestamp: number;
    }
  | {
      id: string;
      type: "extract-selection";
      pageIds: string[];
      timestamp: number;
    }
  | {
      id: string;
      type: "watermark-text";
      options: WatermarkOptions;
      timestamp: number;
    }
  | {
      id: string;
      type: "signature";
      imageData: string;
      rect: SandboxRect;
      timestamp: number;
    }
  | {
      id: string;
      type: "redact";
      rect: SandboxRect;
      timestamp: number;
    }
  | {
      id: string;
      type: "metadata-strip";
      timestamp: number;
    }
  | {
      id: string;
      type: "compress-final";
      target: CompressionTarget;
      timestamp: number;
    };

export type SandboxOperationInput = SandboxOperation extends infer Operation
  ? Operation extends SandboxOperation
    ? Omit<Operation, "id" | "timestamp">
    : never
  : never;

export type SandboxCompileInput = {
  files: SandboxFile[];
  pages: SandboxPageRef[];
  operations: SandboxOperation[];
  filename?: string;
};

export type SandboxCompileOutput = {
  blob: Blob;
  bytes: Uint8Array;
  filename: string;
  pageCount: number;
  warnings: string[];
};
