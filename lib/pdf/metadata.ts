"use client";

import { withPdfLib } from "@/lib/pdf/engine";
import { PDFEngineError, type ProcessingResult } from "@/lib/pdf/types";

export type PDFMetadata = {
  title: string | null;
  author: string | null;
  subject: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: string | null;
  modificationDate: string | null;
};

const toResult = <T>(data: T | null, error: PDFEngineError | null, startedAt: number): ProcessingResult<T> => ({
  data,
  error,
  durationMs: Math.max(0, Math.round(performance.now() - startedAt))
});

export const getMetadata = async (file: File): Promise<ProcessingResult<PDFMetadata>> => {
  const startedAt = performance.now();

  const result = await withPdfLib(async (pdfLib) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfLib.PDFDocument.load(bytes);

    return {
      title: doc.getTitle() ?? null,
      author: doc.getAuthor() ?? null,
      subject: doc.getSubject() ?? null,
      creator: doc.getCreator() ?? null,
      producer: doc.getProducer() ?? null,
      creationDate: doc.getCreationDate()?.toISOString() ?? null,
      modificationDate: doc.getModificationDate()?.toISOString() ?? null
    };
  });

  return toResult(result.data, result.error, startedAt);
};

export const stripMetadata = async (file: File): Promise<ProcessingResult<Blob>> => {
  const startedAt = performance.now();

  const result = await withPdfLib(async (pdfLib) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfLib.PDFDocument.load(bytes);

    doc.setTitle("");
    doc.setAuthor("");
    doc.setSubject("");
    doc.setKeywords([]);
    doc.setProducer("Leafwork");
    doc.setCreator("Leafwork");

    const metadataRef = doc.catalog.get(pdfLib.PDFName.of("Metadata"));
    if (metadataRef) {
      doc.catalog.delete(pdfLib.PDFName.of("Metadata"));
    }

    const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    return new Blob([output], { type: "application/pdf" });
  });

  return toResult(result.data, result.error, startedAt);
};

export const setMetadata = async (
  file: File,
  metadata: Partial<PDFMetadata>
): Promise<ProcessingResult<Blob>> => {
  const startedAt = performance.now();

  const result = await withPdfLib(async (pdfLib) => {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfLib.PDFDocument.load(bytes);

    if (metadata.title !== undefined) doc.setTitle(metadata.title ?? "");
    if (metadata.author !== undefined) doc.setAuthor(metadata.author ?? "");
    if (metadata.subject !== undefined) doc.setSubject(metadata.subject ?? "");
    if (metadata.creator !== undefined) doc.setCreator(metadata.creator ?? "Leafwork");
    if (metadata.producer !== undefined) doc.setProducer(metadata.producer ?? "Leafwork");

    const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
    return new Blob([output], { type: "application/pdf" });
  });

  return toResult(result.data, result.error, startedAt);
};
