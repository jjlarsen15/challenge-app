"use client";

import { useState } from "react";
import { durationToSeconds } from "@/lib/utils";

type SetTimerFormProps = {
  initialHours: number;
  initialMinutes: number;
  onClose: () => void;
  onSave: (durationSeconds: number) => void;
};

function SetTimerForm({
  initialHours,
  initialMinutes,
  onClose,
  onSave,
}: SetTimerFormProps) {
  const [hours, setHours] = useState(String(initialHours));
  const [minutes, setMinutes] = useState(String(initialMinutes));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsedHours = Math.max(0, Number(hours) || 0);
    const parsedMinutes = Math.min(59, Math.max(0, Number(minutes) || 0));
    const totalSeconds = durationToSeconds(parsedHours, parsedMinutes);

    if (totalSeconds <= 0) return;

    onSave(totalSeconds);
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Hours</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            placeholder="12"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Minutes</span>
          <input
            type="number"
            min={0}
            max={59}
            inputMode="numeric"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            placeholder="30"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
            required
          />
        </label>
      </div>

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
          Save Timer
        </button>
      </div>
    </form>
  );
}

type SetTimerModalProps = {
  open: boolean;
  initialHours?: number;
  initialMinutes?: number;
  onClose: () => void;
  onSave: (durationSeconds: number) => void;
};

export function SetTimerModal({
  open,
  initialHours = 0,
  initialMinutes = 0,
  onClose,
  onSave,
}: SetTimerModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-900">Set Timer</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose how long the challenge runs. The countdown starts when you press Start.
        </p>

        <SetTimerForm
          key={`${initialHours}-${initialMinutes}`}
          initialHours={initialHours}
          initialMinutes={initialMinutes}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
