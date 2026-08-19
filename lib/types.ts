export type Challenge = {
  id: string;
  name: string;
  goal: number;
  unit: string;
  progress: number;
};

export type RoomSession = {
  roomName: string;
  userName: string;
};

export type TimerStatus = "unset" | "ready" | "running" | "paused" | "finished";

export type RoomTimer = {
  durationSeconds: number;
  secondsRemaining: number;
  status: TimerStatus;
};

export type RoomData = {
  roomName: string;
  challenges: Challenge[];
  timer: RoomTimer | null;
};
