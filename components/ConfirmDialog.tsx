"use client";

import { useState } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  if (!open) return null;

  async function handleConfirm(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending || busy) return;
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  }

  const isBusy = pending || busy;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!isBusy) onCancel();
        }}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 whitespace-pre-line text-base text-slate-600">{message}</p>
        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={isBusy}
            onClick={(event) => {
              event.stopPropagation();
              onCancel();
            }}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-rose-600 px-4 py-3 text-base font-bold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {isBusy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
