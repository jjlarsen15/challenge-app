"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CategoryBadge } from "@/components/knowledge/category-badge";
import { StatusBadge } from "@/components/knowledge/status-badge";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import {
  CATEGORY_LABELS,
  KNOWLEDGE_CATEGORIES,
  type KnowledgeCategory,
  type KnowledgeStatus,
} from "@/lib/types/domain";
import { retrieveApprovedKnowledge } from "@/lib/ai/retrieval";
import { useWorkspace } from "@/lib/demo/workspace-store";
import { cn, formatRelativeTime } from "@/lib/utils";

export function KnowledgeLibrary() {
  const { visibleKnowledge, currentUser } = useWorkspace();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<KnowledgeCategory | "all">("all");
  const [status, setStatus] = useState<KnowledgeStatus | "all">("approved");

  const filtered = useMemo(() => {
    const byFilters = visibleKnowledge.filter((entry) => {
      if (category !== "all" && entry.category !== category) return false;
      if (status !== "all" && entry.status !== status) return false;
      return true;
    });
    if (!query.trim()) return byFilters;
    const semantic = retrieveApprovedKnowledge({
      query,
      entries: byFilters,
      role: currentUser.role,
      limit: 20,
    }).map((item) => item.entry.id);
    const lexical = byFilters.filter((entry) =>
      `${entry.title} ${entry.summary} ${entry.content}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
    const ids = new Set([...semantic, ...lexical.map((entry) => entry.id)]);
    return byFilters.filter((entry) => ids.has(entry.id));
  }, [category, currentUser.role, query, status, visibleKnowledge]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Company memory</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Search approved procedures, pricing, equipment notes, and lessons. Customer-specific
          records stay limited to owners and managers.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search memory"
          className="h-11 rounded-xl lg:max-w-md"
          data-testid="memory-search"
        />
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={category === "all"}
            onClick={() => setCategory("all")}
            label="All categories"
          />
          {KNOWLEDGE_CATEGORIES.map((item) => (
            <FilterChip
              key={item}
              active={category === item}
              onClick={() => setCategory(item)}
              label={CATEGORY_LABELS[item]}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {(["approved", "pending_review", "archived", "all"] as const).map((item) => (
          <FilterChip
            key={item}
            active={status === item}
            onClick={() => setStatus(item)}
            label={item === "all" ? "Any status" : item.replace("_", " ")}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nothing in memory matches"
          description="Capture a note from the field, then approve the draft. Ask OwnerOS only answers from approved records."
          action={
            <Link href="/capture" className={buttonVariants()}>
              Capture knowledge
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/memory/${entry.id}`}
                className="block h-full rounded-2xl border bg-card p-5 transition-colors hover:bg-muted/30"
                data-testid={`memory-card-${entry.id}`}
              >
                <div className="flex flex-wrap gap-2">
                  <CategoryBadge category={entry.category} />
                  <StatusBadge status={entry.status} />
                </div>
                <h2 className="mt-3 text-base font-semibold">{entry.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {entry.summary}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Updated {formatRelativeTime(entry.updatedAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-primary bg-accent text-accent-foreground" : "bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
