import { describe, expect, it } from "vitest";
import { extractKnowledge } from "@/lib/ai/extraction";
import { mockTranscribe } from "@/lib/ai/providers/mock";

describe("extraction", () => {
  it("keeps drafts in pending review and flags pricing", async () => {
    const transcript = await mockTranscribe({
      text: "Weekend emergency jobs are time-and-a-half plus a $95 dispatch fee.",
    });
    const result = await extractKnowledge(transcript);

    expect(result.observations.length).toBeGreaterThan(0);
    expect(result.observations[0]?.suggestedStatus).toBe("pending_review");
    expect(result.observations[0]?.category).toBe("pricing");
    expect(result.observations[0]?.reviewSignals).toContain("possible_pricing");
    expect(result.observations[0]?.reviewSignals).not.toContain("approved" as never);
  });

  it("labels missing audio as a demo transcript rather than inventing a job", async () => {
    const transcript = await mockTranscribe({ filename: "clip.webm" });
    expect(transcript).toContain("Demo transcript");
  });
});
