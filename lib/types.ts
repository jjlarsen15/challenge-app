export type Challenge = {
  id: string;
  name: string;
  goal: number;
  unit: string;
  progress: number;
  contributions: Record<string, number>;
};

export type RoomSession = {
  roomName: string;
  userName: string;
};
