import Link from "next/link";
import { OwnerOSLogo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,_oklch(0.95_0.03_155)_0%,_var(--background)_42%)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <OwnerOSLogo />
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Log in
          </Link>
          <Link href="/overview" className={cn(buttonVariants(), "rounded-xl")} data-testid="enter-demo">
            Enter demo
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-24 pt-10 md:pt-20">
        <p className="text-sm font-medium tracking-[0.18em] text-primary uppercase">
          For HVAC, plumbing, electrical, and specialty trades
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
          The business memory for everything in the owner&apos;s head.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          A technician records a 30-second voice note. OwnerOS drafts the knowledge, waits for a
          human to approve it, and then answers the next person from cited company memory — never
          from a guess.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/overview" className={cn(buttonVariants({ size: "lg" }), "rounded-xl")} data-testid="hero-demo">
            Try the Peakline HVAC demo
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-xl")}
          >
            Create a company
          </Link>
        </div>

        <section className="mt-20 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Capture first",
              body: "Voice, notes, and documents stay as original source material. Organization happens after.",
            },
            {
              title: "Humans approve",
              body: "AI can suggest a procedure. It cannot silently become pricing policy or a repair instruction.",
            },
            {
              title: "Answers with sources",
              body: "Ask OwnerOS only uses approved knowledge the teammate is allowed to see, with a citation.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border bg-card/80 p-6 shadow-sm">
              <h2 className="text-base font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
