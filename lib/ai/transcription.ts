import { getAiRuntimeConfig } from "@/lib/ai/config";
import { mockTranscribe } from "@/lib/ai/providers/mock";

export type TranscriptionInput = {
  text?: string;
  filename?: string;
  mimeType?: string;
  audioBytes?: ArrayBuffer;
};

export async function transcribeCapture(input: TranscriptionInput): Promise<{
  transcript: string;
  provider: "openai" | "mock";
}> {
  const config = getAiRuntimeConfig();
  if (config.provider === "openai" && input.audioBytes && input.audioBytes.byteLength > 0) {
    throw new Error(
      "OpenAI transcription is configured, but the live audio adapter is enabled in Phase 4. Use the mock adapter until that endpoint is wired.",
    );
  }

  const transcript = await mockTranscribe({
    text: input.text,
    filename: input.filename,
  });

  return { transcript, provider: "mock" };
}
