import type { RoomSession } from "./types";
import { ROOM_SESSION_KEY } from "./utils";

export function saveRoomSession(code: string, session: RoomSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${ROOM_SESSION_KEY}:${code}`, JSON.stringify(session));
}

export function loadRoomSession(code: string): RoomSession | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(`${ROOM_SESSION_KEY}:${code}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as RoomSession;
  } catch {
    return null;
  }
}
