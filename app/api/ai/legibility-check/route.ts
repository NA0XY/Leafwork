import { NextRequest, NextResponse } from "next/server";

import { enforceGroqAccess } from "@/lib/ai/groq-access";
import { nonStreamCompletion } from "@/lib/ai/groq";
import { LEGIBILITY_CHECK_SYSTEM } from "@/lib/ai/prompts";
import { legibilityInputSchema, validateAndParse } from "@/lib/validations/api";
import { jsonError, parseJsonBody } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

type LegibilityResponse = {
  readable: boolean;
  confidence: "high" | "medium" | "low";
  issues: string[];
};

const fallbackResponse = (): LegibilityResponse => ({
  readable: true,
  confidence: "medium",
  issues: ["AI response could not be parsed as JSON"]
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();
  logger.info("api.ai.legibility_check.start", {
    requestId,
    path: request.nextUrl.pathname,
    method: request.method
  });

  const access = await enforceGroqAccess(request, requestId, "legibility_check");
  if (!access.ok) {
    logger.warn("api.ai.legibility_check.blocked", {
      requestId
    });
    return access.response;
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if ("error" in parsedBody) {
    logger.warn("api.ai.legibility_check.invalid_json", {
      requestId,
      error: parsedBody.error
    });
    return jsonError(400, {
      code: "INVALID_JSON",
      message: parsedBody.error,
      requestId
    });
  }

  const validated = validateAndParse(legibilityInputSchema, parsedBody.data);
  if ("error" in validated) {
    logger.warn("api.ai.legibility_check.invalid_payload", {
      requestId,
      error: validated.error
    });
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  if (validated.data.compressionRatio > 0.7) {
    logger.info("api.ai.legibility_check.short_circuit", {
      requestId,
      userId: access.userId,
      compressionRatio: validated.data.compressionRatio,
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json(
      {
        data: {
          readable: true,
          confidence: "high",
          issues: []
        }
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {
    logger.debug("api.ai.legibility_check.ai_call", {
      requestId,
      userId: access.userId,
      sampleTextLength: validated.data.sampleText.length,
      compressionRatio: validated.data.compressionRatio
    });

    const raw = await nonStreamCompletion(LEGIBILITY_CHECK_SYSTEM, JSON.stringify(validated.data), {
      temperature: 0.1,
      maxTokens: 400
    });

    let parsed: LegibilityResponse;
    try {
      const payload = JSON.parse(raw) as LegibilityResponse;
      parsed = {
        readable: Boolean(payload.readable),
        confidence: payload.confidence ?? "medium",
        issues: Array.isArray(payload.issues) ? payload.issues : []
      };
    } catch {
      logger.warn("api.ai.legibility_check.parse_failed.fallback", {
        requestId
      });
      parsed = fallbackResponse();
    }

    logger.info("api.ai.legibility_check.success", {
      requestId,
      userId: access.userId,
      readable: parsed.readable,
      confidence: parsed.confidence,
      issueCount: parsed.issues.length,
      durationMs: Date.now() - startedAt
    });

    return NextResponse.json(
      {
        data: parsed
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    logger.error("api.ai.legibility_check.error", {
      requestId,
      userId: access.userId,
      durationMs: Date.now() - startedAt,
      error
    });
    return jsonError(502, {
      code: "GROQ_FAILURE",
      message: "Legibility check failed",
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
