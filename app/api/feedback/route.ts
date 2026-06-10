import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServiceClient } from "@/lib/auth/supabase-service";
import { getUser } from "@/lib/auth/supabase-server";
import { feedbackInputSchema, validateAndParse } from "@/lib/validations/api";
import { getJsonBodyErrorResponse, jsonError, parseJsonBody } from "@/lib/utils/api";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const parsedBody = await parseJsonBody<unknown>(request);

  if ("error" in parsedBody) {
    return getJsonBodyErrorResponse(parsedBody, requestId);
  }

  const validated = validateAndParse(feedbackInputSchema, parsedBody.data);
  if ("error" in validated) {
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  if (validated.data.website) {
    return NextResponse.json({ data: { received: true } }, { status: 202 });
  }

  const user = await getUser().catch(() => null);
  let supabase: ReturnType<typeof getSupabaseServiceClient>;

  try {
    supabase = getSupabaseServiceClient();
  } catch {
    return jsonError(503, {
      code: "FEEDBACK_NOT_CONFIGURED",
      message: "Feedback storage is not configured",
      requestId
    });
  }

  const { error } = await supabase.from("feedback_submissions").insert({
    user_id: user?.id ?? null,
    category: validated.data.category,
    message: validated.data.message,
    email: validated.data.email,
    rating: validated.data.rating ?? null,
    page_path: validated.data.pagePath || request.nextUrl.pathname,
    user_agent: request.headers.get("user-agent"),
    metadata: {
      referer: request.headers.get("referer"),
      source: validated.data.source ?? "feedback_widget"
    }
  });

  if (error) {
    return jsonError(500, {
      code: "FEEDBACK_CREATE_FAILED",
      message: error.message,
      requestId
    });
  }

  return NextResponse.json(
    {
      data: {
        received: true
      }
    },
    {
      status: 201,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
