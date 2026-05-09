"use client";

import { useEffect, useRef, useState } from "react";

import { renderPage } from "@/lib/pdf/renderer";

type PDFCanvasProps = {
  bytes: Uint8Array;
  pageNumber: number;
  scale?: number;
};

export const PDFCanvas = ({ bytes, pageNumber, scale = 1.2 }: PDFCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const draw = async () => {
      if (!canvasRef.current) {
        return;
      }

      setIsLoading(true);

      try {
        await renderPage(bytes, pageNumber, scale, canvasRef.current, controller.signal);
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          console.error("pdf_canvas_render_error", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void draw();

    return () => {
      controller.abort();
    };
  }, [bytes, pageNumber, scale]);

  return (
    <div className="relative w-full" style={{ paddingBottom: "141.42%" }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-contain"
        aria-label={`PDF page ${pageNumber}`}
      />
      {isLoading ? <div className="absolute inset-0 animate-pulse rounded-brutal bg-green-50" /> : null}
    </div>
  );
};
