"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ensureAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { generateRoomCode } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();

  const [createRoomName, setCreateRoomName] = useState("");
  const [createUserName, setCreateUserName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinUserName, setJoinUserName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreateRoom(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const userId = await ensureAuth();
      const roomName = createRoomName.trim() || "Challenge Room";
      const userName = createUserName.trim() || "Guest";

      let code = generateRoomCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        const { data: existing } = await supabase
          .from("rooms")
          .select("id")
          .eq("code", code)
          .maybeSingle();
        if (!existing) break;
        code = generateRoomCode();
      }

      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .insert({ code, name: roomName, admin_user_id: userId })
        .select("id")
        .single();

      if (roomError || !roomData) throw new Error(roomError?.message ?? "Failed to create room");

      const { error: memberError } = await supabase
        .from("members")
        .insert({ room_id: roomData.id, user_id: userId, display_name: userName });

      if (memberError) throw new Error(memberError.message);

      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinRoom(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const userId = await ensureAuth();
      const code = joinCode.trim().toUpperCase();
      if (code.length !== 6) throw new Error("Room code must be 6 characters");
      const userName = joinUserName.trim() || "Guest";

      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("id")
        .eq("code", code)
        .maybeSingle();

      if (roomError) throw new Error(roomError.message);
      if (!roomData) throw new Error("Room not found. Check the code and try again.");

      const { data: existingMember } = await supabase
        .from("members")
        .select("id")
        .eq("room_id", roomData.id)
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingMember) {
        const { error: memberError } = await supabase
          .from("members")
          .insert({ room_id: roomData.id, user_id: userId, display_name: userName });
        if (memberError) throw new Error(memberError.message);
      }

      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join room");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-orange-50 via-white to-amber-50">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 py-10">
        <header className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            Group challenges
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
            Challenge
          </h1>
          <p className="mt-3 text-base text-slate-600">
            Track goals together. Create a room or join with a code.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Create Room</h2>
            <form onSubmit={handleCreateRoom} className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Room name
                </span>
                <input
                  type="text"
                  value={createRoomName}
                  onChange={(event) => setCreateRoomName(event.target.value)}
                  placeholder="Weekend Warriors"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Your name
                </span>
                <input
                  type="text"
                  value={createUserName}
                  onChange={(event) => setCreateUserName(event.target.value)}
                  placeholder="Josh"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-orange-500 px-4 py-4 text-lg font-bold text-white transition hover:bg-orange-600 active:scale-[0.99] disabled:opacity-50"
              >
                {busy ? "Creating..." : "Create Room"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Join Room</h2>
            <form onSubmit={handleJoinRoom} className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Room code
                </span>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(event) =>
                    setJoinCode(event.target.value.toUpperCase().slice(0, 6))
                  }
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-base uppercase tracking-widest outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Your name
                </span>
                <input
                  type="text"
                  value={joinUserName}
                  onChange={(event) => setJoinUserName(event.target.value)}
                  placeholder="Josh"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                />
              </label>
              <button
                type="submit"
                disabled={busy || joinCode.trim().length !== 6}
                className="w-full rounded-xl bg-slate-900 px-4 py-4 text-lg font-bold text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Joining..." : "Join Room"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
