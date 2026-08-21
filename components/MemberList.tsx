"use client";

import { useState } from "react";
import type { DbMember } from "@/lib/types";

type MemberListProps = {
  members: DbMember[];
  adminUserId: string;
  isAdmin: boolean;
  onGenerateRejoinCode: (memberId: string) => Promise<string>;
};

export function MemberList({
  members,
  adminUserId,
  isAdmin,
  onGenerateRejoinCode,
}: MemberListProps) {
  const [rejoinCodes, setRejoinCodes] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<string | null>(null);

  if (members.length === 0) return null;

  async function handleGenerate(memberId: string) {
    setGenerating(memberId);
    try {
      const code = await onGenerateRejoinCode(memberId);
      setRejoinCodes((prev) => ({ ...prev, [memberId]: code }));
    } catch {
      // error handled upstream
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        Members
      </p>
      <ul className="space-y-1.5">
        {members.map((member) => {
          const isMemberAdmin = member.user_id === adminUserId;
          const code = rejoinCodes[member.id];

          return (
            <li
              key={member.id}
              className="rounded-lg bg-orange-50 px-2.5 py-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {member.display_name}
                  {isMemberAdmin && (
                    <span className="ml-1 text-orange-500" title="Admin">
                      👑
                    </span>
                  )}
                </span>
                {isAdmin && !isMemberAdmin && (
                  <button
                    type="button"
                    onClick={() => handleGenerate(member.id)}
                    disabled={generating === member.id}
                    className="rounded-lg border border-orange-200 bg-white px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                  >
                    {generating === member.id
                      ? "..."
                      : code
                        ? "Regenerate"
                        : "Generate Rejoin Code"}
                  </button>
                )}
              </div>
              {isAdmin && code && (
                <div className="mt-1 rounded-md bg-white px-2 py-1.5 text-xs">
                  <span className="text-slate-500">Rejoin code: </span>
                  <span className="font-mono font-bold text-slate-900">{code}</span>
                  <span className="ml-2 text-slate-400">Expires in 24h</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
