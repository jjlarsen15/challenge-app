"use client";

import { useEffect, useState } from "react";
import { SetTimerModal } from "@/components/SetTimerModal";
import type { RoomTimer } from "@/lib/types";
import { formatCountdown } from "@/lib/utils";

type RoomTimerProps = {
  timer: RoomTimer | null;
  onSetDuration: (durationSeconds: number) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onTick: () => void;
};

export function RoomTimerSection({
  timer,
  onSetDuration,
  onStart,
  onPause,
  onResume,
  onReset,
  onTick,
}: RoomTimerProps) {
  const [showSetModal, setShowSetModal] = useState(false);

  const isRunning = timer?.status === "running";

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(onTick, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, onTick]);

  const canChangeDuration = timer?.status === "ready";

  const initialHours = timer ? Math.floor(timer.durationSeconds / 3600) : 0;
  const initialMinutes = timer
    ? Math.floor((timer.durationSeconds % 3600) / 60)
    : 0;

  return (
    <div className="mt-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        Timer
      </p>

      {!timer && (
        <div className="mt-2 space-y-3">
          <p className="text-lg font-medium text-slate-500">Timer not started</p>
          <button
            type="button"
            onClick={() => setShowSetModal(true)}
            className="rounded-xl bg-orange-500 px-5 py-3 text-base font-bold text-white hover:bg-orange-600"
          >
            Set Timer
          </button>
        </div>
      )}

      {timer && timer.status === "finished" && (
        <div className="mt-2 space-y-3">
          <p className="text-3xl font-bold tracking-tight text-rose-600">
            Challenge Over
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setShowSetModal(true)}
              className="rounded-xl bg-orange-500 px-4 py-3 text-base font-bold text-white hover:bg-orange-600"
            >
              Set Timer
            </button>
          </div>
        </div>
      )}

      {timer && timer.status !== "finished" && (
        <div className="mt-2 space-y-3">
          <p className="font-mono text-4xl font-bold tracking-wider text-slate-900 sm:text-5xl">
            {formatCountdown(timer.secondsRemaining)}
          </p>

          {timer.status === "ready" && (
            <p className="text-sm font-medium text-emerald-600">Ready to start</p>
          )}

          {timer.status === "paused" && (
            <p className="text-sm font-medium text-amber-600">Paused</p>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            {timer.status === "ready" && (
              <button
                type="button"
                onClick={onStart}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-base font-bold text-white hover:bg-emerald-700"
              >
                Start Timer
              </button>
            )}

            {timer.status === "running" && (
              <button
                type="button"
                onClick={onPause}
                className="rounded-xl bg-amber-500 px-5 py-3 text-base font-bold text-white hover:bg-amber-600"
              >
                Pause
              </button>
            )}

            {timer.status === "paused" && (
              <button
                type="button"
                onClick={onResume}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-base font-bold text-white hover:bg-emerald-700"
              >
                Resume
              </button>
            )}

            {(timer.status === "running" || timer.status === "paused") && (
              <button
                type="button"
                onClick={onReset}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
            )}

            {canChangeDuration && (
              <button
                type="button"
                onClick={() => setShowSetModal(true)}
                className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 text-base font-semibold text-orange-700 hover:bg-orange-100"
              >
                Change Duration
              </button>
            )}
          </div>
        </div>
      )}

      <SetTimerModal
        open={showSetModal}
        initialHours={initialHours}
        initialMinutes={initialMinutes}
        onClose={() => setShowSetModal(false)}
        onSave={onSetDuration}
      />
    </div>
  );
}
