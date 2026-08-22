"use client";

import { useEffect, useState } from "react";
import { rarityTextClass } from "@/lib/adventurer-titles";
import type { AdventureResults } from "@/lib/adventure-results";

type GameOverScreenProps = {
  results: AdventureResults;
  isAdmin: boolean;
  onReturnToAdventure?: () => void;
};

function AdventurerIdentity({
  displayName,
  title,
  rarity,
  nameClassName = "text-sm font-semibold text-ink",
}: {
  displayName: string;
  title: string | null;
  rarity: AdventureResults["party"][number]["adventurerRarity"];
  nameClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <p className={nameClassName}>{displayName}</p>
      {title && (
        <p className={`text-xs font-medium leading-snug ${rarityTextClass(rarity)}`}>
          the {title}
        </p>
      )}
    </div>
  );
}

export function GameOverScreen({
  results,
  isAdmin,
  onReturnToAdventure,
}: GameOverScreenProps) {
  const [phase, setPhase] = useState<"intro" | "results">("intro");

  useEffect(() => {
    const timeout = window.setTimeout(() => setPhase("results"), 1100);
    return () => window.clearTimeout(timeout);
  }, []);

  const headline = results.isPerfect ? "Adventure Complete" : "Game Over";
  const subhead = results.isPerfect
    ? "All quests cleared"
    : "The adventure has ended";

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#1a1612]/90">
      <div className="game-over-fade mx-auto flex min-h-full w-full max-w-md flex-col px-4 py-8 pb-12">
        {phase === "intro" ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <p className="game-over-scale text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-soft">
              {results.isPerfect ? "Perfect Adventure" : "Expedition Ended"}
            </p>
            <h1 className="game-over-scale mt-3 text-4xl font-bold tracking-tight text-sand-50">
              {headline}
            </h1>
            <p className="game-over-fade mt-3 text-sm font-medium text-sand-200">
              {subhead}
            </p>
          </div>
        ) : (
          <div className="game-over-fade space-y-4">
            <header className="rounded-2xl border border-sand-200/20 bg-[#243036]/90 px-4 py-5 text-center shadow-lg">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                {results.isPerfect ? "Perfect Adventure" : "Final Results"}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-sand-50">
                {headline}
              </h1>
              <p className="mt-1 text-sm text-sand-200">{subhead}</p>
            </header>

            <section className="grid grid-cols-2 gap-2">
              <StatCard
                value={`${results.questsCompleted} / ${results.totalQuests}`}
                label="Quests Completed"
              />
              <StatCard
                value={`${results.locationsCleared} / ${results.totalLocations}`}
                label="Locations Cleared"
              />
              <StatCard
                value={`${results.completionPercent}%`}
                label="Adventure Completion"
              />
              <StatCard
                value={String(results.adventurerCount)}
                label="Adventurers"
              />
            </section>

            <p className="text-center text-xs font-medium text-sand-200/80">
              {results.totalProgress.toLocaleString()} total progress recorded
            </p>

            {results.awards.length > 0 && (
              <section className="rounded-2xl border border-gold/30 bg-[#2a241c] px-3 py-3">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                  Awards
                </h2>
                <ul className="mt-2 space-y-2.5">
                  {results.awards.map((award) => (
                    <li
                      key={award.kind}
                      className="rounded-xl border border-sand-200/10 bg-black/20 px-3 py-2.5"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide text-gold-soft">
                        {award.label}
                      </p>
                      <ul className="mt-1.5 space-y-2">
                        {award.winners.map((w) => (
                          <li key={`${award.kind}-${w.memberId}`}>
                            <AdventurerIdentity
                              displayName={w.displayName}
                              title={w.adventurerTitle}
                              rarity={w.adventurerRarity}
                              nameClassName="text-sm font-semibold text-sand-50"
                            />
                            <p className="mt-0.5 text-xs text-sand-200/80">{w.detail}</p>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-2xl border border-sand-200/15 bg-[#243036]/80 px-3 py-3">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sand-200">
                Party Results
              </h2>
              <ul className="mt-2 space-y-2">
                {results.party.map((member) => (
                  <li
                    key={member.memberId}
                    className="flex items-start justify-between gap-3 rounded-xl bg-black/15 px-3 py-2"
                  >
                    <AdventurerIdentity
                      displayName={member.displayName}
                      title={member.adventurerTitle}
                      rarity={member.adventurerRarity}
                      nameClassName="text-sm font-semibold text-sand-50"
                    />
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-sand-50">
                        {member.totalContributed.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-sand-200/70">
                        {member.questsTouched}{" "}
                        {member.questsTouched === 1 ? "quest" : "quests"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-sand-200/15 bg-[#243036]/80 px-3 py-3">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sand-200">
                Locations
              </h2>
              <ul className="mt-2 space-y-2">
                {results.locations.length === 0 ? (
                  <li className="text-sm text-sand-200/70">No locations were set.</li>
                ) : (
                  results.locations.map((loc) => (
                    <li
                      key={loc.id}
                      className="rounded-xl bg-black/15 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            loc.cleared ? "text-gold" : "text-sand-200"
                          }`}
                        >
                          {loc.cleared ? "✓" : "○"}
                        </span>
                        <p className="text-sm font-bold uppercase tracking-wide text-sand-50">
                          {loc.name}
                        </p>
                      </div>
                      <p className="mt-0.5 pl-5 text-xs text-sand-200/80">
                        {loc.completedCount} / {loc.challengeCount} quests completed
                        {loc.cleared ? " · Stage cleared" : ""}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </section>

            {results.isPerfect ? (
              <section className="rounded-2xl border border-gold/40 bg-gold-soft/10 px-4 py-5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
                  Perfect Adventure
                </p>
                <p className="mt-1 text-lg font-bold text-sand-50">All Quests Cleared</p>
              </section>
            ) : (
              <section className="rounded-2xl border border-sand-200/15 bg-[#243036]/80 px-3 py-3">
                <h2 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sand-200">
                  Unfinished Quests
                </h2>
                {results.unfinishedQuests.length === 0 ? (
                  <p className="mt-2 text-sm text-sand-200/70">No unfinished quests.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {results.unfinishedQuests.map((q) => (
                      <li key={q.id} className="rounded-xl bg-black/15 px-3 py-2">
                        <p className="text-sm font-semibold text-sand-50">{q.name}</p>
                        <p className="text-xs text-sand-200/70">{q.locationName}</p>
                        <p className="mt-0.5 text-xs font-medium text-sand-200">
                          {q.progress.toLocaleString()} / {q.goal.toLocaleString()}
                          <span className="ml-2 text-ember">{q.percent}%</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {isAdmin && onReturnToAdventure && (
              <button
                type="button"
                onClick={onReturnToAdventure}
                className="w-full rounded-xl border border-sand-200/30 bg-transparent px-4 py-3 text-sm font-semibold text-sand-200 hover:bg-white/5"
              >
                Return to Adventure
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-sand-200/15 bg-[#243036]/80 px-3 py-3 text-center">
      <p className="text-xl font-bold tabular-nums text-sand-50">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-sand-200/80">
        {label}
      </p>
    </div>
  );
}
