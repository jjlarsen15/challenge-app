"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OwnerOSLogo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { NAV_ITEMS } from "@/components/shell/nav-config";
import { useWorkspace } from "@/lib/demo/workspace-store";
import { canReviewKnowledge } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { snapshot, pendingReview, currentUser } = useWorkspace();
  const canReview = canReviewKnowledge(currentUser.role);

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r bg-sidebar px-4 py-5 md:flex">
      <Link href="/overview" className="px-1">
        <OwnerOSLogo />
      </Link>
      <p className="mt-6 px-2 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        {snapshot.organization.name}
      </p>
      <nav className="mt-3 flex flex-1 flex-col gap-1" aria-label="Workspace">
        {NAV_ITEMS.filter((item) => item.href !== "/review" || canReview).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge && pendingReview.length > 0 ? (
                <Badge className="h-5 min-w-5 px-1.5">{pendingReview.length}</Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="rounded-xl bg-background/80 p-3 text-xs leading-5 text-muted-foreground">
        Capture first. Approve before it becomes company guidance.
      </div>
    </aside>
  );
}
