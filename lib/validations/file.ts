export const PDF_MAGIC_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;
const PDF_MAGIC_TEXT = "%PDF-";
const MAX_MAGIC_SEARCH_BYTES = 1024;

export const checkMagicBytes = (buffer: ArrayBuffer): boolean => {
  const slice = buffer.slice(0, Math.min(buffer.byteLength, MAX_MAGIC_SEARCH_BYTES));
  const bytes = new Uint8Array(slice);

  if (bytes.length < PDF_MAGIC_HEADER.length) {
    return false;
  }

  const strictAtStart = PDF_MAGIC_HEADER.every((value, index) => bytes[index] === value);
  if (strictAtStart) {
    return true;
  }

  const text = new TextDecoder("latin1").decode(bytes);
  return text.includes(PDF_MAGIC_TEXT);
};

export const isSafeFilename = (name: string): boolean => {
  const trimmed = name.trim();
  if (!trimmed.toLowerCase().endsWith(".pdf")) {
    return false;
  }

  if (trimmed.length === 0 || trimmed.length > 255) {
    return false;
  }

  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("\u0000")) {
    return false;
  }

  for (const char of trimmed) {
    const code = char.charCodeAt(0);
    if (code <= 31 || code === 127) {
      return false;
    }
  }

  // Disallow OS-reserved filename characters, but allow common punctuation like ()
  // and broader Unicode text that users often have in document names.
  return !/[<>:"|?*]/.test(trimmed);
};

export const estimatePageCount = (bytes: Uint8Array): number => {
  const content = new TextDecoder("latin1").decode(bytes);
  const matches = content.match(/\/Type\s*\/Page(?!s)/g);
  return matches?.length ?? 1;
};

export const sanitizeFilename = (name: string, maxLength = 255): string => {
  const base = name.replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "_").trim();
  const trimmed = base.slice(0, maxLength);

  if (!trimmed.toLowerCase().endsWith(".pdf")) {
    return `${trimmed.replace(/\.+$/, "")}.pdf`;
  }

  return trimmed;
};
