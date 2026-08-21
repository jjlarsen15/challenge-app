"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CategoryCard } from "@/components/CategoryCard";
import { CategoryFormModal } from "@/components/CategoryFormModal";
import { ChallengeCard } from "@/components/ChallengeCard";
import { ChallengeFormModal } from "@/components/ChallengeFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MemberList } from "@/components/MemberList";
import { RoomTimerSection } from "@/components/RoomTimer";
import { useRoom } from "@/lib/use-room";
import type { CategoryWithStats, ChallengeWithProgress } from "@/lib/types";

type RoomViewProps = {
  code: string;
};

export function RoomView({ code }: RoomViewProps) {
  const {
    room,
    members,
    categories,
    challenges,
    timer,
    currentMemberId,
    isAdmin,
    loading,
    error,
    addCategory,
    renameCategory,
    deleteCategory,
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

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);

  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<ChallengeWithProgress | undefined>();

  const [categoryFormMode, setCategoryFormMode] = useState<"add" | "rename">("add");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [renamingCategory, setRenamingCategory] = useState<CategoryWithStats | undefined>();

  const [deleteChallengeId, setDeleteChallengeId] = useState<string | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<CategoryWithStats | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  const categoryChallenges = useMemo(
    () =>
      selectedCategoryId
        ? challenges.filter((c) => c.categoryId === selectedCategoryId)
        : [],
    [challenges, selectedCategoryId],
  );

  async function handleAddProgress(challengeId: string, amount: number) {
    setActionError(null);
    await addContribution(challengeId, amount);
  }

  async function handleSaveChallenge(data: {
    name: string;
    goal: number;
    unit: string;
    categoryId: string;
  }) {
    setActionError(null);
    if (formMode === "add") {
      await addChallenge(data);
    } else if (editingChallenge) {
      await editChallenge(editingChallenge.id, data);
    }
  }

  async function handleDeleteChallenge() {
    if (!deleteChallengeId) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteChallenge(deleteChallengeId);
      setDeleteChallengeId(null);
      setActionError(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete challenge");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleSaveCategory(name: string) {
    try {
      setActionError(null);
      if (categoryFormMode === "add") {
        await addCategory(name);
      } else if (renamingCategory) {
        await renameCategory(renamingCategory.id, name);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save location");
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCategoryTarget) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteCategory(deleteCategoryTarget.id);
      if (selectedCategoryId === deleteCategoryTarget.id) {
        setSelectedCategoryId(null);
      }
      setDeleteCategoryTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete location");
    } finally {
      setDeleteBusy(false);
    }
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
      <div className="mx-auto w-full max-w-md px-3 py-4 pb-8 sm:px-4 sm:py-6">
        <Link
          href="/"
          className="mb-3 inline-flex text-sm font-medium text-orange-700 hover:text-orange-800"
        >
          ← Back home
        </Link>

        {actionError && (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {actionError}
          </div>
        )}

        <header className="rounded-xl bg-white p-3 shadow-sm sm:p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
            Challenge
          </p>
          <h1 className="mt-0.5 text-xl font-bold text-slate-900 sm:text-2xl">{room.name}</h1>

          <RoomTimerSection
            timer={timer}
            isAdmin={isAdmin}
            onSetDuration={setTimerDuration}
            onStart={startTimer}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onReset={resetTimer}
          />

          <div className="mt-3 flex items-center justify-between rounded-xl bg-orange-50 px-3 py-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Join code
              </p>
              <p className="font-mono text-base font-bold text-slate-900">{code}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowMembers((open) => !open)}
              className="rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-left"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Members
              </p>
              <p className="text-base font-bold text-slate-900">
                {members.length} {showMembers ? "▾" : "▸"}
              </p>
            </button>
          </div>

          {showMembers && (
            <MemberList
              members={members}
              adminUserId={room.admin_user_id}
              isAdmin={isAdmin}
              onGenerateRejoinCode={generateMemberRejoinCode}
            />
          )}
        </header>

        {!selectedCategory ? (
          <section className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Locations</h2>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFormMode("add");
                    setRenamingCategory(undefined);
                    setShowCategoryForm(true);
                  }}
                  className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-orange-600"
                >
                  + Add
                </button>
              )}
            </div>

            {categories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-orange-200 bg-white px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-600">
                  No locations yet.
                  {isAdmin ? " Add a location like Climbing Gym or Park." : ""}
                </p>
              </div>
            ) : (
              categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isAdmin={isAdmin}
                  onOpen={setSelectedCategoryId}
                  onRename={(cat) => {
                    setCategoryFormMode("rename");
                    setRenamingCategory(cat);
                    setShowCategoryForm(true);
                  }}
                  onDelete={setDeleteCategoryTarget}
                />
              ))
            )}
          </section>
        ) : (
          <section className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className="inline-flex text-sm font-medium text-orange-700 hover:text-orange-800"
            >
              ← Back to Locations
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedCategory.name}</h2>
                <p className="text-sm text-slate-600">
                  {selectedCategory.completedCount} / {selectedCategory.challengeCount} complete
                </p>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setFormMode("add");
                    setEditingChallenge(undefined);
                    setShowFormModal(true);
                  }}
                  className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-bold text-white hover:bg-orange-600"
                >
                  + Challenge
                </button>
              )}
            </div>

            {categoryChallenges.length === 0 ? (
              <div className="rounded-xl border border-dashed border-orange-200 bg-white px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-600">
                  No challenges yet.
                  {isAdmin ? " Add your first challenge here." : ""}
                </p>
              </div>
            ) : (
              categoryChallenges.map((challenge) => (
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
                  onDelete={(id) => {
                    setDeleteError(null);
                    setDeleteChallengeId(id);
                  }}
                />
              ))
            )}
          </section>
        )}
      </div>

      <ChallengeFormModal
        open={showFormModal}
        mode={formMode}
        challenge={editingChallenge}
        categories={categories}
        defaultCategoryId={selectedCategoryId ?? undefined}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveChallenge}
      />

      <CategoryFormModal
        open={showCategoryForm}
        mode={categoryFormMode}
        initialName={renamingCategory?.name}
        onClose={() => setShowCategoryForm(false)}
        onSave={handleSaveCategory}
      />

      <ConfirmDialog
        open={deleteChallengeId !== null}
        title="Delete challenge?"
        message="This will permanently remove the challenge and all of its contributions."
        confirmLabel="Delete"
        busy={deleteBusy}
        error={deleteError}
        onConfirm={handleDeleteChallenge}
        onCancel={() => {
          if (!deleteBusy) {
            setDeleteChallengeId(null);
            setDeleteError(null);
          }
        }}
      />

      <ConfirmDialog
        open={deleteCategoryTarget !== null}
        title="Delete location?"
        message={
          deleteCategoryTarget
            ? `Delete ${deleteCategoryTarget.name} and all ${deleteCategoryTarget.challengeCount} challenge${deleteCategoryTarget.challengeCount === 1 ? "" : "s"} inside it?`
            : ""
        }
        confirmLabel="Delete"
        busy={deleteBusy}
        error={deleteError}
        onConfirm={handleDeleteCategory}
        onCancel={() => {
          if (!deleteBusy) {
            setDeleteCategoryTarget(null);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
}
