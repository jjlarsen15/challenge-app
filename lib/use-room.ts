"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUserId } from "./auth";
import { parseAdventurerRarity } from "./adventurer-titles";
import { supabase } from "./supabase";
import type {
  CategoryWithStats,
  ChallengeWithProgress,
  DbCategory,
  DbChallenge,
  DbContribution,
  DbMember,
  DbRoom,
  RoomTimer,
} from "./types";
import { deriveTimerState } from "./utils";

const MEMBER_SELECT =
  "id, room_id, user_id, display_name, joined_at, adventurer_title, adventurer_rarity, personal_rerolls_remaining";

const MEMBER_SELECT_TITLES =
  "id, room_id, user_id, display_name, joined_at, adventurer_title, adventurer_rarity";

const MEMBER_SELECT_FALLBACK =
  "id, room_id, user_id, display_name, joined_at";

async function fetchRoomMembers(roomId: string): Promise<DbMember[]> {
  const withRerolls = await supabase
    .from("members")
    .select(MEMBER_SELECT)
    .eq("room_id", roomId);

  if (!withRerolls.error && withRerolls.data) {
    return (withRerolls.data as Record<string, unknown>[]).map((row) =>
      mapMemberRow(row),
    );
  }

  const withTitles = await supabase
    .from("members")
    .select(MEMBER_SELECT_TITLES)
    .eq("room_id", roomId);

  if (!withTitles.error && withTitles.data) {
    return (withTitles.data as Record<string, unknown>[]).map((row) =>
      mapMemberRow(row),
    );
  }

  // Titles / reroll migrations may not be applied yet — still load membership.
  const fallback = await supabase
    .from("members")
    .select(MEMBER_SELECT_FALLBACK)
    .eq("room_id", roomId);

  if (fallback.error || !fallback.data) return [];
  return (fallback.data as Record<string, unknown>[]).map((row) => mapMemberRow(row));
}

function mapMemberRow(row: Record<string, unknown>, fallback?: DbMember): DbMember {
  const rawRerolls = row.personal_rerolls_remaining;
  let personalRerolls =
    typeof rawRerolls === "number"
      ? rawRerolls
      : typeof rawRerolls === "string" && rawRerolls !== ""
        ? Number(rawRerolls)
        : (fallback?.personal_rerolls_remaining ?? 2);
  if (!Number.isFinite(personalRerolls) || personalRerolls < 0) {
    personalRerolls = fallback?.personal_rerolls_remaining ?? 2;
  }

  return {
    id: (row.id as string) ?? fallback?.id ?? "",
    room_id: (row.room_id as string) ?? fallback?.room_id ?? "",
    user_id: (row.user_id as string) ?? fallback?.user_id ?? "",
    display_name: (row.display_name as string) ?? fallback?.display_name ?? "",
    joined_at:
      (row.joined_at as string | undefined) ??
      (row.created_at as string | undefined) ??
      fallback?.joined_at ??
      "",
    adventurer_title:
      (row.adventurer_title as string | null | undefined) ??
      fallback?.adventurer_title ??
      null,
    adventurer_rarity:
      parseAdventurerRarity(row.adventurer_rarity) ?? fallback?.adventurer_rarity ?? null,
    personal_rerolls_remaining: personalRerolls,
  };
}

type UseRoomResult = {
  room: DbRoom | null;
  members: DbMember[];
  categories: CategoryWithStats[];
  challenges: ChallengeWithProgress[];
  timer: RoomTimer | null;
  currentUserId: string | null;
  currentMemberId: string | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  generateMemberRejoinCode: (memberId: string) => Promise<string>;
  rerollMemberTitle: (memberId: string) => Promise<void>;
  rerollOwnTitle: () => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  renameCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addChallenge: (data: {
    name: string;
    goal: number;
    unit: string;
    categoryId: string;
  }) => Promise<void>;
  editChallenge: (
    id: string,
    data: { name: string; goal: number; unit: string; categoryId: string },
  ) => Promise<void>;
  deleteChallenge: (id: string) => Promise<void>;
  addContribution: (challengeId: string, amount: number) => Promise<void>;
  setTimerDuration: (seconds: number) => Promise<void>;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
};

function buildChallenges(
  rawChallenges: DbChallenge[],
  contributions: DbContribution[],
  members: DbMember[],
): ChallengeWithProgress[] {
  const memberMap = new Map(members.map((m) => [m.id, m]));

  return rawChallenges.map((ch) => {
    const contribs = contributions.filter((c) => c.challenge_id === ch.id);
    const progress = Math.max(0, contribs.reduce((sum, c) => sum + c.amount, 0));

    const byMember = new Map<string, number>();
    for (const c of contribs) {
      byMember.set(c.member_id, (byMember.get(c.member_id) ?? 0) + c.amount);
    }

    const memberContributions = Array.from(byMember.entries())
      .map(([memberId, amount]) => {
        const member = memberMap.get(memberId);
        return {
          memberId,
          displayName: member?.display_name ?? "Unknown",
          adventurerTitle: member?.adventurer_title ?? null,
          adventurerRarity: member?.adventurer_rarity ?? null,
          amount,
        };
      })
      .filter((mc) => mc.amount !== 0)
      .sort((a, b) => b.amount - a.amount);

    return {
      id: ch.id,
      categoryId: ch.category_id,
      name: ch.name,
      goal: ch.goal,
      unit: ch.unit,
      progress,
      memberContributions,
    };
  });
}

function buildCategoryStats(
  rawCategories: DbCategory[],
  challenges: ChallengeWithProgress[],
): CategoryWithStats[] {
  return [...rawCategories]
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
    .map((cat) => {
      const catChallenges = challenges.filter((c) => c.categoryId === cat.id);
      const completedCount = catChallenges.filter((c) => c.progress >= c.goal).length;
      return {
        id: cat.id,
        name: cat.name,
        sortOrder: cat.sort_order,
        challengeCount: catChallenges.length,
        completedCount,
      };
    });
}

export function useRoom(code: string): UseRoomResult {
  const [room, setRoom] = useState<DbRoom | null>(null);
  const [members, setMembers] = useState<DbMember[]>([]);
  const [rawCategories, setRawCategories] = useState<DbCategory[]>([]);
  const [rawChallenges, setRawChallenges] = useState<DbChallenge[]>([]);
  const [contributions, setContributions] = useState<DbContribution[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roomIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const userId = await getCurrentUserId();
      if (!cancelled) setCurrentUserId(userId);

      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

      if (roomError || !roomData) {
        if (!cancelled) {
          setError("Room not found");
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setRoom(roomData as DbRoom);
        roomIdRef.current = roomData.id;
      }

      const roomId = roomData.id;

      const [membersData, categoriesRes, challengesRes] = await Promise.all([
        fetchRoomMembers(roomId),
        supabase
          .from("categories")
          .select("id, room_id, name, sort_order, created_at")
          .eq("room_id", roomId)
          .order("sort_order", { ascending: true }),
        supabase.from("challenges").select("*").eq("room_id", roomId),
      ]);

      if (!cancelled) {
        setMembers(membersData);
        setRawCategories((categoriesRes.data as DbCategory[]) ?? []);
        setRawChallenges((challengesRes.data as DbChallenge[]) ?? []);
      }

      const challengeIds = ((challengesRes.data as DbChallenge[]) ?? []).map((c) => c.id);
      if (challengeIds.length > 0) {
        const { data: contribData } = await supabase
          .from("contributions")
          .select("*")
          .in("challenge_id", challengeIds);
        if (!cancelled) setContributions((contribData as DbContribution[]) ?? []);
      } else if (!cancelled) {
        setContributions([]);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    const roomId = roomIdRef.current;
    if (!roomId) return;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setRoom(payload.new as DbRoom);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "members", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const member = mapMemberRow(payload.new as Record<string, unknown>);
            setMembers((prev) => {
              if (prev.some((m) => m.id === member.id)) return prev;
              return [...prev, member];
            });
          } else if (payload.eventType === "UPDATE") {
            const row = payload.new as Record<string, unknown>;
            setMembers((prev) =>
              prev.map((m) => (m.id === row.id ? mapMemberRow(row, m) : m)),
            );
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as Record<string, unknown>;
            setMembers((prev) => prev.filter((m) => m.id !== old.id));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRawCategories((prev) => [...prev, payload.new as DbCategory]);
          } else if (payload.eventType === "UPDATE") {
            setRawCategories((prev) =>
              prev.map((c) =>
                c.id === (payload.new as DbCategory).id ? (payload.new as DbCategory) : c,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as DbCategory).id;
            setRawCategories((prev) => prev.filter((c) => c.id !== deletedId));
            setRawChallenges((prev) => {
              const removed = prev.filter((c) => c.category_id === deletedId);
              const removedIds = new Set(removed.map((c) => c.id));
              setContributions((contribs) =>
                contribs.filter((c) => !removedIds.has(c.challenge_id)),
              );
              return prev.filter((c) => c.category_id !== deletedId);
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenges", filter: `room_id=eq.${roomId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRawChallenges((prev) => [...prev, payload.new as DbChallenge]);
          } else if (payload.eventType === "UPDATE") {
            setRawChallenges((prev) =>
              prev.map((c) =>
                c.id === (payload.new as DbChallenge).id ? (payload.new as DbChallenge) : c,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as DbChallenge).id;
            setRawChallenges((prev) => prev.filter((c) => c.id !== deletedId));
            setContributions((prev) => prev.filter((c) => c.challenge_id !== deletedId));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "contributions" },
        (payload) => {
          const newContrib = payload.new as DbContribution;
          setContributions((prev) => {
            if (prev.some((c) => c.id === newContrib.id)) return prev;
            return [...prev, newContrib];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "contributions" },
        (payload) => {
          const old = payload.old as DbContribution;
          if (old.id) {
            setContributions((prev) => prev.filter((c) => c.id !== old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id]);

  const currentMemberId = members.find((m) => m.user_id === currentUserId)?.id ?? null;
  const isAdmin = !!(room && currentUserId && room.admin_user_id === currentUserId);
  const challenges = buildChallenges(rawChallenges, contributions, members);
  const categories = buildCategoryStats(rawCategories, challenges);
  const timer = room ? deriveTimerState(room) : null;

  // Keep auth user id in sync (session can hydrate after first paint).
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Room admin is also a participating member. If their member row is missing
  // from local state (or absent in the DB), resolve/create it so contribution
  // controls and member_id-based writes work.
  const adminNeedsMembership = !!(
    room &&
    currentUserId &&
    room.admin_user_id === currentUserId &&
    !members.some((m) => m.user_id === currentUserId)
  );
  const adminMemberEnsureAttempted = useRef<string | null>(null);
  useEffect(() => {
    if (loading || !adminNeedsMembership || !room || !currentUserId) return;

    const attemptKey = `${room.id}:${currentUserId}`;
    if (adminMemberEnsureAttempted.current === attemptKey) return;
    adminMemberEnsureAttempted.current = attemptKey;

    let cancelled = false;
    void (async () => {
      const roomId = room.id;

      const existing = await supabase
        .from("members")
        .select(MEMBER_SELECT_FALLBACK)
        .eq("room_id", roomId)
        .eq("user_id", currentUserId)
        .maybeSingle();

      if (cancelled) return;

      if (existing.data) {
        const row = mapMemberRow(existing.data as Record<string, unknown>);
        setMembers((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        const refreshed = await fetchRoomMembers(roomId);
        if (!cancelled && refreshed.length > 0) setMembers(refreshed);
        return;
      }

      if (existing.error) {
        adminMemberEnsureAttempted.current = null;
        return;
      }

      const inserted = await supabase
        .from("members")
        .insert({
          room_id: roomId,
          user_id: currentUserId,
          display_name: "Host",
        })
        .select(MEMBER_SELECT_FALLBACK)
        .single();

      if (cancelled) return;

      if (inserted.error || !inserted.data) {
        adminMemberEnsureAttempted.current = null;
        return;
      }

      const row = mapMemberRow(inserted.data as Record<string, unknown>);
      setMembers((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
      const refreshed = await fetchRoomMembers(roomId);
      if (!cancelled && refreshed.length > 0) setMembers(refreshed);
    })();

    return () => {
      cancelled = true;
      if (adminMemberEnsureAttempted.current === attemptKey) {
        adminMemberEnsureAttempted.current = null;
      }
    };
  }, [loading, adminNeedsMembership, room, currentUserId]);

  // Backfill titles for members created before the titles migration.
  const titleEnsureAttempted = useRef<string | null>(null);
  useEffect(() => {
    if (!currentMemberId) return;
    const me = members.find((m) => m.id === currentMemberId);
    if (!me || me.adventurer_title) return;
    if (titleEnsureAttempted.current === currentMemberId) return;
    titleEnsureAttempted.current = currentMemberId;

    let cancelled = false;
    void (async () => {
      const { data, error: err } = await supabase.rpc("ensure_adventurer_title", {
        p_member_id: currentMemberId,
      });
      if (cancelled) return;
      if (err) {
        // Migration may not be applied yet; allow a later retry after remount.
        titleEnsureAttempted.current = null;
        return;
      }
      const result = data as {
        error?: string;
        adventurer_title?: string;
        adventurer_rarity?: string;
      };
      if (result.error || !result.adventurer_title) {
        titleEnsureAttempted.current = null;
        return;
      }
      setMembers((prev) =>
        prev.map((m) =>
          m.id === currentMemberId
            ? {
                ...m,
                adventurer_title: result.adventurer_title ?? m.adventurer_title,
                adventurer_rarity:
                  parseAdventurerRarity(result.adventurer_rarity) ?? m.adventurer_rarity,
              }
            : m,
        ),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [currentMemberId, members]);

  const generateMemberRejoinCode = useCallback(
    async (memberId: string): Promise<string> => {
      const { data, error: err } = await supabase.rpc("generate_member_rejoin_code", {
        p_member_id: memberId,
      });
      if (err) throw new Error(err.message);
      const result = data as { error?: string; rejoin_code?: string };
      if (result.error) throw new Error(result.error);
      return result.rejoin_code!;
    },
    [],
  );

  const rerollMemberTitle = useCallback(async (memberId: string) => {
    const { data, error: err } = await supabase.rpc("reroll_adventurer_title", {
      p_member_id: memberId,
    });
    if (err) throw new Error(err.message);
    const result = data as {
      error?: string;
      adventurer_title?: string;
      adventurer_rarity?: string;
    };
    if (result.error) throw new Error(result.error);

    if (result.adventurer_title) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                adventurer_title: result.adventurer_title ?? m.adventurer_title,
                adventurer_rarity:
                  parseAdventurerRarity(result.adventurer_rarity) ?? m.adventurer_rarity,
              }
            : m,
        ),
      );
    }
  }, []);

  const rerollOwnTitle = useCallback(async () => {
    if (!roomIdRef.current) throw new Error("Room not loaded");
    const { data, error: err } = await supabase.rpc("reroll_own_adventurer_title", {
      p_room_id: roomIdRef.current,
    });
    if (err) throw new Error(err.message);
    const result = data as {
      error?: string;
      adventurer_title?: string;
      adventurer_rarity?: string;
      personal_rerolls_remaining?: number;
    };
    if (result.error) throw new Error(result.error);

    if (!currentUserId || !result.adventurer_title) return;

    setMembers((prev) =>
      prev.map((m) =>
        m.user_id === currentUserId
          ? {
              ...m,
              adventurer_title: result.adventurer_title ?? m.adventurer_title,
              adventurer_rarity:
                parseAdventurerRarity(result.adventurer_rarity) ?? m.adventurer_rarity,
              personal_rerolls_remaining:
                typeof result.personal_rerolls_remaining === "number"
                  ? result.personal_rerolls_remaining
                  : Math.max(0, m.personal_rerolls_remaining - 1),
            }
          : m,
      ),
    );
  }, [currentUserId]);

  const addCategory = useCallback(async (name: string) => {
    if (!roomIdRef.current) return;
    const { data: existing } = await supabase
      .from("categories")
      .select("sort_order")
      .eq("room_id", roomIdRef.current)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = ((existing?.[0] as { sort_order?: number } | undefined)?.sort_order ?? -1) + 1;
    const { error: err } = await supabase.from("categories").insert({
      room_id: roomIdRef.current,
      name: name.trim(),
      sort_order: nextOrder,
    });
    if (err) throw new Error(err.message);
  }, []);

  const renameCategory = useCallback(async (id: string, name: string) => {
    const { error: err } = await supabase
      .from("categories")
      .update({ name: name.trim() })
      .eq("id", id);
    if (err) throw new Error(err.message);
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("categories").delete().eq("id", id);
    if (err) throw new Error(err.message);
    // Optimistic local cleanup in case realtime is delayed
    setRawCategories((prev) => prev.filter((c) => c.id !== id));
    setRawChallenges((prev) => {
      const removed = prev.filter((c) => c.category_id === id);
      const removedIds = new Set(removed.map((c) => c.id));
      setContributions((contribs) => contribs.filter((c) => !removedIds.has(c.challenge_id)));
      return prev.filter((c) => c.category_id !== id);
    });
  }, []);

  const addChallenge = useCallback(
    async (data: { name: string; goal: number; unit: string; categoryId: string }) => {
      if (!roomIdRef.current) return;
      const { error: err } = await supabase.from("challenges").insert({
        room_id: roomIdRef.current,
        category_id: data.categoryId,
        name: data.name,
        goal: data.goal,
        unit: data.unit,
      });
      if (err) throw new Error(err.message);
    },
    [],
  );

  const editChallenge = useCallback(
    async (
      id: string,
      data: { name: string; goal: number; unit: string; categoryId: string },
    ) => {
      const { error: err } = await supabase
        .from("challenges")
        .update({
          name: data.name,
          goal: data.goal,
          unit: data.unit,
          category_id: data.categoryId,
        })
        .eq("id", id);
      if (err) throw new Error(err.message);
    },
    [],
  );

  const deleteChallenge = useCallback(async (id: string) => {
    // Delete contributions first so deletion works even before the CASCADE
    // migration is applied. Ignore contribution-delete errors and still try
    // the challenge delete so the real FK/RLS error surfaces clearly.
    const { error: contribErr } = await supabase
      .from("contributions")
      .delete()
      .eq("challenge_id", id);

    const { error: err } = await supabase.from("challenges").delete().eq("id", id);
    if (err) {
      const detail = [err.message, contribErr?.message].filter(Boolean).join(" | ");
      throw new Error(detail || "Failed to delete challenge");
    }

    // Optimistic local update
    setRawChallenges((prev) => prev.filter((c) => c.id !== id));
    setContributions((prev) => prev.filter((c) => c.challenge_id !== id));
  }, []);

  const addContribution = useCallback(
    async (challengeId: string, amount: number) => {
      let memberId = members.find((m) => m.user_id === currentUserId)?.id ?? null;

      // Admin participates like any member — never block contributions on edit mode.
      if (
        !memberId &&
        room &&
        currentUserId &&
        room.admin_user_id === currentUserId &&
        roomIdRef.current
      ) {
        const existing = await supabase
          .from("members")
          .select(MEMBER_SELECT_FALLBACK)
          .eq("room_id", roomIdRef.current)
          .eq("user_id", currentUserId)
          .maybeSingle();

        if (existing.data) {
          const row = mapMemberRow(existing.data as Record<string, unknown>);
          memberId = row.id;
          setMembers((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        } else if (!existing.error) {
          const inserted = await supabase
            .from("members")
            .insert({
              room_id: roomIdRef.current,
              user_id: currentUserId,
              display_name: "Host",
            })
            .select(MEMBER_SELECT_FALLBACK)
            .single();
          if (inserted.data) {
            const row = mapMemberRow(inserted.data as Record<string, unknown>);
            memberId = row.id;
            setMembers((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
          }
        }
      }

      if (!memberId) throw new Error("Not a member of this room");

      if (amount < 0) {
        const total = contributions
          .filter((c) => c.challenge_id === challengeId)
          .reduce((sum, c) => sum + c.amount, 0);
        if (total + amount < 0) {
          throw new Error(
            `Cannot subtract ${Math.abs(amount)} — progress is only ${total}`,
          );
        }
      }

      const { error: err } = await supabase
        .from("contributions")
        .insert({ challenge_id: challengeId, member_id: memberId, amount });
      if (err) throw new Error(err.message);
    },
    [currentUserId, room, members, contributions],
  );

  const setTimerDuration = useCallback(async (seconds: number) => {
    if (!roomIdRef.current) return;
    const { error: err } = await supabase
      .from("rooms")
      .update({
        timer_duration_seconds: seconds,
        timer_started_at: null,
        timer_paused_remaining_seconds: null,
      })
      .eq("id", roomIdRef.current);
    if (err) throw new Error(err.message);
  }, []);

  const startTimer = useCallback(async () => {
    if (!roomIdRef.current || !room) return;
    const { error: err } = await supabase
      .from("rooms")
      .update({
        timer_started_at: new Date().toISOString(),
        timer_paused_remaining_seconds: null,
      })
      .eq("id", roomIdRef.current);
    if (err) throw new Error(err.message);
  }, [room]);

  const pauseTimer = useCallback(async () => {
    if (!roomIdRef.current || !room) return;
    const timerState = deriveTimerState(room);
    if (!timerState || timerState.status !== "running") return;
    const { error: err } = await supabase
      .from("rooms")
      .update({
        timer_started_at: null,
        timer_paused_remaining_seconds: timerState.secondsRemaining,
      })
      .eq("id", roomIdRef.current);
    if (err) throw new Error(err.message);
  }, [room]);

  const resumeTimer = useCallback(async () => {
    if (!roomIdRef.current || !room) return;
    const remaining = room.timer_paused_remaining_seconds;
    if (!remaining) return;
    const { error: err } = await supabase
      .from("rooms")
      .update({
        timer_duration_seconds: remaining,
        timer_started_at: new Date().toISOString(),
        timer_paused_remaining_seconds: null,
      })
      .eq("id", roomIdRef.current);
    if (err) throw new Error(err.message);
  }, [room]);

  const resetTimer = useCallback(async () => {
    if (!roomIdRef.current || !room) return;
    const { error: err } = await supabase
      .from("rooms")
      .update({
        timer_started_at: null,
        timer_paused_remaining_seconds: null,
      })
      .eq("id", roomIdRef.current);
    if (err) throw new Error(err.message);
  }, [room]);

  return {
    room,
    members,
    categories,
    challenges,
    timer,
    currentUserId,
    currentMemberId,
    isAdmin,
    loading,
    error,
    generateMemberRejoinCode,
    rerollMemberTitle,
    rerollOwnTitle,
    addCategory,
    renameCategory,
    deleteCategory,
    addChallenge,
    editChallenge,
    deleteChallenge,
    addContribution,
    setTimerDuration,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  };
}
