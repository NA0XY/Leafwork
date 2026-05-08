import { NextRequest, NextResponse } from "next/server";

import { enforceGroqAccess } from "@/lib/ai/groq-access";
import { nonStreamCompletion } from "@/lib/ai/groq";
import { AI_INPUT_CHAR_LIMIT, clampTextForAI } from "@/lib/ai/input-limits";
import { SUMMARIZE_SYSTEM } from "@/lib/ai/prompts";
import { summarizeInputSchema, validateAndParse } from "@/lib/validations/api";
import { jsonError, parseJsonBody } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();
  logger.info("api.ai.summarize.start", {
    requestId,
    path: request.nextUrl.pathname,
    method: request.method
  });

  const access = await enforceGroqAccess(request, requestId, "summarize");
  if (!access.ok) {
    logger.warn("api.ai.summarize.blocked", {
      requestId
    });
    return access.response;
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if ("error" in parsedBody) {
    logger.warn("api.ai.summarize.invalid_json", {
      requestId,
      error: parsedBody.error
    });
    return jsonError(400, {
      code: "INVALID_JSON",
      message: parsedBody.error,
      requestId
    });
  }

  const validated = validateAndParse(summarizeInputSchema, parsedBody.data);
  if ("error" in validated) {
    logger.warn("api.ai.summarize.invalid_payload", {
      requestId,
      error: validated.error
    });
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  const clamped = clampTextForAI(validated.data.extractedText, AI_INPUT_CHAR_LIMIT.summarize);

  try {
    if (clamped.truncated) {
      logger.warn("api.ai.summarize.input_truncated", {
        requestId,
        originalLength: clamped.originalLength,
        clampedLength: clamped.clampedLength
      });
    }

    logger.debug("api.ai.summarize.ai_call", {
      requestId,
      userId: access.userId,
      filename: validated.data.filename,
      inputLength: validated.data.extractedText.length,
      aiInputLength: clamped.text.length,
      truncated: clamped.truncated
    });

    const summary = await nonStreamCompletion(SUMMARIZE_SYSTEM, clamped.text, {
      temperature: 0.3,
      maxTokens: 1200
    });

    logger.info("api.ai.summarize.success", {
      requestId,
      userId: access.userId,
      outputLength: summary.length,
      durationMs: Date.now() - startedAt
    });

    return NextResponse.json(
      {
        data: {
          summary,
          filename: validated.data.filename,
          truncated: clamped.truncated
        }
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    logger.error("api.ai.summarize.error", {
      requestId,
      userId: access.userId,
      durationMs: Date.now() - startedAt,
      error
    });
    return jsonError(502, {
      code: "GROQ_FAILURE",
      message: "AI summarization failed",
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
