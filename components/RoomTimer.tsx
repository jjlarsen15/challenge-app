"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { SetTimerModal } from "@/components/SetTimerModal";
import type { RoomTimer } from "@/lib/types";
import { formatCountdown } from "@/lib/utils";

function computeRemaining(timer: RoomTimer): number {
  if (timer.status === "running" && timer.startedAt) {
    const elapsed = Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000);
    return Math.max(0, timer.durationSeconds - elapsed);
  }
  return timer.secondsRemaining;
}

function useLiveCountdown(timer: RoomTimer | null): number {
  const [, tick] = useReducer((c: number) => c + 1, 0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunning = timer?.status === "running";

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;

    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  if (!timer) return 0;
  return computeRemaining(timer);
}

type RoomTimerProps = {
  timer: RoomTimer | null;
  isAdmin: boolean;
  showSetupControls?: boolean;
  onSetDuration: (durationSeconds: number) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
};

export function RoomTimerSection({
  timer,
  isAdmin,
  showSetupControls = true,
  onSetDuration,
  onStart,
  onPause,
  onResume,
  onReset,
}: RoomTimerProps) {
  const [showSetModal, setShowSetModal] = useState(false);
  const displaySeconds = useLiveCountdown(timer);

  const canChangeDuration = timer?.status === "ready" && showSetupControls;
  const initialHours = timer ? Math.floor(timer.durationSeconds / 3600) : 0;
  const initialMinutes = timer ? Math.floor((timer.durationSeconds % 3600) / 60) : 0;

  return (
    <div className="mt-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
        Timer
      </p>

      {!timer && (
        <div className="mt-1.5 space-y-2">
          <p className="text-base font-medium text-ink-muted">Timer not set</p>
          {isAdmin && showSetupControls && (
            <button
              type="button"
              onClick={() => setShowSetModal(true)}
              className="rounded-xl bg-pine px-4 py-2.5 text-sm font-bold text-white hover:bg-pine/90"
            >
              Set Timer
            </button>
          )}
        </div>
      )}

      {timer && timer.status === "finished" && (
        <div className="mt-1.5 space-y-2">
          <p className="text-2xl font-bold tracking-tight text-rose-600">Time&apos;s Up</p>
          {isAdmin && showSetupControls && (
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={onReset}
                className="rounded-xl border border-sand-200 bg-white px-3 py-2 text-sm font-semibold text-ink-muted hover:bg-sand-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setShowSetModal(true)}
                className="rounded-xl bg-pine px-3 py-2 text-sm font-bold text-white hover:bg-pine/90"
              >
                Set Timer
              </button>
            </div>
          )}
        </div>
      )}

      {timer && timer.status !== "finished" && (
        <div className="mt-1.5 space-y-2">
          <p className="font-mono text-3xl font-bold tracking-wider text-ink sm:text-4xl">
            {formatCountdown(displaySeconds)}
          </p>

          {timer.status === "ready" && (
            <p className="text-xs font-medium text-pine">Ready to start</p>
          )}

          {timer.status === "paused" && (
            <p className="text-xs font-medium text-amber-700">Paused</p>
          )}

          {isAdmin && (
            <div className="flex flex-wrap justify-center gap-2">
              {timer.status === "ready" && (
                <button
                  type="button"
                  onClick={onStart}
                  className="rounded-xl bg-pine px-4 py-2.5 text-sm font-bold text-white hover:bg-pine/90"
                >
                  Start Timer
                </button>
              )}

              {timer.status === "running" && (
                <button
                  type="button"
                  onClick={onPause}
                  className="rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-800"
                >
                  Pause
                </button>
              )}

              {timer.status === "paused" && (
                <button
                  type="button"
                  onClick={onResume}
                  className="rounded-xl bg-pine px-4 py-2.5 text-sm font-bold text-white hover:bg-pine/90"
                >
                  Resume
                </button>
              )}

              {(timer.status === "running" || timer.status === "paused") &&
                showSetupControls && (
                  <button
                    type="button"
                    onClick={onReset}
                    className="rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm font-semibold text-ink-muted hover:bg-sand-50"
                  >
                    Reset
                  </button>
                )}

              {canChangeDuration && (
                <button
                  type="button"
                  onClick={() => setShowSetModal(true)}
                  className="rounded-xl border border-sand-200 bg-sand-50 px-3 py-2.5 text-sm font-semibold text-ink-muted hover:bg-sand-100"
                >
                  Change Duration
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isAdmin && showSetupControls && (
        <SetTimerModal
          open={showSetModal}
          initialHours={initialHours}
          initialMinutes={initialMinutes}
          onClose={() => setShowSetModal(false)}
          onSave={onSetDuration}
        />
      )}
    </div>
  );
}
