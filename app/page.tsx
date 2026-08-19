"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveRoomSession } from "@/lib/room-session";
import { generateRoomCode } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();

  const [createRoomName, setCreateRoomName] = useState("");
  const [createUserName, setCreateUserName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinUserName, setJoinUserName] = useState("");

  function handleCreateRoom(event: React.FormEvent) {
    event.preventDefault();

    const roomName = createRoomName.trim() || "Challenge Room";
    const userName = createUserName.trim() || "Guest";
    const code = generateRoomCode();

    saveRoomSession(code, { roomName, userName });
    router.push(`/room/${code}`);
  }

  function handleJoinRoom(event: React.FormEvent) {
    event.preventDefault();

    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) return;

    const userName = joinUserName.trim() || "Guest";

    saveRoomSession(code, { roomName: "Challenge Room", userName });
    router.push(`/room/${code}`);
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
                className="w-full rounded-xl bg-orange-500 px-4 py-4 text-lg font-bold text-white transition hover:bg-orange-600 active:scale-[0.99]"
              >
                Create Room
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
                disabled={joinCode.trim().length !== 6}
                className="w-full rounded-xl bg-slate-900 px-4 py-4 text-lg font-bold text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Join Room
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
