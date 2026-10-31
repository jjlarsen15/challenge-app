import type { ExtractionResult, GroundedAnswer } from "@/lib/ai/schemas";
import type { KnowledgeCategory, ReviewSignal } from "@/lib/types/domain";

const CATEGORY_HINTS: Array<{ keys: string[]; category: KnowledgeCategory }> = [
  { keys: ["price", "pricing", "rate", "fee", "dispatch", "weekend", "overtime"], category: "pricing" },
  { keys: ["procedure", "steps", "checklist", "always", "never"], category: "procedure" },
  { keys: ["carrier", "trane", "rheem", "furnace", "condenser", "coil", "thermostat"], category: "equipment" },
  { keys: ["customer", "homeowner", "gate code", "dog", "access"], category: "customer" },
  { keys: ["supplier", "vendor", "johnstone", "ferguson", "parts house"], category: "supplier" },
  { keys: ["policy", "uniform", "pto", "warranty"], category: "policy" },
  { keys: ["learned", "next time", "mistake", "watch out"], category: "lesson" },
];

function detectCategory(text: string): KnowledgeCategory {
  const haystack = text.toLowerCase();
  for (const hint of CATEGORY_HINTS) {
    if (hint.keys.some((key) => haystack.includes(key))) return hint.category;
  }
  return "lesson";
}

function detectSignals(text: string, category: KnowledgeCategory): ReviewSignal[] {
  const haystack = text.toLowerCase();
  const signals: ReviewSignal[] = ["needs_owner_review"];
  if (category === "pricing" || haystack.includes("price") || haystack.includes("$")) {
    signals.push("possible_pricing");
  }
  if (category === "customer" || haystack.includes("customer") || haystack.includes("gate")) {
    signals.push("customer_specific");
  }
  if (text.trim().split(/\s+/).length < 18) {
    signals.push("low_context");
  }
  return [...new Set(signals)];
}

function titleFrom(text: string, category: KnowledgeCategory): string {
  const firstSentence = text.split(/[.!?]/)[0]?.trim() ?? text.trim();
  if (firstSentence.length >= 8 && firstSentence.length <= 90) return firstSentence;
  const labels: Record<KnowledgeCategory, string> = {
    procedure: "Field procedure from capture",
    equipment: "Equipment observation",
    pricing: "Pricing note from the field",
    customer: "Customer-specific instruction",
    supplier: "Supplier preference",
    policy: "Company policy note",
    lesson: "Lesson learned",
  };
  return labels[category];
}

export async function mockTranscribe(input: { text?: string; filename?: string }): Promise<string> {
  if (input.text?.trim()) return input.text.trim();
  return [
    "[Demo transcript — labeled sample, not a live transcription]",
    "After the evening call, remember weekend emergency jobs are time-and-a-half plus a $95 dispatch fee.",
    "Do not quote Saturday morning as regular rate unless the owner approves an exception.",
    input.filename ? `Source file: ${input.filename}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function mockExtract(transcript: string): Promise<ExtractionResult> {
  const category = detectCategory(transcript);
  const reviewSignals = detectSignals(transcript, category);
  const title = titleFrom(transcript, category);
  const summary =
    transcript.length > 180 ? `${transcript.slice(0, 177).trim()}…` : transcript.trim();

  return {
    transcript,
    discardedReason: null,
    observations: [
      {
        title,
        summary,
        content: [
          transcript.trim(),
          "",
          "This draft was generated from a source capture. It is not approved company guidance until a manager or owner reviews it.",
        ].join("\n"),
        category,
        customerName: category === "customer" ? guessProperName(transcript) : null,
        equipmentName: category === "equipment" ? guessEquipment(transcript) : null,
        tags: guessTags(transcript, category),
        reviewSignals,
        suggestedStatus: "pending_review",
      },
    ],
  };
}

export async function mockAnswer(input: {
  question: string;
  approvedSnippets: Array<{ id: string; title: string; content: string }>;
}): Promise<GroundedAnswer> {
  if (input.approvedSnippets.length === 0) {
    return {
      answer:
        "This is not documented in approved company knowledge yet. Ask an owner or manager, then capture the answer so the team can reuse it.",
      undocumented: true,
      citationIds: [],
      escalateToHuman: true,
      escalationReason: "No approved knowledge matched this question.",
    };
  }

  const lines = input.approvedSnippets.map((snippet, index) => {
    const excerpt = snippet.content.slice(0, 420).trim();
    return `${index + 1}. ${snippet.title}\n${excerpt}`;
  });

  return {
    answer: [
      "Here is what approved company knowledge says:",
      "",
      ...lines,
      "",
      "I am not adding anything that is not in those records. If a job is unusual, check with a manager.",
    ].join("\n"),
    undocumented: false,
    citationIds: input.approvedSnippets.map((snippet) => snippet.id),
    escalateToHuman: false,
    escalationReason: null,
  };
}

function guessProperName(text: string): string | null {
  const match = text.match(/\b([A-Z][a-z]+)\s+(residence|house|family|home)\b/);
  return match ? match[1] : null;
}

function guessEquipment(text: string): string | null {
  const match = text.match(
    /\b(Carrier|Trane|Rheem|Lennox|Goodman|York)\b[^.]{0,40}/i,
  );
  return match ? match[0].trim() : null;
}

function guessTags(text: string, category: KnowledgeCategory): string[] {
  const tags = new Set<string>([category]);
  const haystack = text.toLowerCase();
  if (haystack.includes("weekend")) tags.add("after-hours");
  if (haystack.includes("emergency")) tags.add("emergency");
  if (haystack.includes("warranty")) tags.add("warranty");
  if (haystack.includes("drain")) tags.add("drain");
  return [...tags].slice(0, 5);
}
