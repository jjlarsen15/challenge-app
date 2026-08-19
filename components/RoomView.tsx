"use client";

import Link from "next/link";
import { useSyncExternalStore, useState } from "react";
import { AddChallengeModal } from "@/components/AddChallengeModal";
import { ChallengeCard } from "@/components/ChallengeCard";
import { CountdownTimer } from "@/components/CountdownTimer";
import {
  CURRENT_USER,
  INITIAL_CHALLENGES,
  MOCK_MEMBERS,
  createEmptyContributions,
} from "@/lib/mock-data";
import { loadRoomSession } from "@/lib/room-session";
import type { Challenge } from "@/lib/types";
import { addChallengeProgress } from "@/lib/utils";

type RoomViewProps = {
  code: string;
};

function getRoomName(code: string): string {
  return loadRoomSession(code)?.roomName ?? "Challenge Room";
}

export function RoomView({ code }: RoomViewProps) {
  const roomName = useSyncExternalStore(
    () => () => {},
    () => getRoomName(code),
    () => "Challenge Room",
  );
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [showAddModal, setShowAddModal] = useState(false);

  function handleAddProgress(challengeId: string, amount: number) {
    setChallenges((current) =>
      current.map((challenge) =>
        challenge.id === challengeId
          ? addChallengeProgress(challenge, amount, CURRENT_USER)
          : challenge,
      ),
    );
  }

  function handleAddChallenge(data: {
    name: string;
    goal: number;
    unit: string;
  }) {
    const newChallenge: Challenge = {
      id: `challenge-${Date.now()}`,
      name: data.name,
      goal: data.goal,
      unit: data.unit,
      progress: 0,
      contributions: createEmptyContributions(),
    };

    setChallenges((current) => [...current, newChallenge]);
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-orange-50 to-amber-50">
      <div className="mx-auto w-full max-w-md px-4 py-6 pb-10">
        <Link
          href="/"
          className="mb-4 inline-flex text-sm font-medium text-orange-700 hover:text-orange-800"
        >
          ← Back home
        </Link>

        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Challenge
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{roomName}</h1>

          <div className="mt-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Time left
            </p>
            <div className="mt-2">
              <CountdownTimer />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-orange-50 px-4 py-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Join code
              </p>
              <p className="font-mono text-lg font-bold text-slate-900">{code}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Members
              </p>
              <p className="text-lg font-bold text-slate-900">{MOCK_MEMBERS.length}</p>
            </div>
          </div>
        </header>

        <section className="mt-6 space-y-4">
          {challenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              currentUser={CURRENT_USER}
              onAddProgress={handleAddProgress}
            />
          ))}
        </section>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="mt-6 w-full rounded-2xl border-2 border-dashed border-orange-300 bg-white px-4 py-4 text-lg font-bold text-orange-700 transition hover:border-orange-400 hover:bg-orange-50 active:scale-[0.99]"
        >
          + Add Challenge
        </button>
      </div>

      <AddChallengeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddChallenge}
      />
    </div>
  );
}
