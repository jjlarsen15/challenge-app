import { mockAnswer } from "@/lib/ai/providers/mock";
import { retrieveApprovedKnowledge } from "@/lib/ai/retrieval";
import { groundedAnswerSchema, type GroundedAnswer } from "@/lib/ai/schemas";
import type { Citation, KnowledgeEntry, MemberRole } from "@/lib/types/domain";

export async function answerFromKnowledge(input: {
  question: string;
  entries: KnowledgeEntry[];
  role: MemberRole;
}): Promise<{ answer: GroundedAnswer; citations: Citation[] }> {
  const retrieved = retrieveApprovedKnowledge({
    query: input.question,
    entries: input.entries,
    role: input.role,
  });

  const raw = await mockAnswer({
    question: input.question,
    approvedSnippets: retrieved.map((item) => ({
      id: item.entry.id,
      title: item.entry.title,
      content: item.entry.content,
    })),
  });

  const answer = groundedAnswerSchema.parse(raw);
  const citations: Citation[] = retrieved
    .filter((item) => answer.citationIds.includes(item.entry.id))
    .map((item) => ({
      knowledgeEntryId: item.entry.id,
      title: item.entry.title,
      status: item.entry.status,
      excerpt: item.excerpt,
      captureId: null,
    }));

  return { answer, citations };
}
