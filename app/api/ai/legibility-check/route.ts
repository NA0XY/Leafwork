import { NextRequest, NextResponse } from "next/server";

import { enforceGroqAccess } from "@/lib/ai/groq-access";
import { nonStreamCompletion } from "@/lib/ai/groq";
import { LEGIBILITY_CHECK_SYSTEM } from "@/lib/ai/prompts";
import { legibilityInputSchema, validateAndParse } from "@/lib/validations/api";
import { jsonError, parseJsonBody } from "@/lib/utils/api";

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
  const access = await enforceGroqAccess(request, requestId, "legibility_check");
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

  const validated = validateAndParse(legibilityInputSchema, parsedBody.data);
  if ("error" in validated) {
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  if (validated.data.compressionRatio > 0.7) {
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
      parsed = fallbackResponse();
    }

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
    console.error("legibility_check_route_error", { requestId, error });
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
