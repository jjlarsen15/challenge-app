"use client";

import { useEffect, useReducer, useRef } from "react";
import type { RoomTimer } from "@/lib/types";

function computeRemaining(timer: RoomTimer): number {
  if (timer.status === "running" && timer.startedAt) {
    const elapsed = Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000);
    return Math.max(0, timer.durationSeconds - elapsed);
  }
  return timer.secondsRemaining;
}

/** Ticks once per second while the room timer is running. */
export function useLiveCountdown(timer: RoomTimer | null): number {
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

export function isTimerExpired(timer: RoomTimer | null, liveSeconds: number): boolean {
  if (!timer) return false;
  if (timer.status === "finished") return true;
  if (timer.status === "running" && liveSeconds <= 0) return true;
  return false;
}
