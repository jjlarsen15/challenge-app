"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdventureRoute } from "@/components/AdventureRoute";
import { CategoryFormModal } from "@/components/CategoryFormModal";
import { ChallengeCard } from "@/components/ChallengeCard";
import { ChallengeFormModal } from "@/components/ChallengeFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MemberList } from "@/components/MemberList";
import { PersonalTitlePanel } from "@/components/PersonalTitlePanel";
import { RoomTimerSection } from "@/components/RoomTimer";
import { TitleReveal } from "@/components/TitleReveal";
import { isAdventurerRarity } from "@/lib/adventurer-titles";
import { useRoom } from "@/lib/use-room";
import type { AdventurerRarity, CategoryWithStats, ChallengeWithProgress } from "@/lib/types";

type RoomViewProps = {
  code: string;
};

type PendingReveal = {
  title: string;
  rarity: AdventurerRarity;
  isReroll: boolean;
};

function isStageComplete(category: CategoryWithStats): boolean {
  return category.challengeCount > 0 && category.completedCount >= category.challengeCount;
}

function titleSeenKey(memberId: string): string {
  return `adventurer_title_seen:${memberId}`;
}

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
    rerollMemberTitle,
    rerollOwnTitle,
    addContribution,
    setTimerDuration,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  } = useRoom(code);

  // Adventure Mode is the default. Edit Mode reveals admin setup controls.
  const [editMode, setEditMode] = useState(false);
  const canEdit = isAdmin && editMode;

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [pendingReveal, setPendingReveal] = useState<PendingReveal | null>(null);
  const revealingTitleRef = useRef<string | null>(null);
  const [showPersonalRerollConfirm, setShowPersonalRerollConfirm] = useState(false);
  const [personalRerollBusy, setPersonalRerollBusy] = useState(false);
  const [personalRerollError, setPersonalRerollError] = useState<string | null>(null);

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

  const selectedStageIndex = useMemo(() => {
    if (!selectedCategoryId) return -1;
    return categories.findIndex((c) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  const categoryChallenges = useMemo(
    () =>
      selectedCategoryId
        ? challenges.filter((c) => c.categoryId === selectedCategoryId)
        : [],
    [challenges, selectedCategoryId],
  );

  const currentCategoryId = useMemo(() => {
    const incomplete = categories.find(
      (c) => c.challengeCount === 0 || c.completedCount < c.challengeCount,
    );
    return incomplete?.id ?? null;
  }, [categories]);

  const nextStageAfterSelected = useMemo(() => {
    if (!selectedCategory || selectedStageIndex < 0) return null;
    if (!isStageComplete(selectedCategory)) return null;
    return categories[selectedStageIndex + 1] ?? null;
  }, [categories, selectedCategory, selectedStageIndex]);

  const adventureSummary = useMemo(() => {
    const totalQuests = challenges.length;
    const completedQuests = challenges.filter(
      (c) => c.progress >= c.goal && c.goal > 0,
    ).length;
    const clearedLocations = categories.filter(isStageComplete).length;
    return {
      totalQuests,
      completedQuests,
      totalLocations: categories.length,
      clearedLocations,
    };
  }, [challenges, categories]);

  const currentMember = useMemo(
    () => members.find((m) => m.id === currentMemberId) ?? null,
    [members, currentMemberId],
  );

  // Show title reveal for first assignment or admin reroll on this device.
  useEffect(() => {
    if (!currentMember?.id || !currentMember.adventurer_title) return;
    if (!isAdventurerRarity(currentMember.adventurer_rarity)) return;

    const title = currentMember.adventurer_title;
    const rarity = currentMember.adventurer_rarity;
    const storageKey = titleSeenKey(currentMember.id);

    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(storageKey);
    } catch {
      stored = null;
    }

    if (stored === title) return;
    if (revealingTitleRef.current === title) return;

    revealingTitleRef.current = title;
    setPendingReveal({
      title,
      rarity,
      isReroll: stored !== null && stored !== title,
    });
  }, [currentMember]);

  function dismissTitleReveal() {
    if (!currentMember?.id || !pendingReveal) {
      setPendingReveal(null);
      return;
    }
    try {
      window.localStorage.setItem(titleSeenKey(currentMember.id), pendingReveal.title);
    } catch {
      // ignore storage failures
    }
    revealingTitleRef.current = pendingReveal.title;
    setPendingReveal(null);
  }

  async function handleConfirmPersonalReroll() {
    setPersonalRerollBusy(true);
    setPersonalRerollError(null);
    try {
      await rerollOwnTitle();
      setShowPersonalRerollConfirm(false);
    } catch (err) {
      setPersonalRerollError(
        err instanceof Error ? err.message : "Failed to reroll fate",
      );
    } finally {
      setPersonalRerollBusy(false);
    }
  }

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
      setDeleteError(err instanceof Error ? err.message : "Failed to delete quest");
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
      setActionError(err instanceof Error ? err.message : "Failed to save stage");
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
      setDeleteError(err instanceof Error ? err.message : "Failed to delete stage");
    } finally {
      setDeleteBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-sand-50">
        <p className="text-lg font-medium text-ink-muted">Loading adventure...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-sand-50 px-4">
        <p className="text-xl font-bold text-ink">Room not found</p>
        <p className="text-base text-ink-muted">{error ?? "This room does not exist."}</p>
        <Link
          href="/"
          className="rounded-xl bg-pine px-5 py-3 text-base font-bold text-white hover:bg-pine/90"
        >
          ← Back home
        </Link>
      </div>
    );
  }

  const stageComplete =
    selectedCategory !== null && isStageComplete(selectedCategory);

  return (
    <div className="min-h-full bg-sand-50">
      <div className="mx-auto w-full max-w-md px-3 py-4 pb-8 sm:px-4 sm:py-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex text-sm font-medium text-pine hover:text-pine/80"
          >
            ← Back home
          </Link>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setEditMode((open) => !open)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                editMode
                  ? "bg-ink text-white"
                  : "border border-sand-200 bg-white text-ink-muted"
              }`}
            >
              {editMode ? "Done Editing" : "Edit Adventure"}
            </button>
          )}
        </div>

        {editMode && isAdmin && (
          <div className="mb-3 rounded-xl border border-sand-200 bg-gold-soft/40 px-3 py-2 text-xs font-medium text-ink">
            Edit mode — stage, quest, and timer setup controls are visible.
          </div>
        )}

        {actionError && (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            {actionError}
          </div>
        )}

        <header className="rounded-xl border border-sand-200 bg-white p-3 shadow-sm sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-olive">
            Adventure Mode
          </p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-ink sm:text-2xl">
            {room.name}
          </h1>

          {(adventureSummary.totalLocations > 0 || adventureSummary.totalQuests > 0) && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium text-ink-muted">
              <span>
                {adventureSummary.completedQuests} / {adventureSummary.totalQuests} Quests
                Complete
              </span>
              <span className="text-sand-200">·</span>
              <span>
                {adventureSummary.clearedLocations} / {adventureSummary.totalLocations}{" "}
                Locations Cleared
              </span>
            </div>
          )}

          <RoomTimerSection
            timer={timer}
            isAdmin={isAdmin}
            showSetupControls={canEdit}
            onSetDuration={setTimerDuration}
            onStart={startTimer}
            onPause={pauseTimer}
            onResume={resumeTimer}
            onReset={resetTimer}
          />

          <div className="mt-3 flex items-center justify-between rounded-xl bg-sand-50 px-3 py-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                Join code
              </p>
              <p className="font-mono text-base font-bold text-ink">{code}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowMembers((open) => !open)}
              className="rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-left"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                Crew
              </p>
              <p className="text-base font-bold text-ink">
                {members.length} {showMembers ? "▾" : "▸"}
              </p>
            </button>
          </div>

          {currentMember && (
            <PersonalTitlePanel
              displayName={currentMember.display_name}
              title={currentMember.adventurer_title}
              rarity={currentMember.adventurer_rarity}
              rerollsRemaining={currentMember.personal_rerolls_remaining}
              busy={personalRerollBusy}
              onRequestReroll={() => {
                setPersonalRerollError(null);
                setShowPersonalRerollConfirm(true);
              }}
            />
          )}

          {showMembers && (
            <MemberList
              members={members}
              adminUserId={room.admin_user_id}
              isAdmin={canEdit}
              onGenerateRejoinCode={generateMemberRejoinCode}
              onRerollTitle={async (memberId) => {
                setActionError(null);
                try {
                  await rerollMemberTitle(memberId);
                } catch (err) {
                  setActionError(
                    err instanceof Error ? err.message : "Failed to reroll title",
                  );
                }
              }}
            />
          )}
        </header>

        {pendingReveal && currentMember && (
          <TitleReveal
            displayName={currentMember.display_name}
            title={pendingReveal.title}
            rarity={pendingReveal.rarity}
            isReroll={pendingReveal.isReroll}
            onDismiss={dismissTitleReveal}
          />
        )}

        <ConfirmDialog
          open={showPersonalRerollConfirm}
          title="Reroll your fate?"
          message={
            (currentMember?.personal_rerolls_remaining ?? 0) <= 1
              ? "Your current title will be lost.\n\nThis is your final reroll."
              : `Your current title will be lost.\n\nYou have ${currentMember?.personal_rerolls_remaining ?? 0} rerolls remaining.`
          }
          cancelLabel="Keep My Title"
          confirmLabel="Reroll Fate"
          busy={personalRerollBusy}
          error={personalRerollError}
          onCancel={() => {
            if (!personalRerollBusy) {
              setShowPersonalRerollConfirm(false);
              setPersonalRerollError(null);
            }
          }}
          onConfirm={handleConfirmPersonalReroll}
        />

        {!selectedCategory ? (
          <section className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink">Adventure Route</h2>
                <p className="text-xs text-ink-muted">Progress through each stage together</p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFormMode("add");
                    setRenamingCategory(undefined);
                    setShowCategoryForm(true);
                  }}
                  className="rounded-lg bg-pine px-3 py-1.5 text-sm font-bold text-white hover:bg-pine/90"
                >
                  + Stage
                </button>
              )}
            </div>

            {categories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-sand-200 bg-white px-4 py-8 text-center">
                <p className="text-sm font-medium text-ink-muted">
                  No stages yet.
                  {canEdit
                    ? " Add stops like Climbing Gym, Park, or Downtown."
                    : isAdmin
                      ? " Tap Edit Adventure to add stages."
                      : ""}
                </p>
              </div>
            ) : (
              <AdventureRoute
                categories={categories}
                canEdit={canEdit}
                currentCategoryId={currentCategoryId}
                onOpen={setSelectedCategoryId}
                onRename={(cat) => {
                  setCategoryFormMode("rename");
                  setRenamingCategory(cat);
                  setShowCategoryForm(true);
                }}
                onDelete={setDeleteCategoryTarget}
              />
            )}
          </section>
        ) : (
          <section className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => setSelectedCategoryId(null)}
              className="inline-flex text-sm font-medium text-pine hover:text-pine/80"
            >
              ← Back to Adventure
            </button>

            <div className="rounded-xl border border-sand-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-olive">
                    Stage {selectedStageIndex + 1} of {categories.length}
                  </p>
                  <h2 className="text-lg font-bold text-ink">{selectedCategory.name}</h2>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {selectedCategory.completedCount} / {selectedCategory.challengeCount}{" "}
                    Quests Complete
                  </p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormMode("add");
                      setEditingChallenge(undefined);
                      setShowFormModal(true);
                    }}
                    className="rounded-lg bg-pine px-3 py-1.5 text-sm font-bold text-white hover:bg-pine/90"
                  >
                    + Quest
                  </button>
                )}
              </div>

              {stageComplete && (
                <div className="mt-2.5 rounded-lg border border-gold/40 bg-gold-soft/50 px-3 py-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink">
                    Stage Cleared
                  </p>
                  <p className="mt-0.5 text-base font-bold text-ink">
                    {selectedCategory.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {selectedCategory.completedCount} / {selectedCategory.challengeCount}{" "}
                    quests complete
                  </p>
                  {nextStageAfterSelected ? (
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(nextStageAfterSelected.id)}
                      className="mt-2 text-xs font-bold text-pine underline-offset-2 hover:underline"
                    >
                      Next up: {nextStageAfterSelected.name} →
                    </button>
                  ) : (
                    <p className="mt-2 text-xs font-medium text-pine">
                      Adventure route complete — remarkable.
                    </p>
                  )}
                </div>
              )}
            </div>

            {categoryChallenges.length === 0 ? (
              <div className="rounded-xl border border-dashed border-sand-200 bg-white px-4 py-8 text-center">
                <p className="text-sm font-medium text-ink-muted">
                  No quests yet.
                  {canEdit
                    ? " Add your first quest for this stage."
                    : isAdmin
                      ? " Tap Edit Adventure to add quests."
                      : ""}
                </p>
              </div>
            ) : (
              categoryChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  canEdit={canEdit}
                  // Admin is a participant too — never gate progress on edit/admin mode.
                  hasMembership={!!currentMemberId || isAdmin}
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
        title="Delete quest?"
        message="This will permanently remove the quest and all of its contributions."
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
        title="Delete stage?"
        message={
          deleteCategoryTarget
            ? `Delete ${deleteCategoryTarget.name} and all ${deleteCategoryTarget.challengeCount} quest${deleteCategoryTarget.challengeCount === 1 ? "" : "s"} inside it?`
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
