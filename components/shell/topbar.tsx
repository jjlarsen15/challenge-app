"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/lib/demo/workspace-store";
import { ROLE_LABELS } from "@/lib/types/domain";
import { initials } from "@/lib/utils";

export function Topbar() {
  const router = useRouter();
  const { currentUser, snapshot, switchDemoUser, resetDemo, pendingReview } = useWorkspace();
  const [query, setQuery] = useState("");

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    router.push(`/ask?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className="hidden items-center gap-4 border-b bg-background/80 px-6 py-3 backdrop-blur md:flex">
      <form onSubmit={onSearch} className="relative max-w-xl flex-1">
        <label htmlFor="ask-search" className="sr-only">
          Ask OwnerOS
        </label>
        <Input
          id="ask-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask OwnerOS anything about how the company works"
          className="h-10 rounded-xl bg-muted/60"
        />
      </form>
      <Button asChild variant="outline" className="rounded-xl">
        <Link href="/capture">Record a note</Link>
      </Button>
      {pendingReview.length > 0 ? (
        <Button asChild variant="secondary" className="rounded-xl">
          <Link href="/review">{pendingReview.length} to review</Link>
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 gap-2 rounded-xl px-2">
            <Avatar size="sm">
              <AvatarFallback>{initials(currentUser.fullName)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-left lg:block">
              <span className="block text-sm font-medium">{currentUser.fullName}</span>
              <span className="block text-xs text-muted-foreground">
                {ROLE_LABELS[currentUser.role]}
              </span>
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Demo role preview</DropdownMenuLabel>
          {snapshot.profiles.map((profile) => {
            const member = snapshot.members.find((item) => item.userId === profile.id);
            return (
              <DropdownMenuItem
                key={profile.id}
                onClick={() => switchDemoUser(profile.id)}
              >
                {profile.fullName}
                <span className="ml-auto text-xs text-muted-foreground">
                  {member ? ROLE_LABELS[member.role] : ""}
                </span>
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={resetDemo}>Reset labeled demo data</DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">Organization settings</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
