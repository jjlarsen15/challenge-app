import type { DbRoom, RoomTimer, TimerStatus } from "./types";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REJOIN_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ2345679";

export function generateRejoinCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += REJOIN_CODE_CHARS[Math.floor(Math.random() * REJOIN_CODE_CHARS.length)];
  }
  return code;
}

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export function formatPercent(progress: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((progress / goal) * 100));
}

export function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function durationToSeconds(hours: number, minutes: number): number {
  return hours * 3600 + minutes * 60;
}

export function deriveTimerState(room: DbRoom): RoomTimer | null {
  const { timer_duration_seconds, timer_started_at, timer_paused_remaining_seconds } = room;

  if (!timer_duration_seconds) return null;

  if (timer_paused_remaining_seconds !== null) {
    const status: TimerStatus = timer_paused_remaining_seconds <= 0 ? "finished" : "paused";
    return {
      durationSeconds: timer_duration_seconds,
      secondsRemaining: Math.max(0, timer_paused_remaining_seconds),
      status,
      startedAt: null,
    };
  }

  if (timer_started_at) {
    const startMs = new Date(timer_started_at).getTime();
    const elapsed = Math.floor((Date.now() - startMs) / 1000);
    const remaining = timer_duration_seconds - elapsed;

    if (remaining <= 0) {
      return {
        durationSeconds: timer_duration_seconds,
        secondsRemaining: 0,
        status: "finished",
        startedAt: timer_started_at,
      };
    }

    return {
      durationSeconds: timer_duration_seconds,
      secondsRemaining: remaining,
      status: "running",
      startedAt: timer_started_at,
    };
  }

  return {
    durationSeconds: timer_duration_seconds,
    secondsRemaining: timer_duration_seconds,
    status: "ready",
    startedAt: null,
  };
}
