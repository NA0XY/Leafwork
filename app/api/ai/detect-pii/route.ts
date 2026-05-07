import { NextRequest, NextResponse } from "next/server";

import { enforceGroqAccess } from "@/lib/ai/groq-access";
import { nonStreamCompletion } from "@/lib/ai/groq";
import { PII_DETECTION_SYSTEM } from "@/lib/ai/prompts";
import { getSupabaseServiceClient } from "@/lib/auth/supabase-service";
import { detectPiiInputSchema, validateAndParse } from "@/lib/validations/api";
import { jsonError, parseJsonBody } from "@/lib/utils/api";

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

  const access = await enforceGroqAccess(request, requestId, "detect_pii");
  if (!access.ok) {
    return access.response;
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if ("error" in parsedBody) {
    return jsonError(400, {
      code: "INVALID_JSON",
      message: parsedBody.error,
      requestId
    });
  }

  const validated = validateAndParse(detectPiiInputSchema, parsedBody.data);
  if ("error" in validated) {
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  try {
    const primary = await nonStreamCompletion(PII_DETECTION_SYSTEM, validated.data.extractedText, {
      temperature: 0,
      maxTokens: 1200
    });

    let detections: PiiDetection[];
    try {
      detections = parseDetections(primary);
    } catch {
      const retry = await nonStreamCompletion(
        `${PII_DETECTION_SYSTEM}\nRespond with JSON array only. No markdown. No prose.`,
        validated.data.extractedText,
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
          file_size_bytes: validated.data.extractedText.length,
          duration_ms: 0,
          ai_tokens_used: Math.ceil(validated.data.extractedText.length / 4)
        });
      }
    } catch (usageError) {
      console.error("detect_pii_usage_log_failed", usageError);
    }

    return NextResponse.json(
      {
        data: detections,
        pageCount: validated.data.pageCount
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("detect_pii_route_error", { requestId, error });
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
