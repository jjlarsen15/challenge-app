"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";
import { OwnerOSLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MOBILE_PRIMARY, NAV_ITEMS } from "@/components/shell/nav-config";
import { useWorkspace } from "@/lib/demo/workspace-store";
import { canReviewKnowledge } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function MobileTopBar() {
  const [open, setOpen] = useState(false);
  const { snapshot, pendingReview, currentUser } = useWorkspace();
  const canReview = canReviewKnowledge(currentUser.role);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
      <OwnerOSLogo />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SheetHeader>
            <SheetTitle>
              <OwnerOSLogo />
            </SheetTitle>
          </SheetHeader>
          <p className="px-4 text-xs text-muted-foreground">{snapshot.organization.name}</p>
          <nav className="mt-4 flex flex-col gap-1 px-2">
            {NAV_ITEMS.filter((item) => item.href !== "/review" || canReview).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent"
              >
                <item.icon className="size-4" />
                {item.label}
                {"badge" in item && item.badge && pendingReview.length > 0 ? (
                  <Badge className="ml-auto">{pendingReview.length}</Badge>
                ) : null}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) =>
    MOBILE_PRIMARY.includes(item.href as (typeof MOBILE_PRIMARY)[number]),
  );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-2 py-2 backdrop-blur md:hidden"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          const isCapture = item.href === "/capture";
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    isCapture && "bg-primary text-primary-foreground shadow-sm",
                    !isCapture && active && "bg-accent text-accent-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
