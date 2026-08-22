"use client";

import { useState } from "react";

type CategoryFormModalProps = {
  open: boolean;
  mode: "add" | "rename";
  initialName?: string;
  onClose: () => void;
  onSave: (name: string) => void;
};

export function CategoryFormModal({
  open,
  mode,
  initialName = "",
  onClose,
  onSave,
}: CategoryFormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-ink">
          {mode === "add" ? "Add Stage" : "Rename Stage"}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Stages are stops on the adventure route (e.g. Climbing Gym, Park).
        </p>
        <CategoryFormFields
          key={`${mode}-${initialName}`}
          mode={mode}
          initialName={initialName}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

function CategoryFormFields({
  mode,
  initialName,
  onClose,
  onSave,
}: {
  mode: "add" | "rename";
  initialName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Name</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Climbing Gym"
          className="w-full rounded-xl border border-sand-200 px-4 py-3 text-base outline-none focus:border-ember focus:ring-2 focus:ring-ember/20"
          required
          autoFocus
        />
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-sand-200 px-4 py-3 text-base font-semibold text-ink-muted hover:bg-sand-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl bg-ember px-4 py-3 text-base font-bold text-white hover:bg-ember-dark"
        >
          {mode === "add" ? "Add Stage" : "Save"}
        </button>
      </div>
    </form>
  );
}
