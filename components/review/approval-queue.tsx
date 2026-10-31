"use client";

import Link from "next/link";
import { CategoryBadge } from "@/components/knowledge/category-badge";
import { StatusBadge } from "@/components/knowledge/status-badge";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useWorkspace } from "@/lib/demo/workspace-store";
import { canReviewKnowledge } from "@/lib/permissions";
import { formatRelativeTime } from "@/lib/utils";

export function ApprovalQueue() {
  const { pendingReview, currentUser, profileName } = useWorkspace();

  if (!canReviewKnowledge(currentUser.role)) {
    return (
      <EmptyState
        title="Review is limited to owners and managers"
        description="Employees can capture knowledge. Approval stays with the people accountable for company guidance."
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Review</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Compare each draft with the original capture. Edit anything that is wrong. Approve only
          what the company should stand behind.
        </p>
      </header>

      <Alert>
        <AlertTitle>AI drafts are not policy</AlertTitle>
        <AlertDescription>
          Confidence is shown as review signals such as “needs owner review” or “possible pricing”,
          never as a fake percentage.
        </AlertDescription>
      </Alert>

      {pendingReview.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          description="New captures create drafts here. Approved items move into company memory."
          action={
            <Link href="/capture" className={buttonVariants()}>
              Capture from the field
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {pendingReview.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/review/${entry.id}`}
                className="block rounded-2xl border bg-card p-5 hover:bg-muted/30"
                data-testid={`review-card-${entry.id}`}
              >
                <div className="flex flex-wrap gap-2">
                  <CategoryBadge category={entry.category} />
                  <StatusBadge status={entry.status} />
                </div>
                <h2 className="mt-3 text-base font-semibold">{entry.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{entry.summary}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {profileName(entry.createdBy)} · {formatRelativeTime(entry.createdAt)} ·{" "}
                  {entry.reviewSignals.join(", ") || "needs review"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
