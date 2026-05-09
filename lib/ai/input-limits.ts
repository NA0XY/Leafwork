export const AI_INPUT_CHAR_LIMIT = {
  // Keep this lower than generic limits because this route also needs output tokens
  // within Groq on-demand TPM constraints.
  pdfToWord: 12_000,
  // Larger limit to avoid cutting long documents during summarization.
  summarize: 200_000,
  detectPii: 30_000,
  extractTable: 20_000,
  legibility: 2_000
} as const;

export type ClampResult = {
  text: string;
  originalLength: number;
  clampedLength: number;
  truncated: boolean;
};

export const clampTextForAI = (text: string, maxChars: number): ClampResult => {
  const normalized = text.trim();
  const originalLength = normalized.length;
  const clampedLength = Math.max(1, maxChars);
  const truncated = originalLength > clampedLength;

  return {
    text: truncated ? normalized.slice(0, clampedLength) : normalized,
    originalLength,
    clampedLength,
    truncated
  };
};
