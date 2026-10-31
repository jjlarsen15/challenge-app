import type {
  KnowledgeEntry,
  MemberRole,
  SensitivityLevel,
  WorkspaceUser,
} from "@/lib/types/domain";

export function canManageMembers(role: MemberRole): boolean {
  return role === "owner";
}

export function canEditOrganization(role: MemberRole): boolean {
  return role === "owner";
}

export function canReviewKnowledge(role: MemberRole): boolean {
  return role === "owner" || role === "manager";
}

export function canArchiveKnowledge(role: MemberRole): boolean {
  return role === "owner" || role === "manager";
}

export function canCaptureKnowledge(role: MemberRole): boolean {
  return role === "owner" || role === "manager" || role === "employee";
}

export function canViewCustomerData(role: MemberRole): boolean {
  return role === "owner" || role === "manager";
}

export function canAskAssistant(role: MemberRole): boolean {
  return role === "owner" || role === "manager" || role === "employee";
}

export function canViewKnowledgeEntry(
  user: Pick<WorkspaceUser, "role" | "id">,
  entry: Pick<KnowledgeEntry, "status" | "sensitivity" | "createdBy">,
): boolean {
  if (entry.sensitivity === "customer_specific" && !canViewCustomerData(user.role)) {
    return false;
  }

  if (entry.status === "approved" || entry.status === "archived") {
    return true;
  }

  if (canReviewKnowledge(user.role)) {
    return true;
  }

  return entry.createdBy === user.id;
}

export function canEditKnowledgeEntry(
  user: Pick<WorkspaceUser, "role" | "id">,
  entry: Pick<KnowledgeEntry, "status" | "createdBy">,
): boolean {
  if (canReviewKnowledge(user.role)) return true;
  return entry.status === "draft" && entry.createdBy === user.id;
}

export function filterVisibleKnowledge<T extends Pick<KnowledgeEntry, "status" | "sensitivity" | "createdBy">>(
  user: Pick<WorkspaceUser, "role" | "id">,
  entries: T[],
): T[] {
  return entries.filter((entry) => canViewKnowledgeEntry(user, entry));
}

export function isAuthoritativeKnowledge(
  entry: Pick<KnowledgeEntry, "status" | "sensitivity">,
  role: MemberRole,
): boolean {
  if (entry.status !== "approved") return false;
  if (entry.sensitivity === "customer_specific" && !canViewCustomerData(role)) {
    return false;
  }
  return true;
}

export function assertRole(
  role: MemberRole,
  allowed: MemberRole[],
  action: string,
): void {
  if (!allowed.includes(role)) {
    throw new Error(`Not allowed to ${action}`);
  }
}

export function sensitivityForCategory(
  category: KnowledgeEntry["category"],
): SensitivityLevel {
  return category === "customer" ? "customer_specific" : "general";
}
