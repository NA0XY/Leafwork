"use client";

import { clonePdfBytes, loadPdfJs } from "@/lib/pdf/pdfjs";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const pdfToLayoutDocxBlob = async (bytes: Uint8Array): Promise<Blob> => {
  const pdfjs = await loadPdfJs();
  const loadingTask = pdfjs.getDocument({ data: clonePdfBytes(bytes) });
  const pdf = await loadingTask.promise;

  try {
    const pageHtml: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.35 });
      const textContent = await page.getTextContent();

      const itemsHtml = (textContent.items as Array<{
        str?: string;
        transform?: number[];
        height?: number;
        width?: number;
      }>)
        .map((item) => {
          const raw = item.str ?? "";
          const str = raw.trim();
          if (!str) {
            return "";
          }

          const transform = Array.isArray(item.transform) ? item.transform : [1, 0, 0, 1, 0, 0];
          const x = transform[4] ?? 0;
          const y = transform[5] ?? 0;
          const height = Math.max(8, item.height ?? 12);
          const width = Math.max(1, item.width ?? str.length * (height * 0.45));
          const angle = Math.atan2(transform[1] ?? 0, transform[0] ?? 1);
          const rotationDeg = (angle * 180) / Math.PI;
          const top = viewport.height - y - height;

          return `<div class="text-item" style="left:${x.toFixed(2)}px;top:${top.toFixed(
            2
          )}px;width:${width.toFixed(2)}px;font-size:${height.toFixed(2)}px;transform:rotate(${rotationDeg.toFixed(
            2
          )}deg);">${escapeHtml(raw)}</div>`;
        })
        .filter(Boolean)
        .join("");

      pageHtml.push(
        `<section class="pdf-page" style="width:${viewport.width.toFixed(2)}px;height:${viewport.height.toFixed(
          2
        )}px;">${itemsHtml}</section>`
      );
    }

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        margin: 0;
        padding: 12px;
        font-family: "Times New Roman", serif;
        background: #ffffff;
      }
      .pdf-page {
        position: relative;
        margin: 0 auto 18px auto;
        border: 1px solid #e5e7eb;
        background: #ffffff;
        overflow: hidden;
      }
      .text-item {
        position: absolute;
        white-space: pre;
        line-height: 1;
        transform-origin: left top;
      }
    </style>
  </head>
  <body>
    ${pageHtml.join("")}
  </body>
</html>`;

    const htmlDocx = (await import("html-docx-js/dist/html-docx")).default;
    return htmlDocx.asBlob(html, {
      orientation: "portrait",
      margins: { top: 720, right: 720, bottom: 720, left: 720 }
    });
  } finally {
    await pdf.destroy();
  }
};
