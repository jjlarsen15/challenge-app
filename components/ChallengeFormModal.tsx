"use client";

import { useState } from "react";
import type { Challenge } from "@/lib/types";

type ChallengeFormFieldsProps = {
  mode: "add" | "edit";
  challenge?: Challenge;
  onClose: () => void;
  onSave: (data: { name: string; goal: number; unit: string }) => void;
};

function ChallengeFormFields({
  mode,
  challenge,
  onClose,
  onSave,
}: ChallengeFormFieldsProps) {
  const [name, setName] = useState(challenge?.name ?? "");
  const [goal, setGoal] = useState(challenge ? String(challenge.goal) : "");
  const [unit, setUnit] = useState(challenge?.unit ?? "");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsedGoal = Number(goal);
    if (!name.trim() || !unit.trim() || !Number.isFinite(parsedGoal) || parsedGoal <= 0) {
      return;
    }

    onSave({
      name: name.trim(),
      goal: parsedGoal,
      unit: unit.trim(),
    });
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Challenge name
        </span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. 1,000 Pushups"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Goal</span>
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
        <span className="mb-1 block text-sm font-medium text-slate-700">Unit</span>
        <input
          type="text"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          placeholder="e.g. pushups, pages, wins"
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
          {mode === "add" ? "Add Challenge" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

type ChallengeFormModalProps = {
  open: boolean;
  mode: "add" | "edit";
  challenge?: Challenge;
  onClose: () => void;
  onSave: (data: { name: string; goal: number; unit: string }) => void;
};

export function ChallengeFormModal({
  open,
  mode,
  challenge,
  onClose,
  onSave,
}: ChallengeFormModalProps) {
  if (!open) return null;

  const formKey = mode === "edit" ? challenge?.id ?? "edit" : "add";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900">
          {mode === "add" ? "Add Challenge" : "Edit Challenge"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "add"
            ? "Create a numeric goal challenge for the group."
            : "Update the challenge details."}
        </p>

        <ChallengeFormFields
          key={formKey}
          mode={mode}
          challenge={challenge}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
