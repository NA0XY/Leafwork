import { NextRequest, NextResponse } from "next/server";

import { enforceGroqAccess } from "@/lib/ai/groq-access";
import { nonStreamCompletion } from "@/lib/ai/groq";
import { AI_INPUT_CHAR_LIMIT, clampTextForAI } from "@/lib/ai/input-limits";
import { PII_DETECTION_SYSTEM } from "@/lib/ai/prompts";
import { getSupabaseServiceClient } from "@/lib/auth/supabase-service";
import { detectPiiInputSchema, validateAndParse } from "@/lib/validations/api";
import { jsonError, parseJsonBody } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

type PiiDetection = {
  type: string;
  value: string;
  context: string;
  suggestedBbox: null;
};

const parseDetections = (input: string): PiiDetection[] => {
  const parsed = JSON.parse(input) as Array<{ type?: string; value?: string; context?: string }>;
  if (!Array.isArray(parsed)) {
    throw new Error("PII response is not an array");
  }

  return parsed
    .filter((item) => item && typeof item.type === "string" && typeof item.value === "string")
    .map((item) => ({
      type: item.type ?? "unknown",
      value: item.value ?? "",
      context: item.context ?? "",
      suggestedBbox: null
    }));
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();
  logger.info("api.ai.detect_pii.start", {
    requestId,
    path: request.nextUrl.pathname,
    method: request.method
  });

  const access = await enforceGroqAccess(request, requestId, "detect_pii");
  if (!access.ok) {
    logger.warn("api.ai.detect_pii.blocked", {
      requestId
    });
    return access.response;
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if ("error" in parsedBody) {
    logger.warn("api.ai.detect_pii.invalid_json", {
      requestId,
      error: parsedBody.error
    });
    return jsonError(400, {
      code: "INVALID_JSON",
      message: parsedBody.error,
      requestId
    });
  }

  const validated = validateAndParse(detectPiiInputSchema, parsedBody.data);
  if ("error" in validated) {
    logger.warn("api.ai.detect_pii.invalid_payload", {
      requestId,
      error: validated.error
    });
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  const clamped = clampTextForAI(validated.data.extractedText, AI_INPUT_CHAR_LIMIT.detectPii);

  try {
    if (clamped.truncated) {
      logger.warn("api.ai.detect_pii.input_truncated", {
        requestId,
        originalLength: clamped.originalLength,
        clampedLength: clamped.clampedLength
      });
    }

    logger.debug("api.ai.detect_pii.ai_call.primary", {
      requestId,
      userId: access.userId,
      filename: validated.data.filename,
      pageCount: validated.data.pageCount,
      inputLength: validated.data.extractedText.length,
      aiInputLength: clamped.text.length,
      truncated: clamped.truncated
    });

    const primary = await nonStreamCompletion(PII_DETECTION_SYSTEM, clamped.text, {
      temperature: 0,
      maxTokens: 1200
    });

    let detections: PiiDetection[];
    try {
      detections = parseDetections(primary);
    } catch {
      logger.warn("api.ai.detect_pii.primary_parse_failed.retrying", {
        requestId
      });
      const retry = await nonStreamCompletion(
        `${PII_DETECTION_SYSTEM}\nRespond with JSON array only. No markdown. No prose.`,
        clamped.text,
        {
          temperature: 0,
          maxTokens: 1200
        }
      );

      detections = parseDetections(retry);
    }

    try {
      const service = getSupabaseServiceClient();
      if (access.userId) {
        await service.from("usage_logs").insert({
          user_id: access.userId,
          tool_name: "detect_pii",
          file_size_bytes: clamped.text.length,
          duration_ms: 0,
          ai_tokens_used: Math.ceil(clamped.text.length / 4)
        });
        logger.debug("api.ai.detect_pii.usage_log.inserted", {
          requestId,
          userId: access.userId,
          detectionCount: detections.length
        });
      }
    } catch (usageError) {
      logger.error("api.ai.detect_pii.usage_log.error", {
        requestId,
        userId: access.userId,
        error: usageError
      });
    }

    logger.info("api.ai.detect_pii.success", {
      requestId,
      userId: access.userId,
      detectionCount: detections.length,
      durationMs: Date.now() - startedAt
    });

    return NextResponse.json(
      {
        data: detections,
        pageCount: validated.data.pageCount,
        truncated: clamped.truncated
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    logger.error("api.ai.detect_pii.error", {
      requestId,
      userId: access.userId,
      durationMs: Date.now() - startedAt,
      error
    });
    return jsonError(502, {
      code: "GROQ_FAILURE",
      message: "AI PII detection failed",
      requestId
    });
  }
}

export function GET(): NextResponse {
  return jsonError(405, {
    code: "METHOD_NOT_ALLOWED",
    message: "POST only"
  });
}
