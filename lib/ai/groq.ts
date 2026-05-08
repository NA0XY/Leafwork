import Groq from "groq-sdk";
import { logger } from "@/lib/utils/logger";

type CompletionOptions = {
  temperature?: number;
  maxTokens?: number;
};

let groqClient: Groq | null = null;

export const createGroqClient = (): Groq => {
  if (groqClient) {
    logger.debug("groq.client.reuse");
    return groqClient;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logger.error("groq.client.missing_api_key");
    throw new Error("GROQ_API_KEY is required");
  }

  groqClient = new Groq({ apiKey });
  logger.info("groq.client.created");
  return groqClient;
};

export const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

const chunkByTokens = (input: string, maxTokens = 12_000): string[] => {
  const maxChars = maxTokens * 4;
  if (input.length <= maxChars) {
    return [input];
  }

  const chunks: string[] = [];
  for (let cursor = 0; cursor < input.length; cursor += maxChars) {
    chunks.push(input.slice(cursor, cursor + maxChars));
  }
  return chunks;
};

export async function* streamCompletion(
  systemPrompt: string,
  userContent: string,
  options: CompletionOptions = {}
): AsyncIterable<string> {
  const startedAt = Date.now();
  const client = createGroqClient();
  const chunks = chunkByTokens(userContent);
  logger.info("groq.stream.start", {
    chunkCount: chunks.length,
    inputLength: userContent.length,
    maxTokens: options.maxTokens ?? 4096,
    temperature: options.temperature ?? 0.3
  });

  for (const [index, chunk] of chunks.entries()) {
    logger.debug("groq.stream.chunk.request", {
      chunkIndex: index + 1,
      chunkCount: chunks.length,
      chunkLength: chunk.length
    });

    const stream = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      stream: true,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: chunk }
      ]
    });

    let emittedChars = 0;
    for await (const part of stream) {
      const piece = part.choices[0]?.delta?.content;
      if (piece) {
        emittedChars += piece.length;
        yield piece;
      }
    }

    logger.debug("groq.stream.chunk.complete", {
      chunkIndex: index + 1,
      chunkCount: chunks.length,
      emittedChars
    });
  }

  logger.info("groq.stream.complete", {
    chunkCount: chunks.length,
    durationMs: Date.now() - startedAt
  });
}

export const nonStreamCompletion = async (
  systemPrompt: string,
  userContent: string,
  options: CompletionOptions = {}
): Promise<string> => {
  const startedAt = Date.now();
  const client = createGroqClient();
  const chunks = chunkByTokens(userContent);
  const outputs: string[] = [];
  logger.info("groq.completion.start", {
    chunkCount: chunks.length,
    inputLength: userContent.length,
    maxTokens: options.maxTokens ?? 4096,
    temperature: options.temperature ?? 0.3
  });

  for (const [index, chunk] of chunks.entries()) {
    logger.debug("groq.completion.chunk.request", {
      chunkIndex: index + 1,
      chunkCount: chunks.length,
      chunkLength: chunk.length
    });

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: chunk }
      ]
    });

    const output = response.choices[0]?.message?.content ?? "";
    outputs.push(output);
    logger.debug("groq.completion.chunk.complete", {
      chunkIndex: index + 1,
      chunkCount: chunks.length,
      outputLength: output.length
    });
  }

  const merged = outputs.join("\n").trim();
  logger.info("groq.completion.complete", {
    chunkCount: chunks.length,
    outputLength: merged.length,
    durationMs: Date.now() - startedAt
  });

  return merged;
};
