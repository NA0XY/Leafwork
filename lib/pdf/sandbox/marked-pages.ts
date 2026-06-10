const normalizePageNumbers = (pages: number[]): number[] =>
  Array.from(new Set(pages.filter((page) => Number.isInteger(page) && page > 0))).sort((a, b) => a - b);

const compactPageRanges = (pages: number[]): string[] => {
  const sortedPages = normalizePageNumbers(pages);

  if (!sortedPages.length) {
    return [];
  }

  const ranges: string[] = [];
  let start = sortedPages[0] as number;
  let previous = start;

  for (const page of sortedPages.slice(1)) {
    if (page === previous + 1) {
      previous = page;
      continue;
    }

    ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
    start = page;
    previous = page;
  }

  ranges.push(start === previous ? `${start}` : `${start}-${previous}`);
  return ranges;
};

export const formatMarkedPageNumbers = (pages: number[]): string => {
  const normalizedPages = normalizePageNumbers(pages);
  const ranges = compactPageRanges(normalizedPages);

  if (!ranges.length) {
    return "";
  }

  return `${normalizedPages.length === 1 ? "Page" : "Pages"} ${ranges.join(", ")}`;
};
