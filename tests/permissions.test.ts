import { describe, expect, it } from "vitest";
import {
  canReviewKnowledge,
  canViewCustomerData,
  canViewKnowledgeEntry,
  isAuthoritativeKnowledge,
} from "@/lib/permissions";
import type { KnowledgeEntry, WorkspaceUser } from "@/lib/types/domain";

const owner: WorkspaceUser = {
  id: "owner",
  fullName: "Jordan",
  email: "jordan@demo",
  role: "owner",
};

const employee: WorkspaceUser = {
  id: "tech",
  fullName: "Riley",
  email: "riley@demo",
  role: "employee",
};

function entry(
  overrides: Partial<KnowledgeEntry> = {},
): Pick<KnowledgeEntry, "status" | "sensitivity" | "createdBy"> {
  return {
    status: "approved",
    sensitivity: "general",
    createdBy: "tech",
    ...overrides,
  };
}

describe("permissions", () => {
  it("lets managers review and keeps employees from approving", () => {
    expect(canReviewKnowledge("owner")).toBe(true);
    expect(canReviewKnowledge("manager")).toBe(true);
    expect(canReviewKnowledge("employee")).toBe(false);
  });

  it("hides customer-specific knowledge from employees", () => {
    const customerEntry = entry({ sensitivity: "customer_specific" });
    expect(canViewKnowledgeEntry(owner, customerEntry)).toBe(true);
    expect(canViewKnowledgeEntry(employee, customerEntry)).toBe(false);
    expect(canViewCustomerData("employee")).toBe(false);
  });

  it("lets employees see their own drafts but not other pending drafts", () => {
    expect(
      canViewKnowledgeEntry(employee, entry({ status: "pending_review", createdBy: "tech" })),
    ).toBe(true);
    expect(
      canViewKnowledgeEntry(employee, entry({ status: "pending_review", createdBy: "other" })),
    ).toBe(false);
  });

  it("treats only approved, permitted knowledge as authoritative", () => {
    expect(isAuthoritativeKnowledge(entry(), "employee")).toBe(true);
    expect(isAuthoritativeKnowledge(entry({ status: "pending_review" }), "employee")).toBe(false);
    expect(
      isAuthoritativeKnowledge(entry({ sensitivity: "customer_specific" }), "employee"),
    ).toBe(false);
  });
});
