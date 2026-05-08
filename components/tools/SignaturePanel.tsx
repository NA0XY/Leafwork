"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

type SignatureMode = "draw" | "type" | "upload";

type SignaturePanelProps = {
  onSignatureReady: (imageDataUrl: string) => void;
};

const cursiveFonts = ["Pacifico", "Dancing Script", "Satisfy", "Great Vibes", "Kaushan Script"];
const fontStylesheetHref =
  "https://fonts.googleapis.com/css2?family=Pacifico&family=Dancing+Script:wght@400;700&family=Satisfy&family=Great+Vibes&family=Kaushan+Script&display=swap";

const trimTransparentCanvas = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const context = source.getContext("2d");
  if (!context) {
    return source;
  }

  const { width, height } = source;
  const { data } = context.getImageData(0, 0, width, height);

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return source;
  }

  const padding = 6;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;

  const trimmed = document.createElement("canvas");
  trimmed.width = cropWidth;
  trimmed.height = cropHeight;
  const trimmedContext = trimmed.getContext("2d");
  if (!trimmedContext) {
    return source;
  }

  trimmedContext.drawImage(source, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  return trimmed;
};

export const SignaturePanel = ({ onSignatureReady }: SignaturePanelProps) => {
  const [mode, setMode] = useState<SignatureMode>("draw");
  const [typedName, setTypedName] = useState("Harsh Singhal");
  const [fontFamily, setFontFamily] = useState(cursiveFonts[0]);
  const [strokeColor, setStrokeColor] = useState("#111111");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const existing = document.querySelector<HTMLLinkElement>('link[data-signature-fonts="1"]');
    if (existing) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontStylesheetHref;
    link.setAttribute("data-signature-fonts", "1");
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    context.lineJoin = "round";
    context.lineCap = "round";
  }, [strokeColor, strokeWidth]);

  const typedPreviewStyle = useMemo(
    () => ({ fontFamily: `'${fontFamily}', cursive` }),
    [fontFamily]
  );

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const trimmed = trimTransparentCanvas(canvas);
    onSignatureReady(trimmed.toDataURL("image/png"));
  };

  const ensureFontLoaded = async (fontName: string): Promise<void> => {
    if (!("fonts" in document)) {
      return;
    }

    await document.fonts.load(`64px "${fontName}"`);
    await document.fonts.ready;
  };

  return (
    <Card className="space-y-4">
      <h3 className="text-xl font-bold">Signature Builder</h3>
      <div className="flex flex-wrap gap-2">
        {(["draw", "type", "upload"] as SignatureMode[]).map((value) => (
          <Button
            key={value}
            type="button"
            variant={mode === value ? "primary" : "secondary"}
            onClick={() => setMode(value)}
          >
            {value.toUpperCase()}
          </Button>
        ))}
      </div>

      {mode === "draw" ? (
        <div className="space-y-2">
          <canvas
            ref={canvasRef}
            width={600}
            height={180}
            className="w-full rounded-brutal border-2 border-ink bg-white"
            onPointerDown={(event) => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              const context = canvas.getContext("2d");
              if (!context) return;
              drawing.current = true;
              context.beginPath();
              context.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
            }}
            onPointerMove={(event) => {
              if (!drawing.current) return;
              const canvas = canvasRef.current;
              if (!canvas) return;
              const context = canvas.getContext("2d");
              if (!context) return;
              context.strokeStyle = strokeColor;
              context.lineWidth = strokeWidth;
              context.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
              context.stroke();
            }}
            onPointerUp={() => {
              drawing.current = false;
            }}
            onPointerLeave={() => {
              drawing.current = false;
            }}
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="text-sm font-medium">
              Color
              <input
                type="color"
                value={strokeColor}
                onChange={(event) => setStrokeColor(event.target.value)}
                className="mt-1 h-10 w-full"
              />
            </label>
            <label className="text-sm font-medium">
              Stroke width
              <input
                type="range"
                min={1}
                max={8}
                step={1}
                value={strokeWidth}
                onChange={(event) => setStrokeWidth(Number(event.target.value))}
                className="mt-3 w-full"
              />
            </label>
            <Button
              type="button"
              variant="secondary"
              className="mt-5"
              onClick={() => {
                const canvas = canvasRef.current;
                const context = canvas?.getContext("2d");
                if (!canvas || !context) return;
                context.clearRect(0, 0, canvas.width, canvas.height);
              }}
            >
              Clear
            </Button>
          </div>

          <Button onClick={exportCanvas}>Use Drawn Signature</Button>
        </div>
      ) : null}

      {mode === "type" ? (
        <div className="space-y-3">
          <Input value={typedName} onChange={(event) => setTypedName(event.target.value)} placeholder="Type signature" />
          <select
            className="w-full rounded-brutal border-2 border-ink bg-surface px-3 py-2"
            value={fontFamily}
            onChange={(event) => setFontFamily(event.target.value)}
          >
            {cursiveFonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
          <p className="rounded-brutal border-2 border-ink bg-white p-4 text-3xl" style={typedPreviewStyle}>
            {typedName}
          </p>
          <Button
            onClick={async () => {
              const canvas = document.createElement("canvas");
              canvas.width = 640;
              canvas.height = 200;
              const context = canvas.getContext("2d");
              if (!context) {
                return;
              }
              await ensureFontLoaded(fontFamily);
              context.fillStyle = "#111111";
              context.font = `64px '${fontFamily}'`;
              context.textBaseline = "middle";
              context.fillText(typedName, 20, 120);
              const trimmed = trimTransparentCanvas(canvas);
              onSignatureReady(trimmed.toDataURL("image/png"));
            }}
          >
            Use Typed Signature
          </Button>
        </div>
      ) : null}

      {mode === "upload" ? (
        <label className="brutalist-btn inline-block cursor-pointer px-4 py-2 text-sm">
          Upload PNG Signature
          <input
            type="file"
            accept="image/png"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") {
                  onSignatureReady(reader.result);
                }
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
      ) : null}
    </Card>
  );
};
