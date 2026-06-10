"use client";

import { withPdfLib } from "@/lib/pdf/engine";
import { compressEmbeddedImages } from "@/lib/pdf/compression/embedded-images";
import { composeHybridPdf, getScaleCandidates, preparePagePlans } from "@/lib/pdf/compression/raster-fallback";
import {
  MAX_ITERATIONS,
  MAX_QUALITY,
  MIN_QUALITY_IMAGE_DOC,
  MIN_QUALITY_RASTER_AGGRESSIVE,
  MIN_REDUCTION_BEFORE_FALLBACK,
  PRESERVE_SELECTABLE_TEXT,
  type CompressOutput,
  type ProgressCallback
} from "@/lib/pdf/compression/types";
import { validatePdfBytes, validateRenderedPdfBytes } from "@/lib/pdf/compression/validation";
import { PDFEngineError, PDFEngineErrorCode, type CompressionTarget, type ProcessingResult } from "@/lib/pdf/types";
import { logger } from "@/lib/utils/logger";

const toResult = <T>(data: T | null, error: PDFEngineError | null, startedAt: number): ProcessingResult<T> => ({
  data,
  error,
  durationMs: Math.max(0, Math.round(performance.now() - startedAt))
});

const getTargetBytes = (target: CompressionTarget, originalBytes: number): number => {
  if (target.maxBytes && target.maxBytes > 0) {
    return target.maxBytes;
  }

  if (target.targetKB && target.targetKB > 0) {
    return target.targetKB * 1024;
  }

  if (target.quality && target.quality > 0) {
    return Math.floor(originalBytes * Math.max(MIN_QUALITY_IMAGE_DOC, Math.min(MAX_QUALITY, target.quality)));
  }

  return Math.floor(originalBytes * 0.7);
};

const optimizeWithPdfLib = async (bytes: Uint8Array, stripMetadata: boolean): Promise<Uint8Array> => {
  const result = await withPdfLib(async (pdfLib) => {
    const doc = await pdfLib.PDFDocument.load(bytes, { ignoreEncryption: true });

    if (stripMetadata) {
      doc.setTitle("");
      doc.setAuthor("");
      doc.setSubject("");
      doc.setKeywords([]);
      const metadataRef = doc.catalog.get(pdfLib.PDFName.of("Metadata"));
      if (metadataRef) {
        doc.catalog.delete(pdfLib.PDFName.of("Metadata"));
      }
      doc.setProducer("");
      doc.setCreator("");
    }

    return doc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      updateFieldAppearances: false,
      objectsPerTick: 30
    });
  });

  if (!result.data) {
    throw result.error ?? new Error("Unable to optimize PDF bytes");
  }

  return result.data;
};

export const compressPDF = async (
  file: File,
  target: CompressionTarget,
  onProgress?: ProgressCallback
): Promise<ProcessingResult<CompressOutput>> => {
  const startedAt = performance.now();
  logger.info("pdf.compress.start", {
    fileName: file.name,
    fileSizeBytes: file.size,
    target
  });

  try {
    const originalBytes = new Uint8Array(await file.arrayBuffer());
    const goalBytes = getTargetBytes(target, originalBytes.byteLength);
    const shouldStripMetadata = target.stripMetadata ?? true;
    const allowRasterization = target.allowRasterization ?? false;
    const keepTextSharp = target.keepTextSharp ?? true;
    const grayscale = target.grayscale ?? false;

    logger.debug("pdf.compress.input.ready", {
      fileName: file.name,
      originalBytes: originalBytes.byteLength,
      goalBytes,
      stripMetadata: shouldStripMetadata,
      allowRasterization,
      keepTextSharp,
      grayscale
    });

    onProgress?.(10);
    const stageOneBytes = await optimizeWithPdfLib(originalBytes, shouldStripMetadata);
    const stageOneStableBytes = stageOneBytes.slice();
    logger.debug("pdf.compress.stage_one.complete", {
      fileName: file.name,
      stageOneBytes: stageOneBytes.byteLength
    });
    onProgress?.(25);

    let bestBytes = stageOneStableBytes.byteLength < originalBytes.byteLength ? stageOneStableBytes : originalBytes;
    let bestQuality = 1;
    let bestScale = 1;
    let usedRasterization = false;
    let vectorTextPreserved = true;
    let appliedGrayscale = false;
    let executedIterations = 0;

    const embeddedImageResult =
      bestBytes.byteLength > goalBytes
        ? await compressEmbeddedImages(
            stageOneStableBytes,
            goalBytes,
            {
              stripMetadata: shouldStripMetadata,
              allowAggressiveCompression: allowRasterization,
              grayscale
            },
            onProgress
          )
        : null;

    if (embeddedImageResult && embeddedImageResult.bytes.byteLength < bestBytes.byteLength) {
      bestBytes = embeddedImageResult.bytes;
      bestQuality = embeddedImageResult.quality;
      appliedGrayscale = grayscale;
      logger.info("pdf.compress.embedded_images.selected", {
        fileName: file.name,
        compressedBytes: embeddedImageResult.bytes.byteLength,
        optimizedImageCount: embeddedImageResult.optimizedImageCount,
        attemptedImageCount: embeddedImageResult.attemptedImageCount,
        goalBytes
      });
    } else {
      logger.info("pdf.compress.embedded_images.skipped", {
        fileName: file.name,
        reason: bestBytes.byteLength <= goalBytes ? "already_under_target" : embeddedImageResult ? "candidate_not_smaller" : "no_optimizable_images"
      });
    }

    const shouldTryRasterFallback =
      allowRasterization &&
      goalBytes < bestBytes.byteLength &&
      (bestBytes.byteLength - goalBytes) / Math.max(1, bestBytes.byteLength) >= MIN_REDUCTION_BEFORE_FALLBACK;
    const lastValidBytesBeforeRaster = bestBytes;
    const lastValidQualityBeforeRaster = bestQuality;
    const lastValidScaleBeforeRaster = bestScale;
    const lastValidGrayscaleBeforeRaster = appliedGrayscale;

    if (PRESERVE_SELECTABLE_TEXT && !shouldTryRasterFallback) {
      logger.info("pdf.compress.text_preserving_mode", {
        fileName: file.name,
        originalBytes: originalBytes.byteLength,
        optimizedBytes: stageOneStableBytes.byteLength,
        goalBytes,
        note: "Raster flattening disabled to preserve selectable text."
      });
    } else {
      const targetRatio = goalBytes / Math.max(1, stageOneStableBytes.byteLength);
      const scaleCandidates = getScaleCandidates(targetRatio);
      let bestUnderAnyScale: { bytes: Uint8Array; quality: number; scale: number } | null = null;
      let smallestOverAnyScale: { bytes: Uint8Array; quality: number; scale: number } | null = null;
      const totalSteps = scaleCandidates.length * MAX_ITERATIONS;
      let currentStep = 0;

      for (const scale of scaleCandidates) {
        const pagePlans = await preparePagePlans(stageOneStableBytes, scale, { keepTextSharp });
        const rasterPageCount = pagePlans.filter((page) => page.shouldRasterize).length;
        const textRasterized = pagePlans.some((page) => page.hasSelectableText && page.shouldRasterize);
        vectorTextPreserved = vectorTextPreserved && !textRasterized;
        if (rasterPageCount === 0) {
          logger.info("pdf.compress.hybrid.no_raster_candidates", {
            fileName: file.name,
            scale,
            note: "No image-heavy pages found; keeping vector PDF to preserve text clarity."
          });
          break;
        }

        usedRasterization = true;
        const minQuality = keepTextSharp ? MIN_QUALITY_IMAGE_DOC : MIN_QUALITY_RASTER_AGGRESSIVE;
        let low = minQuality;
        let high = MAX_QUALITY;
        let bestUnderThisScale: { bytes: Uint8Array; quality: number } | null = null;
        let smallestOverThisScale: { bytes: Uint8Array; quality: number } | null = null;

        for (let iteration = 1; iteration <= MAX_ITERATIONS; iteration += 1) {
          const quality = Number(((low + high) / 2).toFixed(4));
          const flattened = await composeHybridPdf(stageOneStableBytes, pagePlans, quality, { keepTextSharp, grayscale });
          executedIterations += 1;
          currentStep += 1;

          if (flattened.byteLength <= goalBytes) {
            if (!bestUnderThisScale || flattened.byteLength > bestUnderThisScale.bytes.byteLength) {
              bestUnderThisScale = { bytes: flattened, quality };
            }
            low = quality;
          } else {
            if (!smallestOverThisScale || flattened.byteLength < smallestOverThisScale.bytes.byteLength) {
              smallestOverThisScale = { bytes: flattened, quality };
            }
            high = quality;
          }

          onProgress?.(25 + Math.round((currentStep / totalSteps) * 70));
        }

        if (bestUnderThisScale) {
          bestUnderAnyScale = {
            bytes: bestUnderThisScale.bytes,
            quality: bestUnderThisScale.quality,
            scale
          };
          break;
        }

        if (smallestOverThisScale) {
          if (!smallestOverAnyScale || smallestOverThisScale.bytes.byteLength < smallestOverAnyScale.bytes.byteLength) {
            smallestOverAnyScale = {
              bytes: smallestOverThisScale.bytes,
              quality: smallestOverThisScale.quality,
              scale
            };
          }
        }
      }

      if (bestUnderAnyScale && bestUnderAnyScale.bytes.byteLength < bestBytes.byteLength) {
        bestBytes = bestUnderAnyScale.bytes;
        bestQuality = bestUnderAnyScale.quality;
        bestScale = bestUnderAnyScale.scale;
        appliedGrayscale = grayscale;
      } else if (smallestOverAnyScale && smallestOverAnyScale.bytes.byteLength < bestBytes.byteLength) {
        bestBytes = smallestOverAnyScale.bytes;
        bestQuality = smallestOverAnyScale.quality;
        bestScale = smallestOverAnyScale.scale;
        appliedGrayscale = grayscale;
      }
    }

    const hasValidStructure = await validatePdfBytes(originalBytes, bestBytes);
    const hasValidRender = hasValidStructure
      ? await validateRenderedPdfBytes(originalBytes, bestBytes, { expectTextPreserved: vectorTextPreserved })
      : false;

    if (!hasValidStructure || !hasValidRender) {
      logger.warn("pdf.compress.candidate.validation_failed", {
        fileName: file.name,
        candidateBytes: bestBytes.byteLength,
        fallbackBytes: stageOneStableBytes.byteLength,
        hasValidStructure,
        hasValidRender
      });
      bestBytes = stageOneStableBytes;
      if (lastValidBytesBeforeRaster.byteLength < stageOneStableBytes.byteLength) {
        bestBytes = lastValidBytesBeforeRaster;
        bestQuality = lastValidQualityBeforeRaster;
        bestScale = lastValidScaleBeforeRaster;
        appliedGrayscale = lastValidGrayscaleBeforeRaster;
      } else {
        bestQuality = 1;
        bestScale = 1;
        appliedGrayscale = false;
      }
      usedRasterization = false;
      vectorTextPreserved = true;
    }

    if (bestBytes.byteLength > originalBytes.byteLength) {
      logger.warn("pdf.compress.candidate.larger_than_original", {
        fileName: file.name,
        candidateBytes: bestBytes.byteLength,
        originalBytes: originalBytes.byteLength
      });
      bestBytes = originalBytes;
      bestQuality = 1;
      bestScale = 1;
      usedRasterization = false;
      vectorTextPreserved = true;
      appliedGrayscale = false;
    }

    const hitTarget = bestBytes.byteLength <= goalBytes;

    onProgress?.(100);
    logger.info("pdf.compress.success", {
      fileName: file.name,
      originalBytes: originalBytes.byteLength,
      compressedBytes: bestBytes.byteLength,
      goalBytes,
      hitTarget,
      bestQuality,
      bestScale,
      flatteningAvailable: allowRasterization,
      keepTextSharp,
      grayscale,
      appliedGrayscale,
      usedRasterization,
      vectorTextPreserved,
      iterationsUsed: executedIterations
    });

    return toResult<CompressOutput>(
      {
        blob: new Blob([bestBytes], { type: "application/pdf" }),
        originalBytes: originalBytes.byteLength,
        compressedBytes: bestBytes.byteLength,
        quality: Number(bestQuality.toFixed(2)),
        iterationsUsed: executedIterations,
        usedRasterization,
        targetBytes: goalBytes,
        hitTarget,
        renderScale: Number(bestScale.toFixed(2)),
        vectorTextPreserved,
        usedGrayscale: appliedGrayscale
      },
      null,
      startedAt
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("pdf.compress.failed", {
      fileName: file.name,
      target,
      error
    });
    return toResult<CompressOutput>(
      null,
      new PDFEngineError(PDFEngineErrorCode.PROCESSING_FAILED, `Compression failed: ${message}`, error),
      startedAt
    );
  }
};

export const compressToTargetKB = async (
  file: File,
  targetKB: number,
  onProgress?: ProgressCallback
): Promise<ProcessingResult<CompressOutput>> => compressPDF(file, { targetKB }, onProgress);

export const estimateCompressibility = (file: File): "high" | "medium" | "low" => {
  const name = file.name.toLowerCase();
  if (name.includes("scan") || name.includes("image")) {
    return "high";
  }

  if (file.size > 15 * 1024 * 1024) {
    return "medium";
  }

  return "low";
};