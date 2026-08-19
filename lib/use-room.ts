"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUserId } from "./auth";
import { supabase } from "./supabase";
import type {
  ChallengeWithProgress,
  DbChallenge,
  DbContribution,
  DbMember,
  DbRoom,
  RoomTimer,
} from "./types";
import { deriveTimerState } from "./utils";

type UseRoomResult = {
  room: DbRoom | null;
  members: DbMember[];
  challenges: ChallengeWithProgress[];
  timer: RoomTimer | null;
  currentUserId: string | null;
  currentMemberId: string | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  addChallenge: (data: { name: string; goal: number; unit: string }) => Promise<void>;
  editChallenge: (id: string, data: { name: string; goal: number; unit: string }) => Promise<void>;
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
  const memberMap = new Map(members.map((m) => [m.id, m.display_name]));

  return rawChallenges.map((ch) => {
    const contribs = contributions.filter((c) => c.challenge_id === ch.id);
    const progress = Math.max(0, contribs.reduce((sum, c) => sum + c.amount, 0));

    const byMember = new Map<string, number>();
    for (const c of contribs) {
      byMember.set(c.member_id, (byMember.get(c.member_id) ?? 0) + c.amount);
    }

    const memberContributions = Array.from(byMember.entries())
      .map(([memberId, amount]) => ({
        memberId,
        displayName: memberMap.get(memberId) ?? "Unknown",
        amount,
      }))
      .filter((mc) => mc.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return { id: ch.id, name: ch.name, goal: ch.goal, unit: ch.unit, progress, memberContributions };
  });
}

export function useRoom(code: string): UseRoomResult {
  const [room, setRoom] = useState<DbRoom | null>(null);
  const [members, setMembers] = useState<DbMember[]>([]);
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

      const [membersRes, challengesRes, contributionsRes] = await Promise.all([
        supabase.from("members").select("*").eq("room_id", roomId),
        supabase.from("challenges").select("*").eq("room_id", roomId),
        supabase.from("contributions").select("*").eq("challenge_id", roomId),
      ]);

      if (!cancelled) {
        setMembers((membersRes.data as DbMember[]) ?? []);
        setRawChallenges((challengesRes.data as DbChallenge[]) ?? []);
      }

      const challengeIds = ((challengesRes.data as DbChallenge[]) ?? []).map((c) => c.id);
      if (challengeIds.length > 0) {
        const { data: contribData } = await supabase
          .from("contributions")
          .select("*")
          .in("challenge_id", challengeIds);
        if (!cancelled) setContributions((contribData as DbContribution[]) ?? []);
      } else {
        if (!cancelled) setContributions([]);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [code]);

  useEffect(() => {
    const roomId = roomIdRef.current;
    if (!roomId) return;

    const channel = supabase
      .channel(`room-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, (payload) => {
        if (payload.eventType === "UPDATE") {
          setRoom(payload.new as DbRoom);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "members", filter: `room_id=eq.${roomId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setMembers((prev) => [...prev, payload.new as DbMember]);
        } else if (payload.eventType === "DELETE") {
          setMembers((prev) => prev.filter((m) => m.id !== (payload.old as DbMember).id));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "challenges", filter: `room_id=eq.${roomId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setRawChallenges((prev) => [...prev, payload.new as DbChallenge]);
        } else if (payload.eventType === "UPDATE") {
          setRawChallenges((prev) =>
            prev.map((c) => (c.id === (payload.new as DbChallenge).id ? (payload.new as DbChallenge) : c)),
          );
        } else if (payload.eventType === "DELETE") {
          setRawChallenges((prev) => prev.filter((c) => c.id !== (payload.old as DbChallenge).id));
          setContributions((prev) => prev.filter((c) => c.challenge_id !== (payload.old as DbChallenge).id));
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contributions" }, (payload) => {
        const newContrib = payload.new as DbContribution;
        const challengeIds = rawChallenges.map((c) => c.id);
        if (challengeIds.includes(newContrib.challenge_id)) {
          setContributions((prev) => [...prev, newContrib]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, rawChallenges]);

  const currentMemberId = members.find((m) => m.user_id === currentUserId)?.id ?? null;
  const isAdmin = !!(room && currentUserId && room.admin_user_id === currentUserId);
  const challenges = buildChallenges(rawChallenges, contributions, members);
  const timer = room ? deriveTimerState(room) : null;

  const addChallenge = useCallback(
    async (data: { name: string; goal: number; unit: string }) => {
      if (!roomIdRef.current) return;
      const { error: err } = await supabase
        .from("challenges")
        .insert({ room_id: roomIdRef.current, name: data.name, goal: data.goal, unit: data.unit });
      if (err) throw new Error(err.message);
    },
    [],
  );

  const editChallenge = useCallback(
    async (id: string, data: { name: string; goal: number; unit: string }) => {
      const { error: err } = await supabase
        .from("challenges")
        .update({ name: data.name, goal: data.goal, unit: data.unit })
        .eq("id", id);
      if (err) throw new Error(err.message);
    },
    [],
  );

  const deleteChallenge = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("challenges").delete().eq("id", id);
    if (err) throw new Error(err.message);
  }, []);

  const addContribution = useCallback(
    async (challengeId: string, amount: number) => {
      if (!currentMemberId) throw new Error("Not a member of this room");

      if (amount < 0) {
        const total = contributions
          .filter((c) => c.challenge_id === challengeId)
          .reduce((sum, c) => sum + c.amount, 0);
        if (total + amount < 0) {
          throw new Error("Cannot reduce progress below zero");
        }
      }

      const { error: err } = await supabase
        .from("contributions")
        .insert({ challenge_id: challengeId, member_id: currentMemberId, amount });
      if (err) throw new Error(err.message);
    },
    [currentMemberId, contributions],
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
    challenges,
    timer,
    currentUserId,
    currentMemberId,
    isAdmin,
    loading,
    error,
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
