import type { RoomData, RoomSession } from "./types";

export const ROOM_DATA_KEY = "challenge-room-data";

export function createEmptyRoom(session: RoomSession): RoomData {
  return {
    roomName: session.roomName,
    challenges: [],
    timer: null,
  };
}

export function loadRoomData(code: string): RoomData | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(`${ROOM_DATA_KEY}:${code}`);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as RoomData;
  } catch {
    return null;
  }
}

export function saveRoomData(code: string, data: RoomData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${ROOM_DATA_KEY}:${code}`, JSON.stringify(data));
}

export function initRoom(code: string, session: RoomSession, isNewRoom: boolean): RoomData {
  if (isNewRoom) {
    const data = createEmptyRoom(session);
    saveRoomData(code, data);
    return data;
  }

  const existing = loadRoomData(code);
  if (existing) return existing;

  const data = createEmptyRoom(session);
  saveRoomData(code, data);
  return data;
}
