import { extractionResultSchema, type ExtractionResult } from "@/lib/ai/schemas";
import { getAiRuntimeConfig } from "@/lib/ai/config";
import { mockExtract } from "@/lib/ai/providers/mock";

export async function extractKnowledge(transcript: string): Promise<ExtractionResult> {
  const config = getAiRuntimeConfig();
  if (config.provider === "openai") {
    // Phase 4 wires structured OpenAI output. Keep the same Zod contract.
  }

  const result = await mockExtract(transcript);
  return extractionResultSchema.parse(result);
}
