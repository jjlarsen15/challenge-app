"use client";

import { useState } from "react";
import { rarityTextClass } from "@/lib/adventurer-titles";
import type { DbMember } from "@/lib/types";

type MemberListProps = {
  members: DbMember[];
  adminUserId: string;
  isAdmin: boolean;
  onGenerateRejoinCode: (memberId: string) => Promise<string>;
  onRerollTitle?: (memberId: string) => Promise<void>;
};

export function MemberList({
  members,
  adminUserId,
  isAdmin,
  onGenerateRejoinCode,
  onRerollTitle,
}: MemberListProps) {
  const [rejoinCodes, setRejoinCodes] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<string | null>(null);
  const [rerolling, setRerolling] = useState<string | null>(null);

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

  async function handleReroll(memberId: string) {
    if (!onRerollTitle) return;
    setRerolling(memberId);
    try {
      await onRerollTitle(memberId);
    } catch {
      // error handled upstream
    } finally {
      setRerolling(null);
    }
  }

  return (
    <div className="mt-3 border-t border-sand-100 pt-3">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
        Party
      </p>
      <ul className="space-y-1.5">
        {members.map((member) => {
          const isMemberAdmin = member.user_id === adminUserId;
          const code = rejoinCodes[member.id];
          const titleClass = rarityTextClass(member.adventurer_rarity);

          return (
            <li
              key={member.id}
              className="rounded-lg bg-sand-50 px-2.5 py-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {member.display_name}
                    {isMemberAdmin && (
                      <span className="ml-1 text-ember" title="Admin">
                        ★
                      </span>
                    )}
                  </p>
                  {member.adventurer_title && (
                    <p className={`text-xs font-medium leading-snug ${titleClass}`}>
                      the {member.adventurer_title}
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {onRerollTitle && (
                      <button
                        type="button"
                        onClick={() => void handleReroll(member.id)}
                        disabled={rerolling === member.id}
                        className="rounded-md border border-sand-200 bg-white px-2 py-1 text-[11px] font-semibold text-ink-muted hover:bg-sand-50 disabled:opacity-50"
                      >
                        {rerolling === member.id ? "…" : "Reroll Title"}
                      </button>
                    )}
                    {!isMemberAdmin && (
                      <button
                        type="button"
                        onClick={() => void handleGenerate(member.id)}
                        disabled={generating === member.id}
                        className="rounded-md border border-sand-200 bg-white px-2 py-1 text-[11px] font-semibold text-ink-muted hover:bg-sand-50 disabled:opacity-50"
                      >
                        {generating === member.id
                          ? "…"
                          : code
                            ? "Regenerate"
                            : "Rejoin Code"}
                      </button>
                    )}
                  </div>
                )}
              </div>
              {isAdmin && code && (
                <div className="mt-1 rounded-md bg-white px-2 py-1.5 text-xs">
                  <span className="text-ink-muted">Rejoin code: </span>
                  <span className="font-mono font-bold text-ink">{code}</span>
                  <span className="ml-2 text-ink-muted/70">Expires in 24h</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
