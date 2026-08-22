import { formatPercent } from "@/lib/utils";
import type {
  AdventurerRarity,
  CategoryWithStats,
  ChallengeWithProgress,
  DbContribution,
  DbMember,
} from "@/lib/types";

export type PartyMemberResult = {
  memberId: string;
  displayName: string;
  adventurerTitle: string | null;
  adventurerRarity: AdventurerRarity | null;
  totalContributed: number;
  questsTouched: number;
};

export type LocationResult = {
  id: string;
  name: string;
  challengeCount: number;
  completedCount: number;
  cleared: boolean;
};

export type UnfinishedQuest = {
  id: string;
  name: string;
  locationName: string;
  progress: number;
  goal: number;
  percent: number;
};

export type AwardKind = "top_contributor" | "quest_seeker" | "final_hand";

export type AwardWinner = {
  memberId: string;
  displayName: string;
  adventurerTitle: string | null;
  adventurerRarity: AdventurerRarity | null;
  detail: string;
};

export type AdventureAward = {
  kind: AwardKind;
  label: string;
  winners: AwardWinner[];
};

export type AdventureResults = {
  questsCompleted: number;
  totalQuests: number;
  locationsCleared: number;
  totalLocations: number;
  completionPercent: number;
  totalProgress: number;
  adventurerCount: number;
  isPerfect: boolean;
  party: PartyMemberResult[];
  locations: LocationResult[];
  unfinishedQuests: UnfinishedQuest[];
  awards: AdventureAward[];
};

function isQuestComplete(ch: ChallengeWithProgress): boolean {
  return ch.goal > 0 && ch.progress >= ch.goal;
}

function isStageCleared(category: CategoryWithStats): boolean {
  return category.challengeCount > 0 && category.completedCount >= category.challengeCount;
}

export function buildAdventureResults(
  members: DbMember[],
  categories: CategoryWithStats[],
  challenges: ChallengeWithProgress[],
  contributions: DbContribution[],
): AdventureResults {
  const totalQuests = challenges.length;
  const questsCompleted = challenges.filter(isQuestComplete).length;
  const totalLocations = categories.length;
  const locationsCleared = categories.filter(isStageCleared).length;
  // Average of each quest's completion % (capped at 100), equal weight per quest.
  const completionPercent =
    totalQuests === 0
      ? 0
      : Math.round(
          (challenges.reduce((sum, ch) => {
            if (ch.goal <= 0) return sum;
            return sum + Math.min(1, Math.max(0, ch.progress) / ch.goal);
          }, 0) /
            totalQuests) *
            100,
        );
  const totalProgress = challenges.reduce((sum, ch) => sum + Math.max(0, ch.progress), 0);
  const isPerfect = totalQuests > 0 && questsCompleted === totalQuests;

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const amountByMember = new Map<string, number>();
  const questsByMember = new Map<string, Set<string>>();

  for (const c of contributions) {
    amountByMember.set(c.member_id, (amountByMember.get(c.member_id) ?? 0) + c.amount);
    if (!questsByMember.has(c.member_id)) {
      questsByMember.set(c.member_id, new Set());
    }
    questsByMember.get(c.member_id)!.add(c.challenge_id);
  }

  const party: PartyMemberResult[] = members
    .map((m) => ({
      memberId: m.id,
      displayName: m.display_name,
      adventurerTitle: m.adventurer_title,
      adventurerRarity: m.adventurer_rarity,
      totalContributed: amountByMember.get(m.id) ?? 0,
      questsTouched: questsByMember.get(m.id)?.size ?? 0,
    }))
    .sort((a, b) => {
      if (b.totalContributed !== a.totalContributed) {
        return b.totalContributed - a.totalContributed;
      }
      return a.displayName.localeCompare(b.displayName);
    });

  const locations: LocationResult[] = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    challengeCount: cat.challengeCount,
    completedCount: cat.completedCount,
    cleared: isStageCleared(cat),
  }));

  const unfinishedQuests: UnfinishedQuest[] = challenges
    .filter((ch) => !isQuestComplete(ch))
    .map((ch) => ({
      id: ch.id,
      name: ch.name,
      locationName: categoryNameById.get(ch.categoryId) ?? "Unknown",
      progress: ch.progress,
      goal: ch.goal,
      percent: formatPercent(ch.progress, ch.goal),
    }))
    .sort((a, b) => a.locationName.localeCompare(b.locationName) || a.name.localeCompare(b.name));

  const awards = buildAwards(party, contributions, members);

  return {
    questsCompleted,
    totalQuests,
    locationsCleared,
    totalLocations,
    completionPercent,
    totalProgress,
    adventurerCount: members.length,
    isPerfect,
    party,
    locations,
    unfinishedQuests,
    awards,
  };
}

function buildAwards(
  party: PartyMemberResult[],
  contributions: DbContribution[],
  members: DbMember[],
): AdventureAward[] {
  const awards: AdventureAward[] = [];
  const memberById = new Map(members.map((m) => [m.id, m]));

  const withProgress = party.filter((p) => p.totalContributed > 0);
  if (withProgress.length > 0) {
    const topAmount = Math.max(...withProgress.map((p) => p.totalContributed));
    const winners = withProgress.filter((p) => p.totalContributed === topAmount);
    awards.push({
      kind: "top_contributor",
      label: winners.length > 1 ? "Top Contributors" : "Top Contributor",
      winners: winners.map((w) => ({
        memberId: w.memberId,
        displayName: w.displayName,
        adventurerTitle: w.adventurerTitle,
        adventurerRarity: w.adventurerRarity,
        detail: `${w.totalContributed.toLocaleString()} total progress`,
      })),
    });
  }

  const withQuests = party.filter((p) => p.questsTouched > 0);
  if (withQuests.length > 0) {
    const topQuests = Math.max(...withQuests.map((p) => p.questsTouched));
    const winners = withQuests.filter((p) => p.questsTouched === topQuests);
    awards.push({
      kind: "quest_seeker",
      label: winners.length > 1 ? "Quest Seekers" : "Quest Seeker",
      winners: winners.map((w) => ({
        memberId: w.memberId,
        displayName: w.displayName,
        adventurerTitle: w.adventurerTitle,
        adventurerRarity: w.adventurerRarity,
        detail: `${w.questsTouched} ${w.questsTouched === 1 ? "quest" : "quests"} touched`,
      })),
    });
  }

  if (contributions.length > 0) {
    let latestMs = -Infinity;
    for (const c of contributions) {
      const ms = new Date(c.created_at).getTime();
      if (Number.isFinite(ms) && ms > latestMs) latestMs = ms;
    }

    if (Number.isFinite(latestMs) && latestMs > -Infinity) {
      const finalContribs = contributions.filter(
        (c) => new Date(c.created_at).getTime() === latestMs,
      );
      const seen = new Set<string>();
      const winners: AwardWinner[] = [];
      for (const c of finalContribs) {
        if (seen.has(c.member_id)) continue;
        seen.add(c.member_id);
        const member = memberById.get(c.member_id);
        const partyRow = party.find((p) => p.memberId === c.member_id);
        winners.push({
          memberId: c.member_id,
          displayName: member?.display_name ?? partyRow?.displayName ?? "Unknown",
          adventurerTitle: member?.adventurer_title ?? partyRow?.adventurerTitle ?? null,
          adventurerRarity: member?.adventurer_rarity ?? partyRow?.adventurerRarity ?? null,
          detail: "Last contribution before time expired",
        });
      }
      if (winners.length > 0) {
        awards.push({
          kind: "final_hand",
          label: winners.length > 1 ? "Final Hands" : "Final Hand",
          winners,
        });
      }
    }
  }

  return awards;
}

export function gameOverDismissKey(roomId: string): string {
  return `adventure_game_over_dismissed:${roomId}`;
}
