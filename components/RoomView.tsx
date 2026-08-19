"use client";

import Link from "next/link";
import { useState } from "react";
import { ChallengeCard } from "@/components/ChallengeCard";
import { ChallengeFormModal } from "@/components/ChallengeFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MemberList } from "@/components/MemberList";
import { RoomTimerSection } from "@/components/RoomTimer";
import { useRoom } from "@/lib/use-room";
import type { ChallengeWithProgress } from "@/lib/types";

type RoomViewProps = {
  code: string;
};

export function RoomView({ code }: RoomViewProps) {
  const {
    room,
    members,
    challenges,
    timer,
    currentMemberId,
    isAdmin,
    loading,
    error,
    addChallenge,
    editChallenge,
    deleteChallenge,
    generateMemberRejoinCode,
    addContribution,
    setTimerDuration,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  } = useRoom(code);

  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<ChallengeWithProgress | undefined>();
  const [deleteChallengeId, setDeleteChallengeId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleAddProgress(challengeId: string, amount: number) {
    try {
      setActionError(null);
      await addContribution(challengeId, amount);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add progress");
    }
  }

  async function handleSaveChallenge(data: { name: string; goal: number; unit: string }) {
    try {
      setActionError(null);
      if (formMode === "add") {
        await addChallenge(data);
      } else if (editingChallenge) {
        await editChallenge(editingChallenge.id, data);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save challenge");
    }
  }

  async function handleDeleteChallenge() {
    if (!deleteChallengeId) return;
    try {
      setActionError(null);
      await deleteChallenge(deleteChallengeId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete challenge");
    }
    setDeleteChallengeId(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-gradient-to-b from-orange-50 to-amber-50">
        <p className="text-lg font-medium text-slate-500">Loading room...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-orange-50 to-amber-50 px-4">
        <p className="text-xl font-bold text-slate-900">Room not found</p>
        <p className="text-base text-slate-600">{error ?? "This room does not exist."}</p>
        <Link
          href="/"
          className="rounded-xl bg-orange-500 px-5 py-3 text-base font-bold text-white hover:bg-orange-600"
        >
          ← Back home
        </Link>
      </div>
    );
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

        {actionError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {actionError}
          </div>
        )}

        <header className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Challenge
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{room.name}</h1>

          <RoomTimerSection
            timer={timer}
            isAdmin={isAdmin}
            onSetDuration={setTimerDuration}
            onStart={startTimer}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onReset={resetTimer}
          />

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
              <p className="text-lg font-bold text-slate-900">{members.length}</p>
            </div>
          </div>

          <MemberList
            members={members}
            adminUserId={room.admin_user_id}
            isAdmin={isAdmin}
            onGenerateRejoinCode={generateMemberRejoinCode}
          />
        </header>

        <section className="mt-6 space-y-4">
          {challenges.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-white px-5 py-10 text-center">
              <p className="text-base font-medium text-slate-600">
                No challenges yet.{isAdmin ? " Add your first challenge." : ""}
              </p>
            </div>
          ) : (
            challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isAdmin={isAdmin}
                hasMembership={!!currentMemberId}
                onAddProgress={handleAddProgress}
                onEdit={(ch) => {
                  setFormMode("edit");
                  setEditingChallenge(ch);
                  setShowFormModal(true);
                }}
                onDelete={setDeleteChallengeId}
              />
            ))
          )}
        </section>

        {isAdmin && (
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
        )}
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
