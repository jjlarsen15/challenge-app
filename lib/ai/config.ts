import { getServerEnv, isOpenAIConfigured } from "@/lib/env";

export type AiRuntimeConfig = {
  provider: "openai" | "mock";
  transcribeModel: string;
  extractModel: string;
  answerModel: string;
  embedModel: string;
};

export function getAiRuntimeConfig(): AiRuntimeConfig {
  const env = getServerEnv();
  return {
    provider: isOpenAIConfigured() ? "openai" : "mock",
    transcribeModel: env.OPENAI_TRANSCRIBE_MODEL,
    extractModel: env.OPENAI_EXTRACT_MODEL,
    answerModel: env.OPENAI_ANSWER_MODEL,
    embedModel: env.OPENAI_EMBED_MODEL,
  };
}
