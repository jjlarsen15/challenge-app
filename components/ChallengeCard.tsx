"use client";

import { useState } from "react";
import type { ChallengeWithProgress } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

type ChallengeCardProps = {
  challenge: ChallengeWithProgress;
  isAdmin: boolean;
  hasMembership: boolean;
  onAddProgress: (challengeId: string, amount: number) => void;
  onEdit: (challenge: ChallengeWithProgress) => void;
  onDelete: (challengeId: string) => void;
};

export function ChallengeCard({
  challenge,
  isAdmin,
  hasMembership,
  onAddProgress,
  onEdit,
  onDelete,
}: ChallengeCardProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [adjustValue, setAdjustValue] = useState("");

  const percent = formatPercent(challenge.progress, challenge.goal);

  function handleCustomSubmit(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(customValue);
    if (!Number.isFinite(amount) || amount === 0) return;

    onAddProgress(challenge.id, amount);
    setCustomValue("");
    setShowCustom(false);
  }

  function handleAdjustSubmit(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(adjustValue);
    if (!Number.isFinite(amount) || amount === 0) return;

    onAddProgress(challenge.id, amount);
    setAdjustValue("");
    setShowAdjust(false);
  }

  return (
    <article className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-slate-900">{challenge.name}</h3>
          <p className="mt-1 text-lg text-slate-600">
            <span className="font-semibold text-slate-900">
              {challenge.progress.toLocaleString()}
            </span>
            {" / "}
            {challenge.goal.toLocaleString()} {challenge.unit}
          </p>
          <p className="mt-1 text-sm font-medium text-orange-600">
            {percent}% complete
          </p>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => onEdit(challenge)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(challenge.id)}
              className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="mb-5 h-4 overflow-hidden rounded-full bg-orange-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {hasMembership && (
        <>
          <div className="grid grid-cols-4 gap-2">
            {[1, 5, 10].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => onAddProgress(challenge.id, amount)}
                className="rounded-xl bg-orange-500 px-2 py-3 text-base font-bold text-white transition hover:bg-orange-600 active:scale-95"
              >
                +{amount}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setShowCustom((open) => !open);
                setShowAdjust(false);
              }}
              className="rounded-xl border-2 border-orange-300 bg-orange-50 px-2 py-3 text-base font-bold text-orange-700 transition hover:bg-orange-100 active:scale-95"
            >
              Custom
            </button>
          </div>

          {showCustom && (
            <form onSubmit={handleCustomSubmit} className="mt-3 flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={customValue}
                onChange={(event) => setCustomValue(event.target.value)}
                placeholder="Amount to add"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-3 text-base font-bold text-white hover:bg-slate-800"
              >
                Add
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={() => {
              setShowAdjust((open) => !open);
              setShowCustom(false);
            }}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100"
          >
            Adjust Progress
          </button>

          {showAdjust && (
            <form onSubmit={handleAdjustSubmit} className="mt-3 flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={adjustValue}
                onChange={(event) => setAdjustValue(event.target.value)}
                placeholder="e.g. -5 to subtract"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-3 text-base font-bold text-white hover:bg-slate-800"
              >
                Apply
              </button>
            </form>
          )}
        </>
      )}

      {challenge.memberContributions.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Contributions
          </p>
          <ul className="space-y-1">
            {challenge.memberContributions.map((mc) => (
              <li
                key={mc.memberId}
                className="flex justify-between text-sm text-slate-600"
              >
                <span>{mc.displayName}</span>
                <span>{mc.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
