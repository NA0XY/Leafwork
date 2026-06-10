import { NextRequest, NextResponse } from "next/server";

export const DEFAULT_JSON_BODY_MAX_BYTES = 1024 * 1024;

export type ApiErrorShape = {
  code: string;
  message: string;
  requestId?: string;
};

export type JsonBodyParseErrorCode = "INVALID_JSON" | "PAYLOAD_TOO_LARGE";

export type JsonBodyParseError = {
  code: JsonBodyParseErrorCode;
  error: string;
  status: 400 | 413;
};

export type JsonBodyParseResult<T> = { data: T } | JsonBodyParseError;

export type ParseJsonBodyOptions = {
  maxBytes?: number;
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

export const parseContentLength = (value: string | null): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const bodyTooLargeError = (maxBytes: number): JsonBodyParseError => ({
  code: "PAYLOAD_TOO_LARGE",
  error: `Request body must be ${maxBytes} bytes or smaller`,
  status: 413
});

const invalidJsonError = (message = "Request body must be valid JSON"): JsonBodyParseError => ({
  code: "INVALID_JSON",
  error: message,
  status: 400
});

const readTextBodyWithLimit = async (
  request: NextRequest,
  maxBytes: number
): Promise<{ text: string } | JsonBodyParseError> => {
  const contentLength = parseContentLength(request.headers.get("content-length"));
  if (contentLength !== null && contentLength > maxBytes) {
    return bodyTooLargeError(maxBytes);
  }

  if (!request.body) {
    return invalidJsonError("Request body is required");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      receivedBytes += value.byteLength;
      if (receivedBytes > maxBytes) {
        return bodyTooLargeError(maxBytes);
      }

      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }

  text += decoder.decode();
  return { text };
};

export const parseJsonBody = async <T>(
  request: NextRequest,
  options: ParseJsonBodyOptions = {}
): Promise<JsonBodyParseResult<T>> => {
  const maxBytes = options.maxBytes ?? DEFAULT_JSON_BODY_MAX_BYTES;
  if (!Number.isInteger(maxBytes) || maxBytes <= 0) {
    throw new Error("parseJsonBody maxBytes must be a positive integer");
  }

  const body = await readTextBodyWithLimit(request, maxBytes);
  if ("error" in body) {
    return body;
  }

  try {
    const data = JSON.parse(body.text) as T;
    return { data };
  } catch {
    return invalidJsonError();
  }
};

export const getJsonBodyErrorResponse = (parsedBody: JsonBodyParseError, requestId: string): NextResponse =>
  jsonError(parsedBody.status, {
    code: parsedBody.code,
    message: parsedBody.error,
    requestId
  });

const TRUST_PROXY_HEADERS = ["cf-connecting-ip", "x-real-ip"] as const;
const TRUST_PROXY_ENV_VALUES = new Set(["1", "true", "yes"]);

const isTrustedProxyHeaderEnabled = (): boolean => {
  const explicit = process.env.TRUST_PROXY_HEADERS?.trim().toLowerCase();
  if (explicit) {
    return TRUST_PROXY_ENV_VALUES.has(explicit);
  }

  return process.env.VERCEL === "1" || process.env.CF_PAGES === "1";
};

export const isLikelyIpAddress = (value: string | null | undefined): boolean => {
  if (!value) {
    return false;
  }

  const ip = value.trim();
  const ipv4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
  const ipv6 = /^[0-9a-f:]+$/i;
  return ipv4.test(ip) || (ip.includes(":") && ipv6.test(ip));
};

const firstForwardedIp = (value: string | null): string | null => {
  const first = value?.split(",")[0]?.trim() ?? null;
  return isLikelyIpAddress(first) ? first : null;
};

export const resolveClientIp = (request: NextRequest): string => {
  if (!isTrustedProxyHeaderEnabled()) {
    return "0.0.0.0";
  }

  for (const header of TRUST_PROXY_HEADERS) {
    const headerIp = request.headers.get(header)?.trim() ?? null;
    if (isLikelyIpAddress(headerIp)) {
      return headerIp ?? "0.0.0.0";
    }
  }

  return firstForwardedIp(request.headers.get("x-forwarded-for")) ?? "0.0.0.0";
};
