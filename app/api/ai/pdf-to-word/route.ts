import { NextRequest, NextResponse } from "next/server";

import { enforceGroqAccess } from "@/lib/ai/groq-access";
import { streamCompletion, estimateTokens } from "@/lib/ai/groq";
import { PDF_TO_WORD_SYSTEM } from "@/lib/ai/prompts";
import { getSupabaseServiceClient } from "@/lib/auth/supabase-service";
import { pdfToWordInputSchema, sanitizeHtmlTags, validateAndParse } from "@/lib/validations/api";
import { jsonError, parseJsonBody } from "@/lib/utils/api";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();

  const access = await enforceGroqAccess(request, requestId, "pdf_to_word");
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

  const validated = validateAndParse(pdfToWordInputSchema, parsedBody.data);
  if ("error" in validated) {
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  const cleanedText = sanitizeHtmlTags(validated.data.extractedText);

  try {
    const encoder = new TextEncoder();
    const tokenCount = estimateTokens(cleanedText);

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of streamCompletion(PDF_TO_WORD_SYSTEM, cleanedText, {
            temperature: 0.1,
            maxTokens: 4096
          })) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
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
      }
    } catch (usageError) {
      console.error("usage_log_insert_failed", usageError);
    }

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": "no-store",
        "x-request-id": requestId
      }
    });
  } catch (error) {
    console.error("pdf_to_word_route_error", { requestId, error });
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
