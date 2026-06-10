"use client";

import { useMemo, useState } from "react";

import { FileInfoCard } from "@/components/tools/FileInfoCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatBytes } from "@/lib/utils/format";

type CompressResult = {
  blob: Blob;
  originalBytes: number;
  compressedBytes: number;
  quality: number;
  iterationsUsed: number;
  usedRasterization: boolean;
  targetBytes: number;
  hitTarget: boolean;
  renderScale: number;
  vectorTextPreserved: boolean;
  usedGrayscale: boolean;
};

type CompressPanelProps = {
  file: File;
  progress: number;
  isProcessing: boolean;
  downloadComplete: boolean;
  error: string | null;
  onRemoveFile: () => void;
  onCompress: (
    targetKB: number,
    stripMetadata: boolean,
    allowAggressiveCompression: boolean,
    grayscale: boolean,
    preserveSelectableText: boolean
  ) => Promise<CompressResult | null>;
};

export const CompressPanel = ({
  file,
  progress,
  isProcessing,
  downloadComplete,
  error,
  onRemoveFile,
  onCompress
}: CompressPanelProps) => {
  const [targetValue, setTargetValue] = useState<string>("");
  const [unit, setUnit] = useState<"KB" | "MB">("KB");
  const [stripMetadata, setStripMetadata] = useState(true);
  const [allowAggressiveCompression, setAllowAggressiveCompression] = useState(false);
  const [grayscale, setGrayscale] = useState(false);
  const [preserveSelectableText, setPreserveSelectableText] = useState(true);
  const [result, setResult] = useState<CompressResult | null>(null);

  const targetKB = useMemo(() => {
    const parsed = Number(targetValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 0;
    }
    return unit === "KB" ? parsed : parsed * 1024;
  }, [targetValue, unit]);

  const estimate = useMemo(() => {
    if (!targetKB) {
      return null;
    }

    const currentKB = Math.max(1, file.size / 1024);
    const ratio = Math.max(0.15, targetKB / currentKB);
    const estimatedKB = currentKB * ratio;
    const reduction = Math.max(0, (1 - estimatedKB / currentKB) * 100);

    return {
      estimatedKB,
      reduction
    };
  }, [file.size, targetKB]);

  const compressionSummary = useMemo(() => {
    if (!result) {
      return null;
    }

    const reduction = Math.max(0, ((result.originalBytes - result.compressedBytes) / result.originalBytes) * 100);
    return {
      original: formatBytes(result.originalBytes),
      compressed: formatBytes(result.compressedBytes),
      reduction,
      usedRasterization: result.usedRasterization,
      hitTarget: result.hitTarget,
      target: formatBytes(result.targetBytes),
      vectorTextPreserved: result.vectorTextPreserved,
      usedGrayscale: result.usedGrayscale,
      quality: result.quality,
      renderScale: result.renderScale,
      iterationsUsed: result.iterationsUsed,
      returnedOriginal: result.compressedBytes >= result.originalBytes
    };
  }, [result]);

  return (
    <div className="space-y-4">
      <FileInfoCard file={file} onRemove={onRemoveFile} />

      <section className="space-y-4 rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
        <h2 className="text-xl font-bold">Compression settings</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
          <label className="text-sm font-semibold">
            Compress to under
            <input
              type="number"
              min={10}
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
              className="mt-1 w-full rounded-brutal border-2 border-ink bg-surface px-3 py-2"
              placeholder="e.g. 800"
            />
          </label>

          <label className="text-sm font-semibold">
            Unit
            <select
              value={unit}
              onChange={(event) => setUnit(event.target.value as "KB" | "MB")}
              className="mt-1 w-full rounded-brutal border-2 border-ink bg-surface px-3 py-2"
            >
              <option value="KB">KB</option>
              <option value="MB">MB</option>
            </select>
          </label>
        </div>

        {estimate ? (
          <p className="text-sm text-muted">
            Estimated result: ~{formatBytes(estimate.estimatedKB * 1024)} ({estimate.reduction.toFixed(1)}% reduction)
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {[
            ["Email ready", 1000],
            ["Portal ready", 500],
            ["Maximum", 200],
            ["Web optimized", 2000]
          ].map(([label, value]) => (
            <Button
              key={label}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setTargetValue(String(value));
                setUnit("KB");
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        <details className="rounded-brutal border-2 border-ink bg-paper p-3">
          <summary className="cursor-pointer font-semibold">Advanced options</summary>
          <div className="mt-3 space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={stripMetadata} onChange={(event) => setStripMetadata(event.target.checked)} />
              Strip metadata
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={grayscale} onChange={(event) => setGrayscale(event.target.checked)} />
              Convert to grayscale
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preserveSelectableText}
                onChange={(event) => setPreserveSelectableText(event.target.checked)}
              />
              Preserve selectable text
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allowAggressiveCompression}
                onChange={(event) => setAllowAggressiveCompression(event.target.checked)}
              />
              Aggressive compression (may reduce text/image quality)
            </label>
          </div>
        </details>

        <ProgressBar value={progress} animated showLabel />

        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="lg"
            loading={isProcessing}
            disabled={!targetKB}
            onClick={async () => {
              const next = await onCompress(targetKB, stripMetadata, allowAggressiveCompression, grayscale, preserveSelectableText);
              if (next) {
                setResult(next);
              }
            }}
          >
            Compress and Download
          </Button>

          {downloadComplete ? <Badge tone="success">Downloaded OK</Badge> : null}
        </div>
      </section>

      {error ? (
        <section className="rounded-brutal border-2 border-red-700 bg-red-100 p-4">
          <p className="text-sm font-semibold text-red-900">{error}</p>
        </section>
      ) : null}

      {compressionSummary ? (
        <section className="rounded-brutal border-2 border-green-800 bg-green-100 p-4">
          <p className="text-sm font-semibold">
            Original: {compressionSummary.original} to Compressed: {compressionSummary.compressed} ({compressionSummary.reduction.toFixed(1)}% reduction)
          </p>
          {!compressionSummary.hitTarget ? (
            <p className="mt-1 text-sm text-ink">
              Could not reach target of {compressionSummary.target} with current settings.
            </p>
          ) : null}
          {compressionSummary.returnedOriginal ? (
            <p className="mt-1 text-sm text-ink">
              No smaller safe output found.
            </p>
          ) : null}
          <div className="mt-2 flex items-center gap-2">
            <Badge
              tone={
                compressionSummary.usedRasterization && !compressionSummary.vectorTextPreserved
                  ? "warning"
                  : "success"
              }
            >
              {compressionSummary.usedRasterization && !compressionSummary.vectorTextPreserved
                ? "Warning: Text may be affected"
                : "Text remains sharp"}
            </Badge>
            {compressionSummary.usedGrayscale ? <Badge tone="warning">Grayscale applied</Badge> : null}
          </div>
          <p className="mt-2 text-xs text-muted">
            Quality {compressionSummary.quality.toFixed(2)} | Scale {compressionSummary.renderScale.toFixed(2)} | Passes {compressionSummary.iterationsUsed}
          </p>
        </section>
      ) : null}
    </div>
  );
};
