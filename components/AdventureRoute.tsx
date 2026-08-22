"use client";

import type { CategoryWithStats } from "@/lib/types";

type AdventureRouteProps = {
  categories: CategoryWithStats[];
  canEdit: boolean;
  currentCategoryId: string | null;
  onOpen: (categoryId: string) => void;
  onRename: (category: CategoryWithStats) => void;
  onDelete: (category: CategoryWithStats) => void;
};

function isStageComplete(category: CategoryWithStats): boolean {
  return category.challengeCount > 0 && category.completedCount >= category.challengeCount;
}

export function AdventureRoute({
  categories,
  canEdit,
  currentCategoryId,
  onOpen,
  onRename,
  onDelete,
}: AdventureRouteProps) {
  const total = categories.length;

  return (
    <ol className="relative space-y-0">
      {categories.map((category, index) => {
        const stage = index + 1;
        const complete = isStageComplete(category);
        const isCurrent = category.id === currentCategoryId;
        const isLast = index === total - 1;
        const progressLabel =
          category.challengeCount === 0
            ? "No quests yet"
            : `${category.completedCount}/${category.challengeCount} quests`;

        return (
          <li key={category.id} className="relative flex gap-3 pb-4 last:pb-0">
            <div className="relative flex w-7 shrink-0 flex-col items-center">
              <div
                className={`z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  complete
                    ? "border-gold bg-gold text-ink"
                    : isCurrent
                      ? "border-pine bg-pine text-white"
                      : "border-sand-200 bg-white text-ink-muted"
                }`}
              >
                {complete ? "✓" : stage}
              </div>
              {!isLast && (
                <div
                  className={`absolute top-7 bottom-0 w-0.5 ${
                    complete ? "bg-gold/50" : "bg-sand-200"
                  }`}
                />
              )}
            </div>

            <div
              className={`min-w-0 flex-1 rounded-xl border bg-white p-3 shadow-sm ${
                isCurrent
                  ? "border-pine/40 ring-1 ring-pine/15"
                  : complete
                    ? "border-gold/40"
                    : "border-sand-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpen(category.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-ink">{category.name}</h3>
                    {isCurrent && (
                      <span className="rounded-full bg-pine/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pine">
                        Current
                      </span>
                    )}
                    {complete && (
                      <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
                        Cleared
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    Stage {stage} of {total} · {progressLabel}
                  </p>
                  {category.challengeCount > 0 && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          complete ? "bg-gold" : "bg-pine"
                        }`}
                        style={{
                          width: `${Math.round(
                            (category.completedCount / category.challengeCount) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </button>

                {canEdit && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => onRename(category)}
                      className="rounded-lg border border-sand-200 px-2 py-1 text-[11px] font-semibold text-ink-muted hover:bg-sand-50"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(category)}
                      className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpen(category.id)}
                className={`mt-2.5 w-full rounded-xl px-3 py-2 text-sm font-bold text-white ${
                  complete
                    ? "bg-olive hover:bg-olive/90"
                    : "bg-pine hover:bg-pine/90"
                }`}
              >
                {complete ? "Review Stage" : isCurrent ? "Continue" : "Enter Stage"}
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
