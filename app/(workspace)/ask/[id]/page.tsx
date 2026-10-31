import { Suspense } from "react";
import { AskChat } from "@/components/ask/ask-chat";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading conversation…</div>}>
      <AskChat conversationId={id} />
    </Suspense>
  );
}
