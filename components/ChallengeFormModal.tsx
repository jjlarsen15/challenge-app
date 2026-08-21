"use client";

import { useState } from "react";
import type { CategoryWithStats, ChallengeWithProgress } from "@/lib/types";

type ChallengeFormData = {
  name: string;
  goal: number;
  unit: string;
  categoryId: string;
};

type ChallengeFormFieldsProps = {
  mode: "add" | "edit";
  challenge?: ChallengeWithProgress;
  categories: CategoryWithStats[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSave: (data: ChallengeFormData) => void | Promise<void>;
};

function ChallengeFormFields({
  mode,
  challenge,
  categories,
  defaultCategoryId,
  onClose,
  onSave,
}: ChallengeFormFieldsProps) {
  const [name, setName] = useState(challenge?.name ?? "");
  const [goal, setGoal] = useState(challenge ? String(challenge.goal) : "");
  const [unit, setUnit] = useState(challenge?.unit ?? "");
  const [categoryId, setCategoryId] = useState(
    challenge?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsedGoal = Number(goal);
    if (
      !name.trim() ||
      !unit.trim() ||
      !categoryId ||
      !Number.isFinite(parsedGoal) ||
      parsedGoal <= 0
    ) {
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await onSave({
        name: name.trim(),
        goal: parsedGoal,
        unit: unit.trim(),
        categoryId,
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save challenge");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
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
        <span className="mb-1 block text-sm font-medium text-slate-700">Location</span>
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
          required
        >
          {categories.length === 0 && <option value="">No locations yet</option>}
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
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
            placeholder="pushups"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
            required
          />
        </label>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!categoryId || saving}
          className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-base font-bold text-white hover:bg-orange-600 disabled:opacity-40"
        >
          {saving
            ? "Saving..."
            : mode === "add"
              ? "Add Challenge"
              : "Save Changes"}
        </button>
      </div>
      {formError && (
        <p className="text-sm font-medium text-rose-600">{formError}</p>
      )}
    </form>
  );
}

type ChallengeFormModalProps = {
  open: boolean;
  mode: "add" | "edit";
  challenge?: ChallengeWithProgress;
  categories: CategoryWithStats[];
  defaultCategoryId?: string;
  onClose: () => void;
  onSave: (data: ChallengeFormData) => void | Promise<void>;
};

export function ChallengeFormModal({
  open,
  mode,
  challenge,
  categories,
  defaultCategoryId,
  onClose,
  onSave,
}: ChallengeFormModalProps) {
  if (!open) return null;

  const formKey = mode === "edit" ? challenge?.id ?? "edit" : `add-${defaultCategoryId ?? "none"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-slate-900">
          {mode === "add" ? "Add Challenge" : "Edit Challenge"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "add"
            ? "Create a numeric goal challenge for a location."
            : "Update the challenge details."}
        </p>

        <ChallengeFormFields
          key={formKey}
          mode={mode}
          challenge={challenge}
          categories={categories}
          defaultCategoryId={defaultCategoryId}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
