"use client";

import { useState } from "react";

type AddChallengeModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (challenge: {
    name: string;
    goal: number;
    unit: string;
  }) => void;
};

export function AddChallengeModal({
  open,
  onClose,
  onAdd,
}: AddChallengeModalProps) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [unit, setUnit] = useState("");

  if (!open) return null;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsedGoal = Number(goal);
    if (!name.trim() || !unit.trim() || !Number.isFinite(parsedGoal) || parsedGoal <= 0) {
      return;
    }

    onAdd({
      name: name.trim(),
      goal: parsedGoal,
      unit: unit.trim(),
    });

    setName("");
    setGoal("");
    setUnit("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900">Add Challenge</h2>
        <p className="mt-1 text-sm text-slate-500">
          Create a numeric goal challenge for the group.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Challenge name
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. 500 Squats"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Goal
            </span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="1000"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              Unit
            </span>
            <input
              type="text"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              placeholder="e.g. squats, miles, pages"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              required
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-base font-bold text-white hover:bg-orange-600"
            >
              Add Challenge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
