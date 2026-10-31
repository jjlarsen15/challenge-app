"use client";

import { Sidebar } from "@/components/shell/sidebar";
import { MobileBottomNav, MobileTopBar } from "@/components/shell/mobile-nav";
import { Topbar } from "@/components/shell/topbar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/lib/demo/workspace-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, snapshot } = useWorkspace();

  if (!ready) {
    return (
      <div className="flex min-h-svh">
        <div className="hidden w-64 border-r p-6 md:block">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-8 h-10 w-full" />
          <Skeleton className="mt-3 h-10 w-full" />
          <Skeleton className="mt-3 h-10 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="mt-6 h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <Topbar />
        {snapshot.organization.isDemo ? (
          <div className="border-b bg-accent/70 px-4 py-2 text-center text-xs text-accent-foreground md:px-6">
            <Badge variant="outline" className="mr-2 border-primary/20 bg-background">
              Demo data
            </Badge>
            You are in the labeled Peakline HVAC workspace. Nothing here is live customer data.
          </div>
        ) : null}
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-10">{children}</main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
