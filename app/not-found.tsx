import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">That route is not part of OwnerOS.</p>
      <Link href="/overview" className={cn(buttonVariants(), "mt-6")}>
        Back to overview
      </Link>
    </div>
  );
}
