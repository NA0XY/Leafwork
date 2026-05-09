import { track } from "@vercel/analytics";

import type { ToolSlug } from "@/lib/utils/seo";

type Metrics = Record<string, number | string | boolean>;

const emit = (event: string, payload: Metrics = {}): void => {
  if (typeof window === "undefined") {
    return;
  }

  track(event, payload);
};

export const analytics = {
  toolUsed(tool: ToolSlug | "metadata-strip", data: Metrics = {}) {
    emit("tool_used", { tool, ...data });
  },

  mergeUsed(fileCount: number, pageCount?: number) {
    emit("merge_used", {
      file_count: fileCount,
      ...(typeof pageCount === "number" ? { page_count: pageCount } : {})
    });
  },

  splitUsed(mode: "range" | "every_n" | "extract", outputCount: number) {
    emit("split_used", {
      mode,
      output_count: outputCount
    });
  },

  compressionUsed(targetKB: number, outputKB: number) {
    emit("compression_used", {
      target_kb: Math.max(0, Math.round(targetKB)),
      output_kb: Math.max(0, Math.round(outputKB))
    });
  },

  downloadComplete(tool: ToolSlug | "metadata-strip", outputBytes?: number) {
    emit("download_complete", {
      tool,
      ...(typeof outputBytes === "number" ? { output_bytes: outputBytes } : {})
    });
  },

  aiFeatureUsed(feature: "pdf_to_word" | "summarize" | "detect_pii") {
    emit("ai_feature_used", { feature });
  },

  aiBlocked(reason: "not_authenticated" | "rate_limited" | "server_error") {
    emit("ai_blocked", { reason });
  }
};
