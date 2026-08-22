"use client";

import { useEffect, useState } from "react";
import {
  formatAdventurerLine,
  getMythicQuote,
  type AdventurerRarity,
} from "@/lib/adventurer-titles";

type TitleRevealProps = {
  displayName: string;
  title: string;
  rarity: AdventurerRarity;
  isReroll?: boolean;
  onDismiss: () => void;
};

const RARITY_STYLES: Record<
  AdventurerRarity,
  { shell: string; glow: string; accent: string; button: string }
> = {
  common: {
    shell: "from-[#1a2e24] via-[#24382c] to-[#1a2e24]",
    glow: "shadow-[0_0_40px_rgba(45,90,69,0.35)]",
    accent: "text-title-common",
    button: "bg-pine text-white hover:bg-pine/90",
  },
  rare: {
    shell: "from-[#121a2e] via-[#1a2740] to-[#121a2e]",
    glow: "shadow-[0_0_48px_rgba(42,74,122,0.4)]",
    accent: "text-title-rare",
    button: "bg-[#2a4a7a] text-white hover:bg-[#243f68]",
  },
  legendary: {
    shell: "from-[#2a1c0e] via-[#3a2814] to-[#2a1c0e]",
    glow: "shadow-[0_0_52px_rgba(184,122,42,0.4)]",
    accent: "text-title-legendary",
    button: "bg-[#b87a2a] text-white hover:bg-[#a06a24]",
  },
  mythic: {
    shell: "from-[#1a0c10] via-[#2a1218] to-[#1a0c10]",
    glow: "shadow-[0_0_56px_rgba(139,46,58,0.45)]",
    accent: "text-title-mythic",
    button: "bg-[#8b2e3a] text-white hover:bg-[#7a2833]",
  },
};

export function TitleReveal({
  displayName,
  title,
  rarity,
  isReroll = false,
  onDismiss,
}: TitleRevealProps) {
  const [phase, setPhase] = useState<"waiting" | "reveal">("waiting");
  const styles = RARITY_STYLES[rarity];
  const quote = rarity === "mythic" ? getMythicQuote(title) : null;
  const buttonLabel =
    rarity === "legendary" || rarity === "mythic"
      ? "Accept Your Fate"
      : "Begin Adventure";

  useEffect(() => {
    const delay = isReroll ? 1000 : 650;
    const timeout = window.setTimeout(() => setPhase("reveal"), delay);
    return () => window.clearTimeout(timeout);
  }, [isReroll, title]);

  const headline =
    rarity === "common"
      ? "Your fate has been chosen"
      : rarity === "rare"
        ? "Rare"
        : rarity === "legendary"
          ? "Legendary"
          : "Mythic";

  const titleDisplay =
    rarity === "mythic" ? `The ${title}` : title;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Adventurer title reveal"
    >
      <div
        className={`title-reveal-panel w-full max-w-sm overflow-hidden rounded-2xl border border-sand-200/20 bg-gradient-to-b ${styles.shell} ${styles.glow} px-5 py-7 text-center sm:px-6 sm:py-8`}
      >
        {phase === "waiting" ? (
          <div className="title-reveal-fade py-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sand-200/80">
              {isReroll ? "Fate is shifting…" : "The party gathers…"}
            </p>
            <div className="mx-auto mt-5 h-1 w-16 overflow-hidden rounded-full bg-white/10">
              <div className="title-reveal-bar h-full w-1/2 rounded-full bg-white/40" />
            </div>
          </div>
        ) : (
          <div className="title-reveal-fade space-y-4">
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${styles.accent}`}
            >
              {headline}
            </p>

            <h2
              className={`title-reveal-scale text-2xl font-bold leading-tight tracking-wide text-sand-50 sm:text-3xl ${styles.accent}`}
            >
              {titleDisplay}
            </h2>

            {quote && (
              <p className="px-1 text-sm italic leading-relaxed text-sand-100/90">
                “{quote}”
              </p>
            )}

            <p className="text-base font-medium text-sand-100">
              {formatAdventurerLine(displayName, title)}
            </p>

            <button
              type="button"
              onClick={onDismiss}
              className={`mt-2 w-full rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wide transition active:scale-[0.99] ${styles.button}`}
            >
              {buttonLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
