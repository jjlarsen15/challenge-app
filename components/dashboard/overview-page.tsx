"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { ArrowUpRight, Mic, Sparkles } from "lucide-react";
import { CategoryBadge } from "@/components/knowledge/category-badge";
import { StatusBadge } from "@/components/knowledge/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/lib/demo/workspace-store";
import { SOURCE_LABELS } from "@/lib/types/domain";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function OverviewPage() {
  const router = useRouter();
  const { snapshot, currentUser, pendingReview, visibleKnowledge, profileName } = useWorkspace();
  const [query, setQuery] = useState("");

  const recentCaptures = snapshot.captures.slice(0, 5);
  const recentProcedures = useMemo(
    () =>
      visibleKnowledge
        .filter((entry) => entry.status === "approved")
        .slice()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 4),
    [visibleKnowledge],
  );

  function onAsk(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    router.push(`/ask?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Good to see you, {currentUser.fullName.split(" ")[0]}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {snapshot.organization.name}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Capture what the crew just learned. Review it. Then Ask OwnerOS can answer from approved
          company memory — not from guesswork.
        </p>
      </header>

      <form onSubmit={onAsk} className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
        <Sparkles className="ml-2 hidden size-4 text-primary sm:block" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask how we price weekend calls, handle a unit, or treat a customer"
          className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
          data-testid="overview-ask"
        />
        <div className="flex gap-2">
          <Button type="submit" className="h-11 flex-1 rounded-xl sm:flex-none">
            Ask
          </Button>
          <Link
            href="/capture"
            className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-xl")}
          >
            <Mic data-icon="inline-start" />
            Record
          </Link>
        </div>
      </form>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Waiting on review</CardDescription>
            <CardTitle className="text-3xl">{pendingReview.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            AI drafts stay unpublished until a manager or owner approves them.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Approved memory</CardDescription>
            <CardTitle className="text-3xl">
              {visibleKnowledge.filter((entry) => entry.status === "approved").length}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Only these records are used as authoritative answers.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Captures this week</CardDescription>
            <CardTitle className="text-3xl">{snapshot.captures.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Voice, notes, and documents kept as original source material.
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent captures</CardTitle>
              <CardDescription>Newest source material from the field</CardDescription>
            </div>
            <Link href="/capture" className="text-sm font-medium text-primary">
              New capture
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCaptures.map((capture) => (
              <div key={capture.id} className="rounded-xl border bg-muted/30 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    {SOURCE_LABELS[capture.sourceType]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(capture.createdAt)}
                  </p>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {capture.originalContent || capture.transcript || capture.originalFilename}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {profileName(capture.createdBy)} · {capture.processingStatus}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recently updated procedures</CardTitle>
              <CardDescription>Approved knowledge the crew can trust</CardDescription>
            </div>
            <Link href="/memory" className="text-sm font-medium text-primary">
              Open memory
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProcedures.map((entry) => (
              <Link
                key={entry.id}
                href={`/memory/${entry.id}`}
                className="block rounded-xl border px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-sm font-medium">{entry.title}</p>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{entry.summary}</p>
                <div className="mt-2 flex gap-2">
                  <CategoryBadge category={entry.category} />
                  <StatusBadge status={entry.status} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
