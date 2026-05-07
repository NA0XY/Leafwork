"use client";

type NormalizedTextItem = {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TableRegion = {
  page: number;
  bbox: { x: number; y: number; width: number; height: number };
  rows: string[][];
};

const loadPdfJs = async () => {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.5.136/build/pdf.worker.min.mjs";
  return pdfjs;
};

const normalizeTextItems = (items: unknown[]): NormalizedTextItem[] => {
  const normalized: NormalizedTextItem[] = [];

  items.forEach((item) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const candidate = item as { str?: unknown; transform?: unknown; width?: unknown; height?: unknown };
    if (typeof candidate.str !== "string") {
      return;
    }

    const transform = Array.isArray(candidate.transform) ? candidate.transform : [];
    const x = typeof transform[4] === "number" ? transform[4] : 0;
    const y = typeof transform[5] === "number" ? transform[5] : 0;
    const width = typeof candidate.width === "number" ? candidate.width : 0;
    const height = typeof candidate.height === "number" ? candidate.height : 12;

    normalized.push({
      str: candidate.str,
      x,
      y,
      width,
      height
    });
  });

  return normalized;
};

const rowsFromItems = (items: NormalizedTextItem[]): NormalizedTextItem[][] => {
  const rows: NormalizedTextItem[][] = [];

  const sorted = [...items].sort((a, b) => {
    const dy = b.y - a.y;
    if (Math.abs(dy) > 1.5) return dy;
    return a.x - b.x;
  });

  sorted.forEach((item) => {
    const row = rows.find((candidate) => Math.abs(candidate[0]?.y - item.y) < 5);
    if (row) {
      row.push(item);
    } else {
      rows.push([item]);
    }
  });

  return rows;
};

const inferHeadingMarker = (height: number, maxHeight: number): string => {
  if (height >= maxHeight * 0.88) return "[H1]";
  if (height >= maxHeight * 0.72) return "[H2]";
  if (height >= maxHeight * 0.58) return "[H3]";
  return "";
};

const looksTabular = (rows: NormalizedTextItem[][]): boolean => {
  if (rows.length < 2) {
    return false;
  }

  const columnCandidates = rows
    .slice(0, Math.min(6, rows.length))
    .map((row) => row.length)
    .filter((count) => count > 1);

  if (!columnCandidates.length) {
    return false;
  }

  const avg = columnCandidates.reduce((acc, count) => acc + count, 0) / columnCandidates.length;
  return avg >= 2;
};

export const extractTextWithLayout = async (bytes: Uint8Array): Promise<string> => {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;

  const sections: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const items = normalizeTextItems(textContent.items as unknown[]);

      const maxHeight = items.reduce((max, item) => Math.max(max, item.height), 0);
      const rows = rowsFromItems(items);
      const pageLines: string[] = [];

      if (looksTabular(rows)) {
        pageLines.push("[TABLE_START]");
      }

      let previousX = 0;
      rows.forEach((row) => {
        const ordered = [...row].sort((a, b) => a.x - b.x);
        const chunks = ordered.map((item) => {
          const marker = inferHeadingMarker(item.height, maxHeight || 1);
          const columnBreak = item.x - previousX > 250 ? " [COLUMN_BREAK] " : " ";
          previousX = item.x;
          return `${marker}${item.str}${columnBreak}`.trim();
        });

        pageLines.push(chunks.join(" ").replace(/\s+/g, " ").trim());
      });

      if (looksTabular(rows)) {
        pageLines.push("[TABLE_END]");
      }

      sections.push(pageLines.filter(Boolean).join("\n"));
      sections.push(`[PAGE_BREAK: ${pageNumber}]`);
    }
  } finally {
    await pdf.destroy();
  }

  return sections.join("\n").trim();
};

export const extractTableRegions = async (bytes: Uint8Array): Promise<TableRegion[]> => {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdf = await loadingTask.promise;

  const regions: TableRegion[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const items = normalizeTextItems(textContent.items as unknown[]);
      const rows = rowsFromItems(items);

      if (!looksTabular(rows)) {
        continue;
      }

      const sortedRows = rows.map((row) => [...row].sort((a, b) => a.x - b.x));
      const xValues = sortedRows.flatMap((row) => row.map((item) => item.x));
      const yValues = sortedRows.flatMap((row) => row.map((item) => item.y));
      const widths = sortedRows.flatMap((row) => row.map((item) => item.width));
      const heights = sortedRows.flatMap((row) => row.map((item) => item.height));

      if (!xValues.length || !yValues.length || !widths.length || !heights.length) {
        continue;
      }

      const minX = Math.min(...xValues);
      const minY = Math.min(...yValues);
      const maxX = Math.max(...xValues.map((x, idx) => x + (widths[idx] ?? 0)));
      const maxY = Math.max(...yValues.map((y, idx) => y + (heights[idx] ?? 0)));

      regions.push({
        page: pageNumber,
        bbox: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        },
        rows: sortedRows.map((row) => row.map((item) => item.str.trim()).filter(Boolean))
      });
    }
  } finally {
    await pdf.destroy();
  }

  return regions;
};


