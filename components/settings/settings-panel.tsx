"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/lib/demo/workspace-store";
import { canEditOrganization, canManageMembers } from "@/lib/permissions";
import { MEMBER_ROLES, ROLE_LABELS, type MemberRole } from "@/lib/types/domain";
import { getAiRuntimeConfig } from "@/lib/ai/config";
import { isSupabaseConfigured, shouldUseDemoWorkspace } from "@/lib/env";

export function SettingsPanel() {
  const { snapshot, currentUser, invite, updateOrganization, profileName } = useWorkspace();
  const [name, setName] = useState(snapshot.organization.name);
  const [industry, setIndustry] = useState(snapshot.organization.industry);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("employee");
  const ai = getAiRuntimeConfig();

  function onSaveOrg(event: FormEvent) {
    event.preventDefault();
    if (!canEditOrganization(currentUser.role)) {
      toast.error("Only the owner can change organization settings");
      return;
    }
    updateOrganization(name, industry);
    toast.success("Organization updated");
  }

  function onInvite(event: FormEvent) {
    event.preventDefault();
    if (!canManageMembers(currentUser.role)) {
      toast.error("Only the owner can invite teammates");
      return;
    }
    try {
      invite(email, role);
      setEmail("");
      toast.success("Invitation saved in the demo workspace");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not invite");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Organization, roles, and usage. Live auth and billing are Phase 3+.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Industry taxonomy is configurable. HVAC is the starting default.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSaveOrg} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Company name</Label>
              <Input id="org-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-industry">Industry key</Label>
              <Input
                id="org-industry"
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {snapshot.members.length} of {snapshot.organization.settings.limits.members} seats in use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="divide-y rounded-xl border">
            {snapshot.members.map((member) => (
              <li key={member.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{profileName(member.userId)}</span>
                <span className="text-muted-foreground">{ROLE_LABELS[member.role]}</span>
              </li>
            ))}
          </ul>
          <form onSubmit={onInvite} className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
            <Input
              type="email"
              placeholder="teammate@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="Invite email"
            />
            <Select value={role} onValueChange={(value) => setRole(value as MemberRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEMBER_ROLES.filter((item) => item !== "owner").map((item) => (
                  <SelectItem key={item} value={item}>
                    {ROLE_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">Invite</Button>
          </form>
          {snapshot.invitations.length > 0 ? (
            <div>
              <p className="text-sm font-medium">Open invitations</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {snapshot.invitations.map((item) => (
                  <li key={item.id}>
                    {item.email} · {ROLE_LABELS[item.role]}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Demo workspace: {shouldUseDemoWorkspace() ? "on" : "off"}</p>
          <p>Supabase: {isSupabaseConfigured() ? "configured" : "not configured"}</p>
          <p>AI provider: {ai.provider}</p>
          <p>
            Captures this month: {snapshot.captures.length} /{" "}
            {snapshot.organization.settings.limits.capturesPerMonth}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
