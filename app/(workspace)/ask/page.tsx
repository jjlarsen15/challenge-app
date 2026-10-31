import { Suspense } from "react";
import { AskChat } from "@/components/ask/ask-chat";

export const metadata = { title: "Ask OwnerOS" };

export default function Page() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading Ask OwnerOS…</div>}>
      <AskChat />
    </Suspense>
  );
}
