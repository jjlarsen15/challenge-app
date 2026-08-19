export type DbRoom = {
  id: string;
  code: string;
  name: string;
  admin_user_id: string;
  timer_duration_seconds: number | null;
  timer_started_at: string | null;
  timer_paused_remaining_seconds: number | null;
  created_at: string;
};

export type DbMember = {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  rejoin_code: string | null;
  rejoin_code_expires_at: string | null;
  created_at: string;
};

export type DbChallenge = {
  id: string;
  room_id: string;
  name: string;
  goal: number;
  unit: string;
  created_at: string;
};

export type DbContribution = {
  id: string;
  challenge_id: string;
  member_id: string;
  amount: number;
  created_at: string;
};

export type TimerStatus = "unset" | "ready" | "running" | "paused" | "finished";

export type RoomTimer = {
  durationSeconds: number;
  secondsRemaining: number;
  status: TimerStatus;
  startedAt: string | null;
};

export type ChallengeWithProgress = {
  id: string;
  name: string;
  goal: number;
  unit: string;
  progress: number;
  memberContributions: { memberId: string; displayName: string; amount: number }[];
};
