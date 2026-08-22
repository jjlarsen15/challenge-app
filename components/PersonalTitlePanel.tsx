"use client";

import { rarityTextClass } from "@/lib/adventurer-titles";
import type { AdventurerRarity } from "@/lib/types";

type PersonalTitlePanelProps = {
  displayName: string;
  title: string | null;
  rarity: AdventurerRarity | null;
  rerollsRemaining: number;
  busy?: boolean;
  onRequestReroll: () => void;
};

export function PersonalTitlePanel({
  displayName,
  title,
  rarity,
  rerollsRemaining,
  busy = false,
  onRequestReroll,
}: PersonalTitlePanelProps) {
  const rerolls = Math.max(0, rerollsRemaining);
  const titleClass = rarityTextClass(rarity);

  return (
    <div className="mt-3 rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
        Your fate
      </p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{displayName}</p>
      {title ? (
        <p className={`text-xs font-medium leading-snug ${titleClass}`}>
          the {title}
        </p>
      ) : (
        <p className="text-xs font-medium text-ink-muted">Awaiting title…</p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        {rerolls > 0 ? (
          <>
            <p className="text-xs font-medium text-ink-muted">
              {rerolls} {rerolls === 1 ? "reroll" : "rerolls"} left
            </p>
            <button
              type="button"
              disabled={busy || !title}
              onClick={onRequestReroll}
              className="rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:bg-sand-100 disabled:opacity-50"
            >
              Reroll Fate
            </button>
          </>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-wide text-olive">
            Fate sealed
          </p>
        )}
      </div>
    </div>
  );
}
