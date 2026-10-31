"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkspace } from "@/lib/demo/workspace-store";
import { cn } from "@/lib/utils";

export function AskChat({ conversationId }: { conversationId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preset = searchParams.get("q") ?? "";
  const { snapshot, ask, currentUser } = useWorkspace();
  const [question, setQuestion] = useState(preset);
  const [busy, setBusy] = useState(false);

  const conversations = snapshot.conversations.filter((item) => item.userId === currentUser.id);
  const activeId = conversationId ?? conversations[0]?.id;
  const messages = snapshot.messages.filter((item) => item.conversationId === activeId);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = question.trim();
    if (!value) return;
    setBusy(true);
    try {
      const id = await ask(value, conversationId);
      setQuestion("");
      if (id !== conversationId) router.push(`/ask/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not answer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block">
        <h2 className="text-sm font-semibold">Your questions</h2>
        <ul className="mt-3 space-y-1">
          <li>
            <Link
              href="/ask"
              className={cn(
                "block rounded-xl px-3 py-2 text-sm",
                !conversationId ? "bg-accent" : "hover:bg-muted",
              )}
            >
              New question
            </Link>
          </li>
          {conversations.map((item) => (
            <li key={item.id}>
              <Link
                href={`/ask/${item.id}`}
                className={cn(
                  "block rounded-xl px-3 py-2 text-sm",
                  item.id === activeId ? "bg-accent" : "hover:bg-muted",
                )}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-h-[70vh] flex-col rounded-2xl border bg-card">
        <div className="border-b px-5 py-4">
          <h1 className="text-xl font-semibold">Ask OwnerOS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Answers come from approved company knowledge for {snapshot.organization.name}. If it is
            not documented, the assistant will say so.
          </p>
        </div>
        <ScrollArea className="flex-1 px-5 py-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Try a question like:</p>
                <ul className="space-y-2">
                  {[
                    "How do we usually price emergency weekend calls?",
                    "Have we seen this Carrier 24ACC6 issue before?",
                    "Which supplier do we prefer for replacement parts?",
                    "What is our procedure for winter condensate drains?",
                  ].map((example) => (
                    <li key={example}>
                      <button
                        type="button"
                        className="rounded-xl border bg-background px-3 py-2 text-left hover:bg-muted"
                        onClick={() => setQuestion(example)}
                      >
                        {example}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={cn(
                    "max-w-2xl rounded-2xl px-4 py-3 text-sm leading-6",
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted/60",
                  )}
                  data-testid={message.role === "assistant" ? "assistant-message" : "user-message"}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.role === "assistant" && message.undocumented ? (
                    <p className="mt-3 text-xs font-medium">
                      Escalation: ask an owner or manager, then capture the answer.
                    </p>
                  ) : null}
                  {message.citations.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {message.citations.map((citation) => (
                        <Link
                          key={citation.knowledgeEntryId}
                          href={`/memory/${citation.knowledgeEntryId}`}
                          className="block rounded-xl border border-border/60 bg-background px-3 py-2 text-foreground"
                          data-testid="citation-link"
                        >
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                            Approved source
                          </p>
                          <p className="font-medium">{citation.title}</p>
                          <p className="text-xs text-muted-foreground">{citation.excerpt}</p>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </ScrollArea>
        <form onSubmit={onSubmit} className="border-t p-4">
          <label htmlFor="ask-input" className="sr-only">
            Question
          </label>
          <Textarea
            id="ask-input"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about pricing, equipment, customers, or procedures"
            className="min-h-20 rounded-xl"
            data-testid="ask-input"
          />
          <div className="mt-3 flex justify-end">
            <Button type="submit" disabled={busy} data-testid="ask-submit">
              {busy ? "Retrieving…" : "Ask"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
