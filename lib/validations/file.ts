export const PDF_MAGIC_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;

export const checkMagicBytes = (buffer: ArrayBuffer): boolean => {
  const bytes = new Uint8Array(buffer.slice(0, PDF_MAGIC_HEADER.length));
  return PDF_MAGIC_HEADER.every((value, index) => bytes[index] === value);
};

export const isSafeFilename = (name: string): boolean => {
  if (!name.toLowerCase().endsWith(".pdf")) {
    return false;
  }

  if (name.includes("/") || name.includes("\\") || name.includes("\u0000")) {
    return false;
  }

  for (const char of name) {
    const code = char.charCodeAt(0);
    if (code <= 31 || code === 127) {
      return false;
    }
  }

  return /^[a-zA-Z0-9._\-\s]+$/.test(name);
};

export const estimatePageCount = (bytes: Uint8Array): number => {
  const content = new TextDecoder("latin1").decode(bytes);
  const matches = content.match(/\/Type\s*\/Page(?!s)/g);
  return matches?.length ?? 1;
};

export const sanitizeFilename = (name: string, maxLength = 255): string => {
  const base = name.replace(/[^a-zA-Z0-9._\-\s]/g, "_").trim();
  const trimmed = base.slice(0, maxLength);

  if (!trimmed.toLowerCase().endsWith(".pdf")) {
    return `${trimmed.replace(/\.+$/, "")}.pdf`;
  }

  return trimmed;
};
