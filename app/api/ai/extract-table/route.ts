import Papa from "papaparse";
import { NextRequest, NextResponse } from "next/server";

import { enforceGroqAccess } from "@/lib/ai/groq-access";
import { nonStreamCompletion } from "@/lib/ai/groq";
import { TABLE_EXTRACTION_SYSTEM } from "@/lib/ai/prompts";
import { extractTableInputSchema, validateAndParse } from "@/lib/validations/api";
import { jsonError, parseJsonBody } from "@/lib/utils/api";

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

  const access = await enforceGroqAccess(request, requestId, "extract_table");
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

  const validated = validateAndParse(extractTableInputSchema, parsedBody.data);
  if ("error" in validated) {
    return jsonError(400, {
      code: "INVALID_PAYLOAD",
      message: validated.error,
      requestId
    });
  }

  try {
    let csv = await requestCsv(validated.data.tableText, false);
    let parsed = parseCsv(csv);

    if (!parsed.valid) {
      csv = await requestCsv(validated.data.tableText, true);
      parsed = parseCsv(csv);
    }

    if (!parsed.valid) {
      return jsonError(422, {
        code: "MALFORMED_CSV",
        message: "AI returned malformed table data",
        requestId
      });
    }

    return NextResponse.json(
      {
        data: {
          csv,
          rowCount: parsed.rows.length,
          columnCount: parsed.columns,
          tableName: validated.data.tableName ?? "Table"
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
    console.error("extract_table_route_error", { requestId, error });
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
