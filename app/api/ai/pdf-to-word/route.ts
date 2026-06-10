import { NextRequest, NextResponse } from "next/server";

import { enforceGroqAccess } from "@/lib/ai/groq-access";
import { nonStreamCompletion, estimateTokens } from "@/lib/ai/groq";
import { AI_INPUT_CHAR_LIMIT, clampTextForAI } from "@/lib/ai/input-limits";
import { PDF_TO_WORD_SYSTEM } from "@/lib/ai/prompts";
import { getSupabaseServiceClient } from "@/lib/auth/supabase-service";
import { pdfToWordInputSchema, sanitizeHtmlTags, validateAndParse } from "@/lib/validations/api";
import { getJsonBodyErrorResponse, jsonError, parseJsonBody } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const PDF_TO_WORD_MAX_OUTPUT_TOKENS = 1200;
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();
  logger.info("api.ai.pdf_to_word.start", {
    requestId,
    path: request.nextUrl.pathname,
    method: request.method
  });

  const access = await enforceGroqAccess(request, requestId, "pdf_to_word");
  if (!access.ok) {
    logger.warn("api.ai.pdf_to_word.blocked", {
      requestId
    });
    return access.response;
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if ("error" in parsedBody) {
    logger.warn("api.ai.pdf_to_word.invalid_json", {
      requestId,
      error: parsedBody.error
    });
    return getJsonBodyErrorResponse(parsedBody, requestId);
  }

  const validated = validateAndParse(pdfToWordInputSchema, parsedBody.data);
  if ("error" in validated) {
    logger.warn("api.ai.pdf_to_word.invalid_payload", {
      requestId,
      error: validated.error
    });
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  const cleanedText = sanitizeHtmlTags(validated.data.extractedText);
  const clamped = clampTextForAI(cleanedText, AI_INPUT_CHAR_LIMIT.pdfToWord);

  try {
    if (clamped.truncated) {
      logger.warn("api.ai.pdf_to_word.input_truncated", {
        requestId,
        originalLength: clamped.originalLength,
        clampedLength: clamped.clampedLength
      });
    }

    logger.debug("api.ai.pdf_to_word.ai_call", {
      requestId,
      userId: access.userId,
      filename: validated.data.filename,
      pageCount: validated.data.pageCount,
      extractedLength: validated.data.extractedText.length,
      cleanedLength: cleanedText.length,
      aiInputLength: clamped.text.length,
      truncated: clamped.truncated
    });

    const tokenCount = estimateTokens(clamped.text);
    const markdown = await nonStreamCompletion(PDF_TO_WORD_SYSTEM, clamped.text, {
      temperature: 0.1,
      maxTokens: PDF_TO_WORD_MAX_OUTPUT_TOKENS
    });

    const durationMs = Date.now() - startedAt;
    try {
      const service = getSupabaseServiceClient();
      if (access.userId) {
        await service.from("usage_logs").insert({
          user_id: access.userId,
          tool_name: "pdf_to_word",
          file_size_bytes: validated.data.extractedText.length,
          duration_ms: durationMs,
          ai_tokens_used: tokenCount
        });
        logger.debug("api.ai.pdf_to_word.usage_log.inserted", {
          requestId,
          userId: access.userId,
          tokenCount,
          durationMs
        });
      }
    } catch (usageError) {
      logger.error("api.ai.pdf_to_word.usage_log.error", {
        requestId,
        userId: access.userId,
        error: usageError
      });
    }

    logger.info("api.ai.pdf_to_word.success", {
      requestId,
      userId: access.userId,
      tokenCount,
      durationMs
    });

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "no-store",
        "x-request-id": requestId,
        "x-ai-input-truncated": clamped.truncated ? "1" : "0"
      }
    });
  } catch (error) {
    const maybeStatus = typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : null;
    if (maybeStatus === 413 || maybeStatus === 429) {
      logger.warn("api.ai.pdf_to_word.groq_limit", {
        requestId,
        userId: access.userId,
        durationMs: Date.now() - startedAt,
        error
      });
      return jsonError(429, {
        code: "AI_RATE_LIMIT",
        message: "AI is temporarily rate-limited. Please retry in a few seconds.",
        requestId
      });
    }

    logger.error("api.ai.pdf_to_word.error", {
      requestId,
      userId: access.userId,
      durationMs: Date.now() - startedAt,
      error
    });
    return jsonError(502, {
      code: "GROQ_FAILURE",
      message: "AI conversion service failed",
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
