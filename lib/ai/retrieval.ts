import { cosineSimilarity, embedTextLocal } from "@/lib/ai/embedding";
import { isAuthoritativeKnowledge } from "@/lib/permissions";
import type { KnowledgeEntry, MemberRole } from "@/lib/types/domain";

export type RetrievedChunk = {
  entry: KnowledgeEntry;
  score: number;
  excerpt: string;
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "how",
  "what",
  "when",
  "our",
  "we",
  "do",
  "does",
  "did",
  "is",
  "are",
  "with",
  "from",
  "this",
  "that",
  "have",
  "has",
  "been",
  "usually",
  "please",
  "official",
  "policy",
]);

function queryTerms(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term));
}

function lexicalScore(query: string, entry: KnowledgeEntry): number {
  const haystack = `${entry.title} ${entry.summary} ${entry.content}`.toLowerCase();
  const terms = queryTerms(query);
  if (terms.length === 0) return 0;
  let hits = 0;
  for (const term of terms) {
    if (haystack.includes(term)) hits += 1;
  }
  const titleBoost = terms.some((term) => entry.title.toLowerCase().includes(term)) ? 0.2 : 0;
  return hits / terms.length + titleBoost;
}

function excerptFor(entry: KnowledgeEntry, query: string): string {
  const content = entry.content.replace(/\s+/g, " ").trim();
  const term = query
    .toLowerCase()
    .split(/\s+/)
    .find((part) => part.length > 3 && content.toLowerCase().includes(part));
  if (!term) return content.slice(0, 240);
  const index = content.toLowerCase().indexOf(term);
  const start = Math.max(0, index - 80);
  return content.slice(start, start + 240).trim();
}

export function retrieveApprovedKnowledge(input: {
  query: string;
  entries: KnowledgeEntry[];
  role: MemberRole;
  limit?: number;
}): RetrievedChunk[] {
  const limit = input.limit ?? 4;
  const queryVector = embedTextLocal(input.query);

  return input.entries
    .filter((entry) => isAuthoritativeKnowledge(entry, input.role))
    .map((entry) => {
      const semantic = cosineSimilarity(
        queryVector,
        embedTextLocal(`${entry.title} ${entry.summary} ${entry.content}`),
      );
      const lexical = lexicalScore(input.query, entry);
      // Local embeddings are coarse. Require a real wording overlap so we never
      // treat unrelated approved records as an answer.
      const score = lexical < 0.2 ? 0 : semantic * 0.25 + lexical * 0.75;
      return {
        entry,
        score,
        excerpt: excerptFor(entry, input.query),
      };
    })
    .filter((result) => result.score >= 0.28)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
