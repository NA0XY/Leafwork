import Papa from "papaparse";
import { NextRequest, NextResponse } from "next/server";

import { enforceGroqAccess } from "@/lib/ai/groq-access";
import { AI_INPUT_CHAR_LIMIT, clampTextForAI } from "@/lib/ai/input-limits";
import { nonStreamCompletion } from "@/lib/ai/groq";
import { TABLE_EXTRACTION_SYSTEM } from "@/lib/ai/prompts";
import { extractTableInputSchema, validateAndParse } from "@/lib/validations/api";
import { getJsonBodyErrorResponse, jsonError, parseJsonBody } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

const parseCsv = (csv: string): { valid: boolean; rows: string[][]; columns: number } => {
  const result = Papa.parse<string[]>(csv.trim(), { skipEmptyLines: true });

  if (result.errors.length > 0 || !result.data.length) {
    return { valid: false, rows: [], columns: 0 };
  }

  const rows = result.data;
  const columns = Math.max(...rows.map((row) => row.length));
  return { valid: true, rows, columns };
};

const requestCsv = async (tableText: string, strict = false): Promise<string> => {
  const strictSuffix = strict ? "\nRespond ONLY with CSV, no markdown, no prose, no fences." : "";
  return nonStreamCompletion(TABLE_EXTRACTION_SYSTEM + strictSuffix, tableText, {
    temperature: 0.1,
    maxTokens: 2048
  });
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const startedAt = Date.now();
  logger.info("api.ai.extract_table.start", {
    requestId,
    path: request.nextUrl.pathname,
    method: request.method
  });

  const access = await enforceGroqAccess(request, requestId, "extract_table");
  if (!access.ok) {
    logger.warn("api.ai.extract_table.blocked", {
      requestId
    });
    return access.response;
  }

  const parsedBody = await parseJsonBody<unknown>(request);
  if ("error" in parsedBody) {
    logger.warn("api.ai.extract_table.invalid_json", {
      requestId,
      error: parsedBody.error
    });
    return getJsonBodyErrorResponse(parsedBody, requestId);
  }

  const validated = validateAndParse(extractTableInputSchema, parsedBody.data);
  if ("error" in validated) {
    logger.warn("api.ai.extract_table.invalid_payload", {
      requestId,
      error: validated.error
    });
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  const clamped = clampTextForAI(validated.data.tableText, AI_INPUT_CHAR_LIMIT.extractTable);

  try {
    if (clamped.truncated) {
      logger.warn("api.ai.extract_table.input_truncated", {
        requestId,
        originalLength: clamped.originalLength,
        clampedLength: clamped.clampedLength
      });
    }

    logger.debug("api.ai.extract_table.ai_call.primary", {
      requestId,
      userId: access.userId,
      tableName: validated.data.tableName ?? "Table",
      tableTextLength: validated.data.tableText.length,
      aiInputLength: clamped.text.length,
      truncated: clamped.truncated
    });

    let csv = await requestCsv(clamped.text, false);
    let parsed = parseCsv(csv);

    if (!parsed.valid) {
      logger.warn("api.ai.extract_table.primary_parse_failed.retrying", {
        requestId
      });
      csv = await requestCsv(clamped.text, true);
      parsed = parseCsv(csv);
    }

    if (!parsed.valid) {
      logger.warn("api.ai.extract_table.malformed_csv", {
        requestId
      });
      return jsonError(422, {
        code: "MALFORMED_CSV",
        message: "AI returned malformed table data",
        requestId
      });
    }

    logger.info("api.ai.extract_table.success", {
      requestId,
      userId: access.userId,
      rowCount: parsed.rows.length,
      columnCount: parsed.columns,
      durationMs: Date.now() - startedAt
    });

    return NextResponse.json(
      {
        data: {
          csv,
          rowCount: parsed.rows.length,
          columnCount: parsed.columns,
          tableName: validated.data.tableName ?? "Table",
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
    logger.error("api.ai.extract_table.error", {
      requestId,
      userId: access.userId,
      durationMs: Date.now() - startedAt,
      error
    });
    return jsonError(502, {
      code: "GROQ_FAILURE",
      message: "AI table extraction failed",
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
