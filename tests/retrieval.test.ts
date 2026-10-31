import { describe, expect, it } from "vitest";
import { retrieveApprovedKnowledge } from "@/lib/ai/retrieval";
import type { KnowledgeEntry } from "@/lib/types/domain";

function makeEntry(partial: Partial<KnowledgeEntry> & Pick<KnowledgeEntry, "id" | "title" | "content">): KnowledgeEntry {
  return {
    organizationId: "org",
    category: "pricing",
    summary: partial.title,
    status: "approved",
    sensitivity: "general",
    customerId: null,
    equipmentId: null,
    createdBy: "owner",
    approvedBy: "owner",
    approvedAt: new Date().toISOString(),
    currentVersion: 1,
    reviewSignals: [],
    tagIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("retrieval", () => {
  it("returns approved weekend pricing for a weekend question", () => {
    const entries = [
      makeEntry({
        id: "weekend",
        title: "Weekend emergency call pricing",
        content:
          "Weekend emergency jobs are time-and-a-half plus a $95 dispatch fee. Saturday morning is not regular rate.",
      }),
      makeEntry({
        id: "drain",
        category: "procedure",
        title: "Winter condensate drain procedure",
        content: "Clear the drain, add pan tablets, and photograph the trap.",
      }),
    ];

    const results = retrieveApprovedKnowledge({
      query: "How do we usually price emergency weekend calls?",
      entries,
      role: "employee",
    });

    expect(results[0]?.entry.id).toBe("weekend");
  });

  it("does not retrieve unrelated approved records", () => {
    const entries = [
      makeEntry({
        id: "parts",
        category: "supplier",
        title: "Preferred supplier for OEM replacement parts",
        content: "Peakline prefers Johnstone Supply for OEM replacement parts.",
      }),
    ];

    expect(
      retrieveApprovedKnowledge({
        query: "What is our official policy for painting trucks neon orange?",
        entries,
        role: "employee",
      }),
    ).toHaveLength(0);
  });

  it("does not retrieve pending drafts", () => {
    const entries = [
      makeEntry({
        id: "draft",
        title: "Secret weekend rate",
        content: "Charge $400 for weekend emergency calls.",
        status: "pending_review",
      }),
    ];

    expect(
      retrieveApprovedKnowledge({
        query: "weekend emergency pricing",
        entries,
        role: "employee",
      }),
    ).toHaveLength(0);
  });
});
