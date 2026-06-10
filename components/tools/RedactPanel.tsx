"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PDFCanvas } from "@/components/canvas/PDFCanvas";
import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { PageNavigator } from "@/components/tools/PageNavigator";
import { Button } from "@/components/ui/Button";
import { getPageCount } from "@/lib/pdf/renderer";

export type RedactionArea = {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type RedactPanelProps = {
  file: File;
  bytes: Uint8Array;
  onRemoveFile: () => void;
  onApply: (areas: RedactionArea[]) => Promise<void>;
  onSaveToSandbox?: (areas: RedactionArea[]) => Promise<void>;
  savingToSandbox?: boolean;
};

type DrawingState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
} | null;

const toCssRect = (area: RedactionArea) => ({
  left: `${area.x * 100}%`,
  top: `${area.y * 100}%`,
  width: `${area.width * 100}%`,
  height: `${area.height * 100}%`
});

const normalizeRect = (startX: number, startY: number, endX: number, endY: number) => {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  return { x, y, width, height };
};

export const RedactPanel = ({
  file,
  bytes,
  onRemoveFile,
  onApply,
  onSaveToSandbox,
  savingToSandbox = false
}: RedactPanelProps) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [areas, setAreas] = useState<RedactionArea[]>([]);
  const [drawing, setDrawing] = useState<DrawingState>(null);

  useEffect(() => {
    let cancelled = false;

    const loadPages = async () => {
      try {
        const count = await getPageCount(bytes);
        if (!cancelled) {
          setPageCount(count);
        }
      } catch {
        if (!cancelled) {
          setPageCount(1);
        }
      }
    };

    void loadPages();
    return () => {
      cancelled = true;
    };
  }, [bytes]);

  const currentPageAreas = useMemo(() => areas.filter((area) => area.page === pageNumber), [areas, pageNumber]);

  const allLabels = useMemo(
    () =>
      areas.map((area, index) => ({
        id: area.id,
        label: `Page ${area.page}, Area ${index + 1}`
      })),
    [areas]
  );

  const finalizeDrawing = () => {
    if (!drawing || !overlayRef.current) {
      return;
    }

    const rect = overlayRef.current.getBoundingClientRect();
    const normalized = normalizeRect(drawing.startX, drawing.startY, drawing.currentX, drawing.currentY);

    if (normalized.width < 0.01 || normalized.height < 0.01) {
      setDrawing(null);
      return;
    }

    const next: RedactionArea = {
      id: crypto.randomUUID(),
      page: pageNumber,
      x: normalized.x / rect.width,
      y: normalized.y / rect.height,
      width: normalized.width / rect.width,
      height: normalized.height / rect.height
    };

    setAreas((current) => [...current, next]);
    setDrawing(null);
  };

  return (
    <div className="space-y-4">
      <FileInfoCard file={file} bytes={bytes} onRemove={onRemoveFile} />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
          <PageNavigator pageNumber={pageNumber} pageCount={pageCount} onPageChange={setPageNumber} />

          <div className="relative rounded-brutal border-2 border-ink bg-paper p-2">
            <div className="relative">
              <PDFCanvas bytes={bytes} pageNumber={pageNumber} scale={1} />

              <div
                ref={overlayRef}
                className="absolute inset-2 cursor-crosshair"
                onPointerDown={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const x = event.clientX - bounds.left;
                  const y = event.clientY - bounds.top;
                  setDrawing({ startX: x, startY: y, currentX: x, currentY: y });
                }}
                onPointerMove={(event) => {
                  if (!drawing) {
                    return;
                  }
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const x = event.clientX - bounds.left;
                  const y = event.clientY - bounds.top;
                  setDrawing((current) => (current ? { ...current, currentX: x, currentY: y } : null));
                }}
                onPointerUp={finalizeDrawing}
                onPointerLeave={finalizeDrawing}
              >
                {currentPageAreas.map((area) => (
                  <div key={area.id} className="absolute border-2 border-black bg-black" style={toCssRect(area)} />
                ))}

                {drawing && overlayRef.current ? (
                  <div
                    className="absolute border-2 border-red-700 bg-red-500/35"
                    style={
                      toCssRect({
                        id: "draft",
                        page: pageNumber,
                        ...(() => {
                          const rect = overlayRef.current?.getBoundingClientRect();
                          if (!rect) {
                            return { x: 0, y: 0, width: 0, height: 0 };
                          }
                          const normalized = normalizeRect(drawing.startX, drawing.startY, drawing.currentX, drawing.currentY);
                          return {
                            x: normalized.x / rect.width,
                            y: normalized.y / rect.height,
                            width: normalized.width / rect.width,
                            height: normalized.height / rect.height
                          };
                        })()
                      })
                    }
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => setAreas((current) => current.slice(0, -1))}>
              Undo last
            </Button>
            <Button type="button" variant="secondary" onClick={() => setAreas([])}>
              Clear all
            </Button>
            <Button type="button" onClick={() => void onApply(areas)}>
              Redact and Download
            </Button>
            {onSaveToSandbox ? (
              <Button
                type="button"
                variant="secondary"
                loading={savingToSandbox}
                onClick={() => void onSaveToSandbox(areas)}
              >
                Save to Sandbox
              </Button>
            ) : null}
          </div>
        </div>

        <aside className="space-y-3 rounded-brutal border-2 border-ink bg-surface p-3 shadow-brutal">
          <h3 className="text-base font-bold">Redactions</h3>
          <ul className="space-y-2">
            {allLabels.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded-brutal border-2 border-ink bg-paper px-2 py-1">
                <span className="text-xs font-semibold">{item.label}</span>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded border border-ink"
                  onClick={() => setAreas((current) => current.filter((area) => area.id !== item.id))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
};
