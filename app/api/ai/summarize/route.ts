import { NextRequest, NextResponse } from "next/server";

import { enforceGroqAccess } from "@/lib/ai/groq-access";
import { nonStreamCompletion } from "@/lib/ai/groq";
import { SUMMARIZE_SYSTEM } from "@/lib/ai/prompts";
import { summarizeInputSchema, validateAndParse } from "@/lib/validations/api";
import { jsonError, parseJsonBody } from "@/lib/utils/api";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  const access = await enforceGroqAccess(request, requestId, "summarize");
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

  const validated = validateAndParse(summarizeInputSchema, parsedBody.data);
  if ("error" in validated) {
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  try {
    const summary = await nonStreamCompletion(SUMMARIZE_SYSTEM, validated.data.extractedText, {
      temperature: 0.3,
      maxTokens: 1200
    });

    return NextResponse.json(
      {
        data: {
          summary,
          filename: validated.data.filename
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
    console.error("summarize_route_error", { requestId, error });
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
