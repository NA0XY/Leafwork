import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient, getUser } from "@/lib/auth/supabase-server";
import {
  workflowCreateInputSchema,
  workflowDeleteInputSchema,
  workflowUpdateInputSchema,
  validateAndParse
} from "@/lib/validations/api";
import { jsonError, parseJsonBody } from "@/lib/utils/api";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const user = await getUser();
  if (!user) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Authentication required",
      requestId
    });
  }

  const supabase = getSupabaseServerClient();
  const cursor = request.nextUrl.searchParams.get("cursor");
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") ?? PAGE_SIZE), PAGE_SIZE);

  let query = supabase
    .from("workflows")
    .select("id,name,steps,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("updated_at", cursor);
  }

  const { data, error } = await query;
  if (error) {
    return jsonError(500, {
      code: "WORKFLOW_FETCH_FAILED",
      message: error.message,
      requestId
    });
  }

  const rows = Array.isArray(data) ? data : [];
  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? rows[limit - 1]?.updated_at ?? null : null;

  return NextResponse.json(
    {
      data: page,
      pagination: {
        nextCursor,
        pageSize: limit
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const user = await getUser();
  if (!user) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Authentication required",
      requestId
    });
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if ("error" in parsedBody) {
    return jsonError(400, {
      code: "INVALID_JSON",
      message: parsedBody.error,
      requestId
    });
  }

  const validated = validateAndParse(workflowCreateInputSchema, parsedBody.data);
  if ("error" in validated) {
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("workflows")
    .insert({
      user_id: user.id,
      name: validated.data.name,
      steps: validated.data.steps
    })
    .select("id,name,steps,created_at,updated_at")
    .single();

  if (error || !data) {
    return jsonError(500, {
      code: "WORKFLOW_CREATE_FAILED",
      message: error?.message ?? "Unable to create workflow",
      requestId
    });
  }

  return NextResponse.json(
    {
      data
    },
    {
      status: 201,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const user = await getUser();
  if (!user) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Authentication required",
      requestId
    });
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if ("error" in parsedBody) {
    return jsonError(400, {
      code: "INVALID_JSON",
      message: parsedBody.error,
      requestId
    });
  }

  const validated = validateAndParse(workflowUpdateInputSchema, parsedBody.data);
  if ("error" in validated) {
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  const supabase = getSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("workflows")
    .select("id,user_id")
    .eq("id", validated.data.id)
    .single();

  if (existingError || !existing || existing.user_id !== user.id) {
    return jsonError(404, {
      code: "WORKFLOW_NOT_FOUND",
      message: "Workflow not found",
      requestId
    });
  }

  const { data, error } = await supabase
    .from("workflows")
    .update({
      name: validated.data.name,
      steps: validated.data.steps
    })
    .eq("id", validated.data.id)
    .select("id,name,steps,created_at,updated_at")
    .single();

  if (error || !data) {
    return jsonError(500, {
      code: "WORKFLOW_UPDATE_FAILED",
      message: error?.message ?? "Unable to update workflow",
      requestId
    });
  }

  return NextResponse.json(
    {
      data
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const user = await getUser();
  if (!user) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Authentication required",
      requestId
    });
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if ("error" in parsedBody) {
    return jsonError(400, {
      code: "INVALID_JSON",
      message: parsedBody.error,
      requestId
    });
  }

  const validated = validateAndParse(workflowDeleteInputSchema, parsedBody.data);
  if ("error" in validated) {
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  const supabase = getSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("workflows")
    .select("id,user_id")
    .eq("id", validated.data.id)
    .single();

  if (existingError || !existing || existing.user_id !== user.id) {
    return jsonError(404, {
      code: "WORKFLOW_NOT_FOUND",
      message: "Workflow not found",
      requestId
    });
  }

  const { data, error } = await supabase
    .from("workflows")
    .delete()
    .eq("id", validated.data.id)
    .select("id,name,steps,created_at,updated_at")
    .single();

  if (error || !data) {
    return jsonError(500, {
      code: "WORKFLOW_DELETE_FAILED",
      message: error?.message ?? "Unable to delete workflow",
      requestId
    });
  }

  return NextResponse.json(
    {
      data
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
