"use client";

import type { CategoryWithStats } from "@/lib/types";

type CategoryCardProps = {
  category: CategoryWithStats;
  isAdmin: boolean;
  onOpen: (categoryId: string) => void;
  onRename: (category: CategoryWithStats) => void;
  onDelete: (category: CategoryWithStats) => void;
};

export function CategoryCard({
  category,
  isAdmin,
  onOpen,
  onRename,
  onDelete,
}: CategoryCardProps) {
  const progressLabel =
    category.challengeCount === 0
      ? "No challenges yet"
      : `${category.completedCount} / ${category.challengeCount} complete`;

  return (
    <article className="rounded-xl border border-orange-100 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpen(category.id)}
          className="min-w-0 flex-1 text-left"
        >
          <h3 className="text-lg font-bold text-slate-900">{category.name}</h3>
          <p className="mt-0.5 text-sm text-slate-600">{progressLabel}</p>
          {category.challengeCount > 0 && (
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500"
                style={{
                  width: `${Math.round(
                    (category.completedCount / category.challengeCount) * 100,
                  )}%`,
                }}
              />
            </div>
          )}
        </button>
        {isAdmin && (
          <div className="flex shrink-0 flex-col gap-1">
            <button
              type="button"
              onClick={() => onRename(category)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => onDelete(category)}
              className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onOpen(category.id)}
        className="mt-3 w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
      >
        Open
      </button>
    </article>
  );
}
