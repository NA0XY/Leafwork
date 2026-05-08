"use client";

import { useEffect, useRef } from "react";

import { renderPage } from "@/lib/pdf/renderer";

type PDFCanvasProps = {
  bytes: Uint8Array;
  pageNumber: number;
  scale?: number;
};

export const PDFCanvas = ({ bytes, pageNumber, scale = 1.2 }: PDFCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const draw = async () => {
      if (!canvasRef.current) {
        return;
      }

      try {
        await renderPage(bytes, pageNumber, scale, canvasRef.current, controller.signal);
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          console.error("pdf_canvas_render_error", error);
        }
      }
    };

    void draw();

    return () => {
      controller.abort();
    };
  }, [bytes, pageNumber, scale]);

  return <canvas ref={canvasRef} className="block h-auto max-w-full" aria-label={`PDF page ${pageNumber}`} />;
};
