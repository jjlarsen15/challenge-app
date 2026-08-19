"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ChallengeCard } from "@/components/ChallengeCard";
import { ChallengeFormModal } from "@/components/ChallengeFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RoomTimerSection } from "@/components/RoomTimer";
import { createEmptyRoom, loadRoomData, saveRoomData } from "@/lib/room-storage";
import type { Challenge, RoomData } from "@/lib/types";
import { applyProgressChange } from "@/lib/utils";

type RoomViewProps = {
  code: string;
};

function getInitialRoomData(code: string): RoomData {
  const existing = loadRoomData(code);
  if (existing) return existing;

  const empty = createEmptyRoom({ roomName: "Challenge Room", userName: "Guest" });
  saveRoomData(code, empty);
  return empty;
}

export function RoomView({ code }: RoomViewProps) {
  const [roomData, setRoomData] = useState<RoomData>(() => getInitialRoomData(code));
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | undefined>();
  const [deleteChallengeId, setDeleteChallengeId] = useState<string | null>(null);

  const persist = useCallback(
    (updater: (current: RoomData) => RoomData) => {
      setRoomData((current) => {
        const next = updater(current);
        saveRoomData(code, next);
        return next;
      });
    },
    [code],
  );

  function handleAddProgress(challengeId: string, amount: number) {
    persist((current) => ({
      ...current,
      challenges: current.challenges.map((challenge) =>
        challenge.id === challengeId
          ? applyProgressChange(challenge, amount)
          : challenge,
      ),
    }));
  }

  function handleSaveChallenge(data: { name: string; goal: number; unit: string }) {
    if (formMode === "add") {
      const newChallenge: Challenge = {
        id: `challenge-${Date.now()}`,
        name: data.name,
        goal: data.goal,
        unit: data.unit,
        progress: 0,
      };
      persist((current) => ({
        ...current,
        challenges: [...current.challenges, newChallenge],
      }));
      return;
    }

    if (!editingChallenge) return;

    persist((current) => ({
      ...current,
      challenges: current.challenges.map((challenge) =>
        challenge.id === editingChallenge.id
          ? {
              ...challenge,
              name: data.name,
              goal: data.goal,
              unit: data.unit,
              progress: Math.min(challenge.progress, data.goal),
            }
          : challenge,
      ),
    }));
  }

  function handleDeleteChallenge() {
    if (!deleteChallengeId) return;

    persist((current) => ({
      ...current,
      challenges: current.challenges.filter(
        (challenge) => challenge.id !== deleteChallengeId,
      ),
    }));
    setDeleteChallengeId(null);
  }

  function handleSetDuration(durationSeconds: number) {
    persist((current) => ({
      ...current,
      timer: {
        durationSeconds,
        secondsRemaining: durationSeconds,
        status: "ready",
      },
    }));
  }

  function handleStartTimer() {
    persist((current) => {
      if (!current.timer) return current;
      return {
        ...current,
        timer: { ...current.timer, status: "running" },
      };
    });
  }

  function handlePauseTimer() {
    persist((current) => {
      if (!current.timer) return current;
      return {
        ...current,
        timer: { ...current.timer, status: "paused" },
      };
    });
  }

  function handleResumeTimer() {
    persist((current) => {
      if (!current.timer) return current;
      return {
        ...current,
        timer: { ...current.timer, status: "running" },
      };
    });
  }

  function handleResetTimer() {
    persist((current) => {
      if (!current.timer) return current;
      return {
        ...current,
        timer: {
          ...current.timer,
          secondsRemaining: current.timer.durationSeconds,
          status: "ready",
        },
      };
    });
  }

  const handleTick = useCallback(() => {
    persist((current) => {
      if (!current.timer || current.timer.status !== "running") return current;

      const nextRemaining = current.timer.secondsRemaining - 1;
      if (nextRemaining <= 0) {
        return {
          ...current,
          timer: {
            ...current.timer,
            secondsRemaining: 0,
            status: "finished",
          },
        };
      }

      return {
        ...current,
        timer: {
          ...current.timer,
          secondsRemaining: nextRemaining,
        },
      };
    });
  }, [persist]);

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
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{roomData.roomName}</h1>

          <RoomTimerSection
            timer={roomData.timer}
            onSetDuration={handleSetDuration}
            onStart={handleStartTimer}
            onPause={handlePauseTimer}
            onResume={handleResumeTimer}
            onReset={handleResetTimer}
            onTick={handleTick}
          />

          <div className="mt-5 rounded-xl bg-orange-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Join code
            </p>
            <p className="font-mono text-lg font-bold text-slate-900">{code}</p>
          </div>
        </header>

        <section className="mt-6 space-y-4">
          {roomData.challenges.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-5 py-10 text-center">
              <p className="text-base font-medium text-slate-600">
                No challenges yet. Add your first challenge.
              </p>
            </div>
          ) : (
            roomData.challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onAddProgress={handleAddProgress}
                onEdit={(challengeToEdit) => {
                  setFormMode("edit");
                  setEditingChallenge(challengeToEdit);
                  setShowFormModal(true);
                }}
                onDelete={setDeleteChallengeId}
              />
            ))
          )}
        </section>

        <button
          type="button"
          onClick={() => {
            setFormMode("add");
            setEditingChallenge(undefined);
            setShowFormModal(true);
          }}
          className="mt-6 w-full rounded-2xl border-2 border-dashed border-orange-300 bg-white px-4 py-4 text-lg font-bold text-orange-700 transition hover:border-orange-400 hover:bg-orange-50 active:scale-[0.99]"
        >
          + Add Challenge
        </button>
      </div>

      <ChallengeFormModal
        open={showFormModal}
        mode={formMode}
        challenge={editingChallenge}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveChallenge}
      />

      <ConfirmDialog
        open={deleteChallengeId !== null}
        title="Delete challenge?"
        message="This will permanently remove the challenge and its progress from this room."
        confirmLabel="Delete"
        onConfirm={handleDeleteChallenge}
        onCancel={() => setDeleteChallengeId(null)}
      />
    </div>
  );
}
