import Groq from "groq-sdk";

type CompletionOptions = {
  temperature?: number;
  maxTokens?: number;
};

let groqClient: Groq | null = null;

export const createGroqClient = (): Groq => {
  if (groqClient) {
    return groqClient;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is required");
  }

  groqClient = new Groq({ apiKey });
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
  const client = createGroqClient();
  const chunks = chunkByTokens(userContent);

  for (const chunk of chunks) {
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

    for await (const part of stream) {
      const piece = part.choices[0]?.delta?.content;
      if (piece) {
        yield piece;
      }
    }
  }
}

export const nonStreamCompletion = async (
  systemPrompt: string,
  userContent: string,
  options: CompletionOptions = {}
): Promise<string> => {
  const client = createGroqClient();
  const chunks = chunkByTokens(userContent);
  const outputs: string[] = [];

  for (const chunk of chunks) {
    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 4096,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: chunk }
      ]
    });

    outputs.push(response.choices[0]?.message?.content ?? "");
  }

  return outputs.join("\n").trim();
};
