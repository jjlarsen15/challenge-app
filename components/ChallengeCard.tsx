"use client";

import { useState } from "react";
import type { Challenge } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

type ChallengeCardProps = {
  challenge: Challenge;
  currentUser: string;
  onAddProgress: (challengeId: string, amount: number) => void;
};

export function ChallengeCard({
  challenge,
  currentUser,
  onAddProgress,
}: ChallengeCardProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");

  const percent = formatPercent(challenge.progress, challenge.goal);

  const contributions = Object.entries(challenge.contributions)
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a);

  function handleCustomSubmit(event: React.FormEvent) {
    event.preventDefault();
    const amount = Number(customValue);
    if (!Number.isFinite(amount) || amount === 0) return;

    onAddProgress(challenge.id, amount);
    setCustomValue("");
    setShowCustom(false);
  }

  return (
    <article className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
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

      <div className="mb-5 h-4 overflow-hidden rounded-full bg-orange-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

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
          onClick={() => setShowCustom((open) => !open)}
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
            placeholder="Amount"
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

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Contributions
        </p>
        <ul className="space-y-1">
          {contributions.length === 0 ? (
            <li className="text-sm text-slate-400">No contributions yet</li>
          ) : (
            contributions.map(([member, amount]) => (
              <li
                key={member}
                className={`flex justify-between text-sm ${
                  member === currentUser ? "font-semibold text-orange-700" : "text-slate-600"
                }`}
              >
                <span>{member}</span>
                <span>{amount.toLocaleString()}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </article>
  );
}
