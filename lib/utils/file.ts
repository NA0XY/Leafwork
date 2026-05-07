import { sanitizeFilename as sanitizePdfFileName } from "@/lib/validations/file";

export const readFileAsUint8Array = async (file: File): Promise<Uint8Array> => {
  const arrayBuffer = await file.arrayBuffer();
  return new Uint8Array(arrayBuffer);
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = sanitizePdfFileName(filename);
  anchor.click();
  URL.revokeObjectURL(url);
};

export const createFileHash = async (bytes: Uint8Array): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const view = Array.from(new Uint8Array(digest));
  return view.map((value) => value.toString(16).padStart(2, "0")).join("");
};

export const sanitizeFilename = sanitizePdfFileName;
