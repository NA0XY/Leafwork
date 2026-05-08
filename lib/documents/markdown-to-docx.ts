"use client";

import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  type IParagraphOptions
} from "docx";

const headingMap = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
  5: HeadingLevel.HEADING_5,
  6: HeadingLevel.HEADING_6
} as const;

const codeRun = (text: string): TextRun =>
  new TextRun({
    text,
    font: "Courier New",
    size: 20
  });

const paragraphFromLine = (line: string): IParagraphOptions | null => {
  const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);
  if (headingMatch) {
    const level = Math.min(6, headingMatch[1]?.length ?? 1) as 1 | 2 | 3 | 4 | 5 | 6;
    return {
      heading: headingMap[level],
      children: [new TextRun(headingMatch[2] ?? "")]
    };
  }

  const bulletMatch = /^[-*]\s+(.+)$/.exec(line);
  if (bulletMatch) {
    return {
      bullet: { level: 0 },
      children: [new TextRun(bulletMatch[1] ?? "")]
    };
  }

  const numberedMatch = /^(\d+)\.\s+(.+)$/.exec(line);
  if (numberedMatch) {
    return {
      children: [new TextRun(`${numberedMatch[1]}. ${numberedMatch[2]}`)]
    };
  }

  if (line.trim().length === 0) {
    return {
      children: [new TextRun("")]
    };
  }

  return {
    children: [new TextRun(line)]
  };
};

export const markdownToDocxBlob = async (markdown: string, title: string): Promise<Blob> => {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(title)]
    })
  );

  let inCodeBlock = false;
  const codeLines: string[] = [];

  const flushCodeBlock = () => {
    if (!codeLines.length) {
      return;
    }

    paragraphs.push(
      new Paragraph({
        children: codeLines.map((line, index) => codeRun(index === codeLines.length - 1 ? line : `${line}\n`))
      })
    );
    codeLines.length = 0;
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
      }
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    const paragraphOptions = paragraphFromLine(line);
    if (paragraphOptions) {
      paragraphs.push(new Paragraph(paragraphOptions));
    }
  }

  if (inCodeBlock) {
    flushCodeBlock();
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  return blob;
};
