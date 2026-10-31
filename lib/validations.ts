import { z } from "zod";
import {
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_STATUSES,
  MEMBER_ROLES,
  SOURCE_TYPES,
} from "@/lib/types/domain";

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Company name is required").max(80),
  industry: z.string().trim().min(2).max(40).default("hvac"),
});

export const inviteMemberSchema = z.object({
  email: z.email("Enter a valid email"),
  role: z.enum(MEMBER_ROLES),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  industry: z.string().trim().min(2).max(40),
});

const optionalId = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.uuid().optional(),
);

export const captureNoteSchema = z.object({
  content: z.string().trim().min(8, "Write a bit more so this can become useful knowledge").max(8000),
  relatedCustomerId: optionalId,
  relatedEquipmentId: optionalId,
});

export const captureMetaSchema = z.object({
  sourceType: z.enum(SOURCE_TYPES),
  filename: z.string().max(200).optional(),
  mimeType: z.string().max(120).optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  durationSeconds: z.number().nonnegative().optional(),
  relatedCustomerId: optionalId,
  relatedEquipmentId: optionalId,
});

export const knowledgeDraftSchema = z.object({
  title: z.string().trim().min(4).max(140),
  summary: z.string().trim().min(8).max(400),
  content: z.string().trim().min(12).max(12000),
  category: z.enum(KNOWLEDGE_CATEGORIES),
  status: z.enum(KNOWLEDGE_STATUSES),
});

export const reviewDecisionSchema = z.object({
  entryId: z.uuid(),
  title: z.string().trim().min(4).max(140),
  summary: z.string().trim().min(8).max(400),
  content: z.string().trim().min(12).max(12000),
  category: z.enum(KNOWLEDGE_CATEGORIES),
  decision: z.enum(["approve", "reject", "archive"]),
  reason: z.string().trim().max(500).optional(),
});

export const askQuestionSchema = z.object({
  conversationId: z.uuid().optional(),
  question: z.string().trim().min(4, "Ask a specific question").max(2000),
});

export const fileConstraints = {
  audio: {
    maxBytes: 25 * 1024 * 1024,
    extensions: [".webm", ".mp3", ".wav", ".m4a", ".ogg", ".mp4"],
    mimeTypes: [
      "audio/webm",
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "audio/mp4",
      "audio/m4a",
      "audio/ogg",
    ],
  },
  document: {
    maxBytes: 10 * 1024 * 1024,
    extensions: [".pdf", ".txt", ".docx"],
    mimeTypes: [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
} as const;

export function assertFileAllowed(file: {
  name: string;
  type: string;
  size: number;
}): { kind: "audio" | "document" } {
  const name = file.name.toLowerCase();
  const audio = fileConstraints.audio;
  const document = fileConstraints.document;

  if (
    audio.mimeTypes.includes(file.type as (typeof audio.mimeTypes)[number]) ||
    audio.extensions.some((ext) => name.endsWith(ext))
  ) {
    if (file.size > audio.maxBytes) {
      throw new Error("Audio files must be 25 MB or smaller");
    }
    return { kind: "audio" };
  }

  if (
    document.mimeTypes.includes(file.type as (typeof document.mimeTypes)[number]) ||
    document.extensions.some((ext) => name.endsWith(ext))
  ) {
    if (file.size > document.maxBytes) {
      throw new Error("Documents must be 10 MB or smaller");
    }
    return { kind: "document" };
  }

  throw new Error("Upload a voice file, PDF, TXT, or DOCX");
}
