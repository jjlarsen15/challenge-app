import type { Challenge } from "./types";

export const CURRENT_USER = "Josh";

export const MOCK_MEMBERS = [
  "Josh",
  "Jake",
  "Sam",
  "Ryan",
  "Caleb",
  "Ethan",
  "Luke",
] as const;

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: "pushups",
    name: "1,000 Pushups",
    goal: 1000,
    unit: "pushups",
    progress: 647,
    contributions: {
      Josh: 150,
      Jake: 130,
      Sam: 97,
      Ryan: 88,
      Caleb: 72,
      Ethan: 60,
      Luke: 50,
    },
  },
  {
    id: "puzzle",
    name: "1,000 Piece Puzzle",
    goal: 1000,
    unit: "pieces",
    progress: 430,
    contributions: {
      Josh: 95,
      Jake: 80,
      Sam: 70,
      Ryan: 65,
      Caleb: 55,
      Ethan: 40,
      Luke: 25,
    },
  },
  {
    id: "pages",
    name: "Write 20 Pages",
    goal: 20,
    unit: "pages",
    progress: 6,
    contributions: {
      Josh: 2,
      Jake: 1,
      Sam: 1,
      Ryan: 1,
      Caleb: 1,
      Ethan: 0,
      Luke: 0,
    },
  },
];

export function createEmptyContributions(): Record<string, number> {
  return Object.fromEntries(MOCK_MEMBERS.map((member) => [member, 0]));
}
