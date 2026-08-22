export type AdventurerRarity = "common" | "rare" | "legendary" | "mythic";

export const MYTHIC_QUOTES: Record<string, string> = {
  Heavensbearer: "Upon his shoulders, the heavens found their rest...",
  Suntouched: "Of fond desire to fly to Heaven...",
  Deicide: "His strength defied even the deathless...",
  Starforged: "When his hunt ended, the stars forged his legacy...",
};

export function getMythicQuote(title: string): string | null {
  return MYTHIC_QUOTES[title] ?? null;
}

/** Display as "Joshua the Storm Mage" */
export function formatAdventurerLine(
  displayName: string,
  title: string | null | undefined,
): string {
  if (!title) return displayName;
  return `${displayName} the ${title}`;
}

export function rarityTextClass(rarity: AdventurerRarity | null | undefined): string {
  switch (rarity) {
    case "rare":
      return "text-title-rare";
    case "legendary":
      return "text-title-legendary";
    case "mythic":
      return "text-title-mythic";
    case "common":
    default:
      return "text-title-common";
  }
}

export function isAdventurerRarity(value: unknown): value is AdventurerRarity {
  return (
    value === "common" ||
    value === "rare" ||
    value === "legendary" ||
    value === "mythic"
  );
}

export function parseAdventurerRarity(
  value: unknown,
): AdventurerRarity | null {
  if (isAdventurerRarity(value)) return value;
  return null;
}
