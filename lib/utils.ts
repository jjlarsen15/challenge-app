import type { Challenge } from "./types";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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

export function addChallengeProgress(
  challenge: Challenge,
  amount: number,
  userName: string,
): Challenge {
  const oldProgress = challenge.progress;
  const newProgress = Math.max(0, oldProgress + amount);
  const delta = newProgress - oldProgress;

  return {
    ...challenge,
    progress: newProgress,
    contributions: {
      ...challenge.contributions,
      [userName]: Math.max(0, (challenge.contributions[userName] ?? 0) + delta),
    },
  };
}

export function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export const ROOM_SESSION_KEY = "challenge-room-session";
