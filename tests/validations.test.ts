import { describe, expect, it } from "vitest";
import { assertFileAllowed, captureNoteSchema, inviteMemberSchema } from "@/lib/validations";

describe("validations", () => {
  it("rejects notes that are too thin to become knowledge", () => {
    expect(() => captureNoteSchema.parse({ content: "ok" })).toThrow();
  });

  it("accepts a teammate invite", () => {
    expect(inviteMemberSchema.parse({ email: "alex@peakline.demo", role: "employee" }).email).toBe(
      "alex@peakline.demo",
    );
  });

  it("enforces capture file type and size", () => {
    expect(assertFileAllowed({ name: "note.txt", type: "text/plain", size: 1200 }).kind).toBe(
      "document",
    );
    expect(() =>
      assertFileAllowed({ name: "photo.png", type: "image/png", size: 1000 }),
    ).toThrow(/PDF/);
    expect(() =>
      assertFileAllowed({
        name: "huge.pdf",
        type: "application/pdf",
        size: 12 * 1024 * 1024,
      }),
    ).toThrow(/10 MB/);
  });
});
