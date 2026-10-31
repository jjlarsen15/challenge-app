"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/lib/demo/workspace-store";
import { canReviewKnowledge } from "@/lib/permissions";
import { CATEGORY_LABELS, KNOWLEDGE_CATEGORIES, SOURCE_LABELS, type KnowledgeCategory } from "@/lib/types/domain";
import Link from "next/link";

export function ReviewDetail({ id }: { id: string }) {
  const router = useRouter();
  const { pendingReview, snapshot, currentUser, reviewEntry, profileName } = useWorkspace();
  const entry = pendingReview.find((item) => item.id === id) ?? snapshot.knowledge.find((item) => item.id === id);

  const [title, setTitle] = useState(entry?.title ?? "");
  const [summary, setSummary] = useState(entry?.summary ?? "");
  const [content, setContent] = useState(entry?.content ?? "");
  const [category, setCategory] = useState<KnowledgeCategory>(entry?.category ?? "lesson");

  if (!entry) {
    return (
      <EmptyState
        title="Draft not found"
        description="It may already have been approved or archived."
        action={
          <Link href="/review" className={buttonVariants({ variant: "outline" })}>
            Back to review
          </Link>
        }
      />
    );
  }

  if (!canReviewKnowledge(currentUser.role)) {
    return (
      <EmptyState
        title="You cannot approve this"
        description="Ask an owner or manager to review the draft."
      />
    );
  }

  const draft = entry;
  const source = snapshot.sources.find((item) => item.knowledgeEntryId === draft.id);
  const capture = snapshot.captures.find((item) => item.id === source?.captureId);

  function decide(decision: "approve" | "reject" | "archive") {
    try {
      reviewEntry({
        entryId: draft.id,
        title,
        summary,
        content,
        category,
        decision,
      });
      toast.success(
        decision === "approve"
          ? "Approved. This is now company guidance."
          : "Draft archived. It will not be used in answers.",
      );
      router.push(decision === "approve" ? `/memory/${draft.id}` : "/review");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the review");
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Link href="/review" className="text-sm text-muted-foreground hover:text-foreground">
          Review queue
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Review draft</h1>
        <div className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              className="min-h-20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Full guidance</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-48"
              data-testid="review-content"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(value) => setCategory(value as KnowledgeCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KNOWLEDGE_CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {CATEGORY_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Review signals: {draft.reviewSignals.join(", ") || "none"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => decide("approve")} data-testid="approve-knowledge">
              Approve
            </Button>
            <Button variant="outline" onClick={() => decide("archive")}>
              Mark outdated
            </Button>
            <Button variant="ghost" onClick={() => decide("reject")}>
              Reject
            </Button>
          </div>
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Original source</CardTitle>
          <CardDescription>
            {capture
              ? `${SOURCE_LABELS[capture.sourceType]} from ${profileName(capture.createdBy)}`
              : "No source linked"}
          </CardDescription>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
          {capture?.originalContent || capture?.transcript || source?.excerpt || "Source text is unavailable."}
        </CardContent>
      </Card>
    </div>
  );
}
