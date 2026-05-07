const DEFAULT_DIMENSIONS = { width: 612, height: 792 };

const toLatin = (bytes) => new TextDecoder("latin1").decode(bytes);

const findStartXrefOffset = (bytes) => {
  const tailStart = Math.max(0, bytes.length - 1024);
  const tail = toLatin(bytes.slice(tailStart));
  const marker = tail.lastIndexOf("startxref");
  if (marker < 0) {
    return null;
  }

  const after = tail.slice(marker + "startxref".length);
  const match = after.match(/\s*(\d+)/);
  if (!match) {
    return null;
  }

  return Number(match[1]);
};

const countByPageObjects = (content) => {
  const matches = content.match(/\/Type\s*\/Page(?!s)/g);
  return matches ? matches.length : 0;
};

const countByPageTree = (content) => {
  const matches = [...content.matchAll(/\/Type\s*\/Pages[\s\S]{0,220}?\/Count\s+(\d+)/g)];
  if (!matches.length) {
    return 0;
  }

  const counts = matches.map((match) => Number(match[1]));
  return Math.max(...counts, 0);
};

const parseMediaBoxes = (content) => {
  const matches = [...content.matchAll(/\/MediaBox\s*\[\s*([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s+([\d.\-]+)\s*\]/g)];
  if (!matches.length) {
    return [];
  }

  return matches.map((match) => {
    const x1 = Number(match[1]);
    const y1 = Number(match[2]);
    const x2 = Number(match[3]);
    const y2 = Number(match[4]);

    const width = Number.isFinite(x2 - x1) ? Math.abs(x2 - x1) : DEFAULT_DIMENSIONS.width;
    const height = Number.isFinite(y2 - y1) ? Math.abs(y2 - y1) : DEFAULT_DIMENSIONS.height;

    return {
      width: width > 0 ? width : DEFAULT_DIMENSIONS.width,
      height: height > 0 ? height : DEFAULT_DIMENSIONS.height
    };
  });
};

const inspectPdf = (bytes) => {
  const content = toLatin(bytes);
  const pageByObjects = countByPageObjects(content);
  const pageByTree = countByPageTree(content);

  const startXrefOffset = findStartXrefOffset(bytes);
  let xrefWindow = "";
  if (Number.isFinite(startXrefOffset) && startXrefOffset >= 0) {
    const slice = bytes.slice(startXrefOffset, Math.min(bytes.length, startXrefOffset + 8000));
    xrefWindow = toLatin(slice);
  }

  const xrefPages = countByPageObjects(xrefWindow);
  const pageCount = Math.max(1, pageByObjects, pageByTree, xrefPages);

  const mediaBoxes = parseMediaBoxes(content);
  const dimensions = Array.from({ length: pageCount }, (_, index) => mediaBoxes[index] || mediaBoxes[0] || DEFAULT_DIMENSIONS);

  return {
    pageCount,
    dimensions
  };
};

self.onmessage = (event) => {
  const payload = event.data;

  if (!payload || payload.action !== "inspect") {
    return;
  }

  try {
    const bytes = new Uint8Array(payload.bytes);
    const inspected = inspectPdf(bytes);

    self.postMessage({
      id: payload.id,
      pageCount: inspected.pageCount,
      dimensions: inspected.dimensions
    });
  } catch {
    self.postMessage({
      id: payload.id,
      pageCount: 1,
      dimensions: [DEFAULT_DIMENSIONS]
    });
  }
};
