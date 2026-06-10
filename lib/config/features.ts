import type { ToolSlug } from "@/lib/utils/seo";

type FeatureStatus = "available" | "coming-soon" | "disabled";

export type ToolFeatureState = {
  enabled: boolean;
  status: FeatureStatus;
  label: "Available" | "Coming soon" | "Disabled";
};

export const TOOL_FEATURE_ENV_KEYS: Record<ToolSlug, string> = {
  sandbox: "NEXT_PUBLIC_FEATURE_SANDBOX",
  merge: "NEXT_PUBLIC_FEATURE_MERGE",
  split: "NEXT_PUBLIC_FEATURE_SPLIT",
  compress: "NEXT_PUBLIC_FEATURE_COMPRESS",
  "pdf-to-word": "NEXT_PUBLIC_FEATURE_PDF_TO_WORD",
  "pdf-to-images": "NEXT_PUBLIC_FEATURE_PDF_TO_IMAGES",
  "images-to-pdf": "NEXT_PUBLIC_FEATURE_IMAGES_TO_PDF",
  watermark: "NEXT_PUBLIC_FEATURE_WATERMARK",
  sign: "NEXT_PUBLIC_FEATURE_SIGN",
  redact: "NEXT_PUBLIC_FEATURE_REDACT",
  rotate: "NEXT_PUBLIC_FEATURE_ROTATE",
  "metadata-strip": "NEXT_PUBLIC_FEATURE_METADATA_STRIP",
  summarize: "NEXT_PUBLIC_FEATURE_SUMMARIZE"
};

const FEATURE_FLAGS: Record<ToolSlug, string | undefined> = {
  sandbox: process.env.NEXT_PUBLIC_FEATURE_SANDBOX,
  merge: process.env.NEXT_PUBLIC_FEATURE_MERGE,
  split: process.env.NEXT_PUBLIC_FEATURE_SPLIT,
  compress: process.env.NEXT_PUBLIC_FEATURE_COMPRESS,
  "pdf-to-word": process.env.NEXT_PUBLIC_FEATURE_PDF_TO_WORD,
  "pdf-to-images": process.env.NEXT_PUBLIC_FEATURE_PDF_TO_IMAGES,
  "images-to-pdf": process.env.NEXT_PUBLIC_FEATURE_IMAGES_TO_PDF,
  watermark: process.env.NEXT_PUBLIC_FEATURE_WATERMARK,
  sign: process.env.NEXT_PUBLIC_FEATURE_SIGN,
  redact: process.env.NEXT_PUBLIC_FEATURE_REDACT,
  rotate: process.env.NEXT_PUBLIC_FEATURE_ROTATE,
  "metadata-strip": process.env.NEXT_PUBLIC_FEATURE_METADATA_STRIP,
  summarize: process.env.NEXT_PUBLIC_FEATURE_SUMMARIZE
};

const normalizeFeatureValue = (value: string | undefined): string => value?.trim().toLowerCase() ?? "";

export const getToolFeatureState = (slug: ToolSlug): ToolFeatureState => {
  const value = normalizeFeatureValue(FEATURE_FLAGS[slug]);

  if (value === "disabled") {
    return {
      enabled: false,
      status: "disabled",
      label: "Disabled"
    };
  }

  if (value === "false" || value === "0" || value === "off" || value === "coming-soon") {
    return {
      enabled: false,
      status: "coming-soon",
      label: "Coming soon"
    };
  }

  return {
    enabled: true,
    status: "available",
    label: "Available"
  };
};

export const isToolFeatureEnabled = (slug: ToolSlug): boolean => getToolFeatureState(slug).enabled;

export const getToolFeatureStates = (): Record<ToolSlug, ToolFeatureState> => ({
  sandbox: getToolFeatureState("sandbox"),
  merge: getToolFeatureState("merge"),
  split: getToolFeatureState("split"),
  compress: getToolFeatureState("compress"),
  "pdf-to-word": getToolFeatureState("pdf-to-word"),
  "pdf-to-images": getToolFeatureState("pdf-to-images"),
  "images-to-pdf": getToolFeatureState("images-to-pdf"),
  watermark: getToolFeatureState("watermark"),
  sign: getToolFeatureState("sign"),
  redact: getToolFeatureState("redact"),
  rotate: getToolFeatureState("rotate"),
  "metadata-strip": getToolFeatureState("metadata-strip"),
  summarize: getToolFeatureState("summarize")
});
