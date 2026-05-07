import { NextRequest, NextResponse } from "next/server";

export type ApiErrorShape = {
  code: string;
  message: string;
  requestId?: string;
};

export const jsonError = (status: number, error: ApiErrorShape): NextResponse =>
  NextResponse.json(
    {
      error
    },
    {
      status,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

export const parseJsonBody = async <T>(request: NextRequest): Promise<{ data: T } | { error: string }> => {
  try {
    const data = (await request.json()) as T;
    return { data };
  } catch {
    return { error: "Request body must be valid JSON" };
  }
};
