"use client";

import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PDFCanvas } from "@/components/canvas/PDFCanvas";
import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getPageCount } from "@/lib/pdf/renderer";
import type { WatermarkPosition } from "@/lib/pdf/types";
import { cn } from "@/lib/utils/cn";

const colors = ["#111111", "#ffffff", "#dc2626", "#2563eb", "#16a34a", "#6b7280", "#ea580c", "#7c3aed"];

const positions: WatermarkPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right"
];

const positionClassMap: Record<WatermarkPosition, string> = {
  "top-left": "items-start justify-start",
  "top-center": "items-start justify-center",
  "top-right": "items-start justify-end",
  "middle-left": "items-center justify-start",
  center: "items-center justify-center",
  "middle-right": "items-center justify-end",
  "bottom-left": "items-end justify-start",
  "bottom-center": "items-end justify-center",
  "bottom-right": "items-end justify-end"
};

type WatermarkPanelProps = {
  file: File;
  bytes: Uint8Array;
  progress: number;
  isProcessing: boolean;
  downloadComplete: boolean;
  onRemoveFile: () => void;
  onTextWatermark: (input: {
    text: string;
    fontSize: number;
    opacity: number;
    rotation: number;
    position: WatermarkPosition;
    colorHex: string;
  }) => Promise<void>;
  onImageWatermark: (imageData: string, input: { opacity: number; rotation: number; position: WatermarkPosition }) => Promise<void>;
};

export const WatermarkPanel = ({
  file,
  bytes,
  progress,
  isProcessing,
  downloadComplete,
  onRemoveFile,
  onTextWatermark,
  onImageWatermark
}: WatermarkPanelProps) => {
  const [tab, setTab] = useState<"text" | "image">("text");
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(42);
  const [opacity, setOpacity] = useState(35);
  const [rotation, setRotation] = useState(45);
  const [colorHex, setColorHex] = useState("#111111");
  const [position, setPosition] = useState<WatermarkPosition>("center");
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState(30);
  const [pageCount, setPageCount] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);

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

  const colorRgb = useMemo(() => {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorHex);
    if (!match) {
      return { r: 0, g: 0, b: 0 };
    }

    return {
      r: parseInt(match[1] ?? "00", 16) / 255,
      g: parseInt(match[2] ?? "00", 16) / 255,
      b: parseInt(match[3] ?? "00", 16) / 255
    };
  }, [colorHex]);

  return (
    <div className="space-y-4">
      <FileInfoCard file={file} bytes={bytes} onRemove={onRemoveFile} />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="space-y-4 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
          <div className="flex gap-2">
            <Button type="button" size="sm" variant={tab === "text" ? "primary" : "secondary"} onClick={() => setTab("text")}>
              Text watermark
            </Button>
            <Button type="button" size="sm" variant={tab === "image" ? "primary" : "secondary"} onClick={() => setTab("image")}>
              Image watermark
            </Button>
          </div>

          {tab === "text" ? (
            <div className="space-y-3">
              <label className="text-sm font-semibold">
                Watermark text
                <input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className="mt-1 w-full rounded-brutal border-2 border-ink bg-surface px-3 py-2"
                />
              </label>

              <label className="block text-sm font-semibold">
                Font size: {fontSize}px
                <input
                  type="range"
                  min={12}
                  max={120}
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  className="mt-1 w-full"
                />
              </label>

              <label className="block text-sm font-semibold">
                Opacity: {opacity}%
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={opacity}
                  onChange={(event) => setOpacity(Number(event.target.value))}
                  className="mt-1 w-full"
                />
              </label>

              <label className="block text-sm font-semibold">
                Rotation: {rotation} deg
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={rotation}
                  onChange={(event) => setRotation(Number(event.target.value))}
                  className="mt-1 w-full"
                />
              </label>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Color</p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Set color ${color}`}
                      onClick={() => setColorHex(color)}
                      className={cn(
                        "h-7 w-7 rounded-brutal border-2 border-ink",
                        colorHex === color && "ring-2 ring-primary ring-offset-2"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <input
                    type="text"
                    value={colorHex}
                    onChange={(event) => setColorHex(event.target.value)}
                    className="w-24 rounded-brutal border-2 border-ink bg-surface px-2 text-xs"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-brutal border-2 border-dashed border-ink bg-paper text-sm font-semibold">
                <ImageIcon className="mb-1 h-5 w-5" />
                Upload PNG/JPG/SVG watermark
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(event) => {
                    const selected = event.target.files?.[0];
                    if (!selected) {
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        setImageData(reader.result);
                      }
                    };
                    reader.readAsDataURL(selected);
                  }}
                />
              </label>

              <label className="block text-sm font-semibold">
                Opacity: {opacity}%
                <input
                  type="range"
                  min={5}
                  max={100}
                  value={opacity}
                  onChange={(event) => setOpacity(Number(event.target.value))}
                  className="mt-1 w-full"
                />
              </label>

              <label className="block text-sm font-semibold">
                Size: {imageSize}%
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={imageSize}
                  onChange={(event) => setImageSize(Number(event.target.value))}
                  className="mt-1 w-full"
                />
              </label>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold">Position</p>
            <div className="grid grid-cols-3 gap-1">
              {positions.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  className={cn(
                    "rounded-brutal border-2 border-ink bg-paper px-2 py-2 text-[11px] font-semibold",
                    position === candidate && "bg-accent"
                  )}
                  onClick={() => setPosition(candidate)}
                >
                  {candidate.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          <ProgressBar value={progress} animated showLabel />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              loading={isProcessing}
              onClick={() => {
                if (tab === "text") {
                  void onTextWatermark({
                    text,
                    fontSize,
                    opacity: opacity / 100,
                    rotation,
                    position,
                    colorHex
                  });
                  return;
                }

                if (imageData) {
                  void onImageWatermark(imageData, {
                    opacity: opacity / 100,
                    rotation,
                    position
                  });
                }
              }}
            >
              Apply watermark
            </Button>

            {downloadComplete ? <Badge tone="success">Downloaded OK</Badge> : null}
          </div>
        </div>

        <div className="space-y-3 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
          <p className="text-sm font-semibold">Live preview</p>
          <div className="relative overflow-hidden rounded-brutal border-2 border-ink bg-paper p-2">
            <div className="relative overflow-hidden">
              <PDFCanvas bytes={bytes} pageNumber={pageNumber} scale={0.8} />
              <div className={cn("absolute inset-2 flex p-6", positionClassMap[position])}>
                {tab === "text" ? (
                  <p
                    className="pointer-events-none select-none font-bold"
                    style={{
                      fontSize,
                      opacity: opacity / 100,
                      transform: `rotate(${rotation}deg)`,
                      color: colorHex
                    }}
                  >
                    {text || "WATERMARK"}
                  </p>
                ) : imageData ? (
                  <img
                    src={imageData}
                    alt="Watermark preview"
                    className="pointer-events-none select-none"
                    style={{ width: `${imageSize}%`, opacity: opacity / 100, transform: `rotate(${rotation}deg)` }}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button type="button" size="sm" variant="secondary" disabled={pageNumber <= 1} onClick={() => setPageNumber((page) => page - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <p className="text-sm font-semibold">
              Page {pageNumber} / {pageCount}
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={pageNumber >= pageCount}
              onClick={() => setPageNumber((page) => page + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

