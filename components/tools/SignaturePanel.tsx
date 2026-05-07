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

export const SignaturePanel = ({ onSignatureReady }: SignaturePanelProps) => {
  const [mode, setMode] = useState<SignatureMode>("draw");
  const [typedName, setTypedName] = useState("Harsh Singhal");
  const [fontFamily, setFontFamily] = useState(cursiveFonts[0]);
  const [strokeColor, setStrokeColor] = useState("#111111");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
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
    onSignatureReady(canvas.toDataURL("image/png"));
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
                context.fillStyle = "#ffffff";
                context.fillRect(0, 0, canvas.width, canvas.height);
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
            onClick={() => {
              const canvas = document.createElement("canvas");
              canvas.width = 640;
              canvas.height = 200;
              const context = canvas.getContext("2d");
              if (!context) {
                return;
              }
              context.fillStyle = "#ffffff";
              context.fillRect(0, 0, canvas.width, canvas.height);
              context.fillStyle = "#111111";
              context.font = `64px '${fontFamily}'`;
              context.fillText(typedName, 20, 120);
              onSignatureReady(canvas.toDataURL("image/png"));
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
