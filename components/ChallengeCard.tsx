"use client";

import { useState } from "react";
import type { ChallengeWithProgress } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

type ChallengeCardProps = {
  challenge: ChallengeWithProgress;
  isAdmin: boolean;
  hasMembership: boolean;
  onAddProgress: (challengeId: string, amount: number) => Promise<void> | void;
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
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustValue, setAdjustValue] = useState("");
  const [showContributions, setShowContributions] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const percent = formatPercent(challenge.progress, challenge.goal);

  async function applyAmount(signedAmount: number) {
    if (!Number.isFinite(signedAmount) || signedAmount === 0) return;
    setBusy(true);
    setAdjustError(null);
    try {
      await onAddProgress(challenge.id, signedAmount);
      setAdjustValue("");
      setShowAdjust(false);
    } catch (err) {
      setAdjustError(err instanceof Error ? err.message : "Failed to update progress");
    } finally {
      setBusy(false);
    }
  }

  function handleAdjust(sign: 1 | -1) {
    const amount = Number(adjustValue);
    if (!Number.isFinite(amount) || amount <= 0) {
      setAdjustError("Enter a positive amount");
      return;
    }
    void applyAmount(sign * amount);
  }

  return (
    <article className="rounded-xl border border-orange-100 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-tight text-slate-900 sm:text-lg">
            {challenge.name}
          </h3>
          <p className="mt-0.5 text-sm text-slate-600 sm:text-base">
            <span className="font-semibold text-slate-900">
              {challenge.progress.toLocaleString()}
            </span>
            {" / "}
            {challenge.goal.toLocaleString()} {challenge.unit}
            <span className="ml-2 text-xs font-medium text-orange-600 sm:text-sm">
              {percent}%
            </span>
          </p>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(challenge)}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(challenge.id)}
              className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 h-3 overflow-hidden rounded-full bg-orange-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {hasMembership && (
        <div className="mt-2.5 space-y-2">
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 5, 10].map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={busy}
                onClick={() => void applyAmount(amount)}
                className="rounded-xl bg-orange-500 px-1 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 active:scale-95 disabled:opacity-50"
              >
                +{amount}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setShowAdjust((open) => !open);
                setAdjustError(null);
              }}
              className="rounded-xl border-2 border-orange-300 bg-orange-50 px-1 py-2.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100 active:scale-95"
            >
              Adjust
            </button>
          </div>

          {showAdjust && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-600">
                  Amount
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={1}
                  value={adjustValue}
                  onChange={(event) => setAdjustValue(event.target.value)}
                  placeholder="e.g. 15"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                  autoFocus
                />
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleAdjust(1)}
                  className="rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleAdjust(-1)}
                  className="rounded-xl bg-slate-800 px-3 py-2.5 text-sm font-bold text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  Subtract
                </button>
              </div>
              {adjustError && (
                <p className="mt-2 text-xs font-medium text-rose-600">{adjustError}</p>
              )}
            </div>
          )}
        </div>
      )}

      {challenge.memberContributions.length > 0 && (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={() => setShowContributions((open) => !open)}
            className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            <span>Contributions ({challenge.memberContributions.length})</span>
            <span>{showContributions ? "Hide" : "Show"}</span>
          </button>
          {showContributions && (
            <ul className="mt-1.5 space-y-0.5">
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
          )}
        </div>
      )}
    </article>
  );
}
