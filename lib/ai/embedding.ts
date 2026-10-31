import { getAiRuntimeConfig } from "@/lib/ai/config";

const VECTOR_SIZE = 64;

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

export function embedTextLocal(text: string): number[] {
  const vector = Array.from({ length: VECTOR_SIZE }, () => 0);
  const tokens = tokenize(text);
  for (const token of tokens) {
    let hash = 0;
    for (let i = 0; i < token.length; i += 1) {
      hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
    }
    const index = hash % VECTOR_SIZE;
    vector[index] += 1;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, n) => sum + n * n, 0)) || 1;
  return vector.map((n) => n / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export async function embedText(text: string): Promise<{
  vector: number[];
  provider: "openai" | "local";
}> {
  const config = getAiRuntimeConfig();
  if (config.provider === "openai") {
    // Phase 4: call text-embedding-3-small and store in pgvector.
  }
  return { vector: embedTextLocal(text), provider: "local" };
}
