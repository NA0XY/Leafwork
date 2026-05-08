import { z, type ZodSchema } from "zod";

import { isSafeFilename } from "@/lib/validations/file";

const sanitizeText = (value: string): string =>
  value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

const REQUEST_TEXT_MAX_CHARS = 1_000_000;
const trimmedText = z.string().trim().max(REQUEST_TEXT_MAX_CHARS);

const fileNameSchema = z
  .string()
  .max(255)
  .refine((value) => isSafeFilename(value), "Invalid PDF filename");

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
  options: z.record(z.unknown())
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

export const validateAndParse = <T>(
  schema: ZodSchema<T>,
  data: unknown
): { data: T } | { error: string } => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => issue.message).join("; ");
    return { error: issues || "Invalid request payload" };
  }

  return { data: result.data };
};

export const sanitizeHtmlTags = (value: string): string => sanitizeText(value);
