"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PDFCanvas } from "@/components/canvas/PDFCanvas";
import { SignaturePanel } from "@/components/tools/SignaturePanel";
import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { Button } from "@/components/ui/Button";
import { DropZone } from "@/components/ui/DropZone";
import { useToast } from "@/hooks/useToast";
import { withPdfLib } from "@/lib/pdf/engine";
import { getPageCount } from "@/lib/pdf/renderer";
import { downloadBlob } from "@/lib/utils/file";

type Placement = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ResizeMode = "none" | "drag" | "nw" | "ne" | "sw" | "se";

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const SignToolClient = () => {
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [placement, setPlacement] = useState<Placement>({ x: 0.35, y: 0.45, width: 0.3, height: 0.12 });
  const [mode, setMode] = useState<ResizeMode>("none");
  const [busy, setBusy] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!bytes) {
      return;
    }

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

  const handles = useMemo(
    () => [
      { key: "nw", className: "-left-1.5 -top-1.5 cursor-nwse-resize" },
      { key: "ne", className: "-right-1.5 -top-1.5 cursor-nesw-resize" },
      { key: "sw", className: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
      { key: "se", className: "-bottom-1.5 -right-1.5 cursor-nwse-resize" }
    ],
    []
  );

  if (!file || !bytes) {
    return (
      <DropZone
        multiple={false}
        onFiles={(files) => {
          const next = files[0];
          if (!next) {
            return;
          }
          void (async () => {
            setFile(next);
            setBytes(new Uint8Array(await next.arrayBuffer()));
          })();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <FileInfoCard
        file={file}
        bytes={bytes}
        onRemove={() => {
          setFile(null);
          setBytes(null);
          setSignatureData(null);
        }}
      />

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
          <SignaturePanel onSignatureReady={setSignatureData} />
        </div>

        <div className="space-y-3 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
          <div className="flex items-center justify-center gap-3">
            <Button type="button" size="sm" variant="secondary" disabled={pageNumber <= 1} onClick={() => setPageNumber((value) => value - 1)}>
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
              onClick={() => setPageNumber((value) => value + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="relative rounded-brutal border-2 border-ink bg-paper p-2">
            <div className="relative">
              <PDFCanvas bytes={bytes} pageNumber={pageNumber} scale={1} />

              <div
                ref={overlayRef}
                className="absolute inset-2"
                onPointerMove={(event) => {
                  if (mode === "none") {
                    return;
                  }
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const nextX = event.clientX - bounds.left;
                  const nextY = event.clientY - bounds.top;

                  setPlacement((current) => {
                    const xPct = nextX / bounds.width;
                    const yPct = nextY / bounds.height;

                    if (mode === "drag") {
                      return {
                        ...current,
                        x: clamp(xPct - current.width / 2, 0, 1 - current.width),
                        y: clamp(yPct - current.height / 2, 0, 1 - current.height)
                      };
                    }

                    const next = { ...current };
                    if (mode.includes("n")) {
                      const bottom = current.y + current.height;
                      next.y = clamp(yPct, 0, bottom - 0.05);
                      next.height = clamp(bottom - next.y, 0.05, 0.9);
                    }
                    if (mode.includes("s")) {
                      next.height = clamp(yPct - current.y, 0.05, 1 - current.y);
                    }
                    if (mode.includes("w")) {
                      const right = current.x + current.width;
                      next.x = clamp(xPct, 0, right - 0.08);
                      next.width = clamp(right - next.x, 0.08, 0.9);
                    }
                    if (mode.includes("e")) {
                      next.width = clamp(xPct - current.x, 0.08, 1 - current.x);
                    }
                    return next;
                  });
                }}
                onPointerUp={() => setMode("none")}
                onPointerLeave={() => setMode("none")}
              >
                {signatureData ? (
                  <div
                    className="absolute border-2 border-primary bg-green-50/20"
                    style={{
                      left: `${placement.x * 100}%`,
                      top: `${placement.y * 100}%`,
                      width: `${placement.width * 100}%`,
                      height: `${placement.height * 100}%`
                    }}
                  >
                    <button
                      type="button"
                      className="absolute inset-0 cursor-move"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        setMode("drag");
                      }}
                      aria-label="Drag signature"
                    >
                      <img src={signatureData} alt="Signature" className="h-full w-full object-contain" />
                    </button>

                    {handles.map((handle) => (
                      <button
                        key={handle.key}
                        type="button"
                        className={`absolute h-3 w-3 rounded-full border border-ink bg-accent ${handle.className}`}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          setMode(handle.key as ResizeMode);
                        }}
                        aria-label={`Resize ${handle.key}`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <Button
            type="button"
            loading={busy}
            disabled={!signatureData}
            onClick={async () => {
              if (!signatureData) {
                return;
              }

              setBusy(true);

              const result = await withPdfLib(async (pdfLib) => {
                const doc = await pdfLib.PDFDocument.load(bytes);
                const payload = signatureData.split(",")[1] ?? "";
                const sigBytes = Uint8Array.from(atob(payload), (char) => char.charCodeAt(0));
                const image = signatureData.startsWith("data:image/png")
                  ? await doc.embedPng(sigBytes)
                  : await doc.embedJpg(sigBytes);

                const page = doc.getPage(Math.max(0, pageNumber - 1));
                const size = page.getSize();

                page.drawImage(image, {
                  x: placement.x * size.width,
                  y: size.height - (placement.y + placement.height) * size.height,
                  width: placement.width * size.width,
                  height: placement.height * size.height
                });

                const output = await doc.save({ useObjectStreams: true, addDefaultPage: false });
                return new Blob([output], { type: "application/pdf" });
              });

              setBusy(false);

              if (!result.data) {
                toast.error("Signature failed", result.error?.message ?? "Unable to place signature");
                return;
              }

              downloadBlob(result.data, `${file.name.replace(/\.pdf$/i, "")}_signed.pdf`);
              toast.success("Signed PDF downloaded");
            }}
          >
            Place Signature
          </Button>
        </div>
      </section>
    </div>
  );
};
