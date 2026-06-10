import { z, type ZodTypeDef } from "zod";

import { isSafeFilename } from "@/lib/validations/file";

const sanitizeText = (value: string): string =>
  value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const REQUEST_TEXT_MAX_CHARS = 1_000_000;
const WORKFLOW_OPTIONS_LIMITS = {
  maxDepth: 4,
  maxKeysPerObject: 25,
  maxKeyLength: 64,
  maxArrayItems: 50,
  maxStringChars: 500,
  maxTotalNodes: 200
} as const;

export type WorkflowOptionValue =
  | string
  | number
  | boolean
  | null
  | WorkflowOptionValue[]
  | { [key: string]: WorkflowOptionValue };

export type WorkflowOptions = Record<string, WorkflowOptionValue>;

const trimmedText = z.string().trim().max(REQUEST_TEXT_MAX_CHARS);

const fileNameSchema = z
  .string()
  .max(255)
  .refine((value) => isSafeFilename(value), "Invalid PDF filename");

const optionalEmailSchema = z
  .union([z.string().trim().email().max(255), z.literal("")])
  .optional()
  .transform((value) => (value ? value : null));

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const isForbiddenObjectKey = (key: string): boolean =>
  key === "__proto__" || key === "prototype" || key === "constructor";

export const validateWorkflowOptionsShape = (
  value: unknown
): { success: true } | { success: false; message: string } => {
  let totalNodes = 0;

  const visit = (candidate: unknown, depth: number, path: string): string | null => {
    totalNodes += 1;
    if (totalNodes > WORKFLOW_OPTIONS_LIMITS.maxTotalNodes) {
      return "Workflow options are too large";
    }

    if (candidate === null || typeof candidate === "boolean") {
      return null;
    }

    if (typeof candidate === "string") {
      return candidate.length <= WORKFLOW_OPTIONS_LIMITS.maxStringChars
        ? null
        : `${path} must be ${WORKFLOW_OPTIONS_LIMITS.maxStringChars} characters or fewer`;
    }

    if (typeof candidate === "number") {
      return Number.isFinite(candidate) ? null : `${path} must be a finite number`;
    }

    if (depth > WORKFLOW_OPTIONS_LIMITS.maxDepth) {
      return "Workflow options are nested too deeply";
    }

    if (Array.isArray(candidate)) {
      if (candidate.length > WORKFLOW_OPTIONS_LIMITS.maxArrayItems) {
        return `${path} must contain ${WORKFLOW_OPTIONS_LIMITS.maxArrayItems} items or fewer`;
      }

      for (let index = 0; index < candidate.length; index += 1) {
        const issue = visit(candidate[index], depth + 1, `${path}[${index}]`);
        if (issue) {
          return issue;
        }
      }

      return null;
    }

    if (!isPlainObject(candidate)) {
      return `${path} must contain only JSON-compatible values`;
    }

    const keys = Object.keys(candidate);
    if (keys.length > WORKFLOW_OPTIONS_LIMITS.maxKeysPerObject) {
      return `${path} must contain ${WORKFLOW_OPTIONS_LIMITS.maxKeysPerObject} keys or fewer`;
    }

    for (const key of keys) {
      if (isForbiddenObjectKey(key)) {
        return `${path} contains a reserved key`;
      }

      if (key.length === 0 || key.length > WORKFLOW_OPTIONS_LIMITS.maxKeyLength) {
        return `${path} keys must be 1-${WORKFLOW_OPTIONS_LIMITS.maxKeyLength} characters`;
      }

      const issue = visit(candidate[key], depth + 1, `${path}.${key}`);
      if (issue) {
        return issue;
      }
    }

    return null;
  };

  if (!isPlainObject(value)) {
    return { success: false, message: "Workflow step options must be an object" };
  }

  const issue = visit(value, 0, "options");
  return issue ? { success: false, message: issue } : { success: true };
};

const workflowOptionsSchema = z
  .unknown()
  .superRefine((value, context) => {
    const result = validateWorkflowOptionsShape(value);
    if (!result.success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.message
      });
    }
  })
  .transform((value): WorkflowOptions => value as WorkflowOptions);

export const pdfToWordInputSchema = z.object({
  extractedText: trimmedText.min(10).transform((value) => sanitizeText(value)),
  pageCount: z.number().int().min(1).max(500),
  filename: fileNameSchema
});

export const extractTableInputSchema = z.object({
  tableText: trimmedText.min(5).transform((value) => sanitizeText(value)),
  tableName: z.string().max(100).optional().transform((value) => value?.trim())
});

export const summarizeInputSchema = z.object({
  extractedText: trimmedText.min(10).transform((value) => sanitizeText(value)),
  filename: fileNameSchema
});

export const detectPiiInputSchema = z.object({
  extractedText: trimmedText.min(10).transform((value) => sanitizeText(value)),
  pageCount: z.number().int().min(1).max(500),
  filename: fileNameSchema
});

export const legibilityInputSchema = z.object({
  sampleText: trimmedText.min(10).max(2_000).transform((value) => sanitizeText(value)),
  compressionRatio: z.number().min(0).max(1)
});

export const workflowStepSchema = z.object({
  tool: z.enum([
    "merge",
    "split",
    "compress",
    "pdf_to_word",
    "pdf_to_images",
    "watermark",
    "sign",
    "redact",
    "rotate",
    "metadata_strip"
  ]),
  options: workflowOptionsSchema
});

export const workflowCreateInputSchema = z.object({
  name: z.string().min(1).max(100).transform((value) => value.trim()),
  steps: z.array(workflowStepSchema).min(1).max(10)
});

export const workflowUpdateInputSchema = workflowCreateInputSchema.extend({
  id: z.string().uuid()
});

export const workflowDeleteInputSchema = z.object({
  id: z.string().uuid()
});

export const feedbackInputSchema = z.object({
  category: z.enum([
    "bug",
    "idea",
    "quality",
    "confusing",
    "privacy_access",
    "privacy_correction",
    "privacy_erasure",
    "consent_withdrawal",
    "grievance",
    "other"
  ]),
  message: z.string().trim().min(10).max(2_000).transform((value) => sanitizeText(value)),
  email: optionalEmailSchema,
  rating: z.number().int().min(1).max(5).nullable().optional(),
  pagePath: z.string().trim().max(500).optional().transform((value) => sanitizeText(value ?? "")),
  source: z.literal("feedback_widget").optional(),
  website: z.string().max(200).optional()
});

export const fileValidationSchema = z.object({
  maxSizeBytes: z.number().int().positive(),
  allowedMimeTypes: z.array(z.literal("application/pdf")).default(["application/pdf"])
});

export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    requestId: z.string().optional()
  })
});

export const successResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    data: schema
  });

export const validateAndParse = <TOutput, TInput = unknown>(
  schema: z.ZodType<TOutput, ZodTypeDef, TInput>,
  data: unknown
): { data: TOutput } | { error: string } => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.message).join("; ");
    return { error: issues || "Invalid request payload" };
  }

  return { data: result.data };
};

export const sanitizeHtmlTags = (value: string): string => sanitizeText(value);
