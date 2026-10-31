"use client";

import Link from "next/link";
import { CategoryBadge } from "@/components/knowledge/category-badge";
import { StatusBadge } from "@/components/knowledge/status-badge";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useWorkspace } from "@/lib/demo/workspace-store";
import { SOURCE_LABELS } from "@/lib/types/domain";
import { formatDateTime } from "@/lib/utils";

export function KnowledgeDetail({ id }: { id: string }) {
  const { visibleKnowledge, snapshot, profileName } = useWorkspace();
  const entry = visibleKnowledge.find((item) => item.id === id);

  if (!entry) {
    return (
      <EmptyState
        title="This record is not available"
        description="It may be customer-specific, not yet approved, or outside your role."
        action={
          <Link href="/memory" className={buttonVariants({ variant: "outline" })}>
            Back to memory
          </Link>
        }
      />
    );
  }

  const versions = snapshot.versions
    .filter((item) => item.knowledgeEntryId === entry.id)
    .sort((a, b) => b.versionNumber - a.versionNumber);
  const sources = snapshot.sources.filter((item) => item.knowledgeEntryId === entry.id);
  const related = snapshot.relationships
    .filter((item) => item.fromEntryId === entry.id || item.toEntryId === entry.id)
    .map((item) => {
      const otherId = item.fromEntryId === entry.id ? item.toEntryId : item.fromEntryId;
      return {
        ...item,
        other: visibleKnowledge.find((knowledge) => knowledge.id === otherId),
      };
    })
    .filter((item) => item.other);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <Link href="/memory" className="text-sm text-muted-foreground hover:text-foreground">
          Company memory
        </Link>
        <div className="mt-3 flex flex-wrap gap-2">
          <CategoryBadge category={entry.category} />
          <StatusBadge status={entry.status} />
          {entry.sensitivity === "customer_specific" ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
              Customer-specific
            </span>
          ) : null}
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{entry.title}</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">{entry.summary}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guidance</CardTitle>
          <CardDescription>
            {entry.status === "approved"
              ? "Approved company knowledge"
              : "Not approved. Do not treat this as policy."}
          </CardDescription>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm leading-7">
          {entry.content}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {sources.length === 0 ? (
              <p className="text-muted-foreground">No linked capture.</p>
            ) : (
              sources.map((source) => {
                const capture = snapshot.captures.find((item) => item.id === source.captureId);
                return (
                  <div key={source.id} className="rounded-xl bg-muted/40 p-3">
                    <p className="font-medium">
                      {capture ? SOURCE_LABELS[capture.sourceType] : "Capture"}
                    </p>
                    <p className="mt-1 text-muted-foreground">{source.excerpt}</p>
                    {capture ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {profileName(capture.createdBy)} · {formatDateTime(capture.createdAt)}
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Related knowledge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {related.length === 0 ? (
              <p className="text-muted-foreground">No linked records yet.</p>
            ) : (
              related.map((item) => (
                <Link
                  key={item.id}
                  href={`/memory/${item.other!.id}`}
                  className="block rounded-xl border p-3 hover:bg-muted/40"
                >
                  <p className="font-medium">{item.other!.title}</p>
                  <p className="text-xs text-muted-foreground">{item.relationshipType.replaceAll("_", " ")}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revision history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {versions.map((version) => (
            <div key={version.id}>
              <p className="text-sm font-medium">
                v{version.versionNumber} · {version.changeReason}
              </p>
              <p className="text-xs text-muted-foreground">
                {profileName(version.changedBy)} · {formatDateTime(version.createdAt)}
              </p>
              <Separator className="mt-3" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
