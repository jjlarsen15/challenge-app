"use client";

import { useEffect, useRef, useState } from "react";
import { rarityTextClass } from "@/lib/adventurer-titles";
import type { ChallengeWithProgress } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

type ChallengeCardProps = {
  challenge: ChallengeWithProgress;
  /** Structural edit/delete — admin + Edit Adventure only. */
  canEdit: boolean;
  /**
   * Progress contribution — any participating member, including the room admin.
   * Must not be tied to canEdit / edit mode.
   */
  hasMembership: boolean;
  onAddProgress: (challengeId: string, amount: number) => Promise<void> | void;
  onEdit: (challenge: ChallengeWithProgress) => void;
  onDelete: (challengeId: string) => void;
};

export function ChallengeCard({
  challenge,
  canEdit,
  hasMembership,
  onAddProgress,
  onEdit,
  onDelete,
}: ChallengeCardProps) {
  const [amount, setAmount] = useState("10");
  const [showContributions, setShowContributions] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const wasComplete = useRef(false);

  const percent = formatPercent(challenge.progress, challenge.goal);
  const isComplete = challenge.progress >= challenge.goal && challenge.goal > 0;
  const isBinary = challenge.goal === 1;

  useEffect(() => {
    if (isComplete && !wasComplete.current) {
      setJustCompleted(true);
      const timeout = window.setTimeout(() => setJustCompleted(false), 800);
      wasComplete.current = true;
      return () => window.clearTimeout(timeout);
    }
    if (!isComplete) {
      wasComplete.current = false;
    }
  }, [isComplete]);

  async function applyAmount(signedAmount: number) {
    if (!Number.isFinite(signedAmount) || signedAmount === 0) return;
    setBusy(true);
    setActionError(null);
    try {
      await onAddProgress(challenge.id, signedAmount);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update progress");
    } finally {
      setBusy(false);
    }
  }

  function parsedAmount(): number | null {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return null;
    return value;
  }

  function nudgeAmount(delta: number) {
    const current = parsedAmount() ?? 0;
    const next = Math.max(1, current + delta);
    setAmount(String(next));
    setActionError(null);
  }

  function handleAddProgress() {
    const value = parsedAmount();
    if (value === null) {
      setActionError("Enter a positive amount");
      return;
    }
    void applyAmount(value);
  }

  function handleSubtractProgress() {
    const value = parsedAmount();
    if (value === null) {
      setActionError("Enter a positive amount");
      return;
    }
    void applyAmount(-value);
  }

  return (
    <article
      className={`rounded-xl border bg-white p-3 shadow-sm sm:p-3.5 ${
        isComplete ? "border-gold/50 bg-gold-soft/20" : "border-sand-200"
      } ${justCompleted ? "quest-just-completed" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isComplete && (
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pine text-[11px] font-bold text-white"
                aria-hidden
              >
                ✓
              </span>
            )}
            <h3 className="text-base font-bold leading-tight text-ink">{challenge.name}</h3>
          </div>
          <p className="mt-0.5 text-sm text-ink-muted">
            <span className="font-semibold text-ink">
              {challenge.progress.toLocaleString()}
            </span>
            {" / "}
            {challenge.goal.toLocaleString()} {challenge.unit}
            {!isComplete && (
              <span className="ml-2 text-xs font-medium text-ember">{percent}%</span>
            )}
          </p>
          {isComplete && (
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-pine">
              Quest Complete
            </p>
          )}
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(challenge)}
              className="rounded-lg border border-sand-200 px-2.5 py-1 text-xs font-semibold text-ink-muted hover:bg-sand-50"
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

      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-sand-100">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isComplete ? "bg-gold" : "bg-pine"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {hasMembership && (
        <div className="mt-2.5 space-y-2">
          {isBinary && !isComplete ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void applyAmount(1)}
                className="w-full rounded-xl bg-pine px-3 py-3 text-sm font-bold text-white transition hover:bg-pine/90 active:scale-[0.99] disabled:opacity-50"
              >
                Complete Quest
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void applyAmount(-1)}
                className="w-full text-center text-xs font-semibold text-ink-muted underline-offset-2 hover:underline disabled:opacity-50"
              >
                Undo complete
              </button>
            </>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 10, 25].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    disabled={busy}
                    onClick={() => void applyAmount(quick)}
                    className="rounded-xl bg-pine px-1 py-2.5 text-sm font-bold text-white transition hover:bg-pine/90 active:scale-95 disabled:opacity-50"
                  >
                    +{quick}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => nudgeAmount(-1)}
                  aria-label="Decrease amount"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sand-200 bg-sand-50 text-lg font-bold text-ink hover:bg-sand-100 active:scale-95 disabled:opacity-50"
                >
                  −
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={amount}
                  onChange={(event) => {
                    const next = event.target.value.replace(/[^\d]/g, "");
                    setAmount(next);
                    setActionError(null);
                  }}
                  aria-label="Contribution amount"
                  className="h-11 min-w-0 flex-1 rounded-xl border border-sand-200 bg-white px-3 text-center text-base font-semibold text-ink outline-none focus:border-pine focus:ring-2 focus:ring-pine/20"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => nudgeAmount(1)}
                  aria-label="Increase amount"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sand-200 bg-sand-50 text-lg font-bold text-ink hover:bg-sand-100 active:scale-95 disabled:opacity-50"
                >
                  +
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleAddProgress}
                  className="rounded-xl bg-pine px-3 py-2.5 text-sm font-bold text-white hover:bg-pine/90 active:scale-[0.99] disabled:opacity-50"
                >
                  Add Progress
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleSubtractProgress}
                  className="rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-sm font-bold text-ink-muted hover:bg-sand-100 active:scale-[0.99] disabled:opacity-50"
                >
                  Subtract
                </button>
              </div>
            </>
          )}

          {actionError && (
            <p className="text-xs font-medium text-rose-600">{actionError}</p>
          )}
        </div>
      )}

      {challenge.memberContributions.length > 0 && (
        <div className="mt-2 border-t border-sand-100 pt-2">
          <button
            type="button"
            onClick={() => setShowContributions((open) => !open)}
            className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-wide text-ink-muted"
          >
            <span>Contributions ({challenge.memberContributions.length})</span>
            <span>{showContributions ? "Hide" : "Show"}</span>
          </button>
          {showContributions && (
            <ul className="mt-1.5 space-y-0.5">
              {challenge.memberContributions.map((mc) => (
                <li
                  key={mc.memberId}
                  className="flex justify-between gap-2 text-sm text-ink-muted"
                >
                  <span className="min-w-0">
                    <span className="text-ink">{mc.displayName}</span>
                    {mc.adventurerTitle && (
                      <>
                        {" "}
                        <span className={rarityTextClass(mc.adventurerRarity)}>
                          the {mc.adventurerTitle}
                        </span>
                      </>
                    )}
                  </span>
                  <span className="shrink-0">{mc.amount.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
