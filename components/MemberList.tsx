"use client";

import type { DbMember } from "@/lib/types";

type MemberListProps = {
  members: DbMember[];
  adminUserId: string;
};

export function MemberList({ members, adminUserId }: MemberListProps) {
  if (members.length === 0) return null;

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Members
      </p>
      <ul className="flex flex-wrap gap-2">
        {members.map((member) => (
          <li
            key={member.id}
            className="rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-medium text-slate-700"
          >
            {member.display_name}
            {member.user_id === adminUserId && (
              <span className="ml-1 text-orange-500" title="Admin">
                👑
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
