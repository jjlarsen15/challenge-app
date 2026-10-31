"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { extractKnowledge } from "@/lib/ai/extraction";
import { transcribeCapture } from "@/lib/ai/transcription";
import { answerFromKnowledge } from "@/lib/ai/answering";
import { cosineSimilarity, embedTextLocal } from "@/lib/ai/embedding";
import { createDemoSnapshot, type WorkspaceSnapshot } from "@/lib/demo/seed";
import { DEMO_ORG_ID } from "@/lib/demo/ids";
import {
  canReviewKnowledge,
  canViewCustomerData,
  filterVisibleKnowledge,
} from "@/lib/permissions";
import type {
  KnowledgeCategory,
  KnowledgeEntry,
  MemberRole,
  SourceCapture,
  SourceType,
  WorkspaceUser,
} from "@/lib/types/domain";
import { slugify } from "@/lib/utils";
import { captureNoteSchema, inviteMemberSchema, reviewDecisionSchema } from "@/lib/validations";

const STORAGE_KEY = "owneros.demo.workspace.v1";

export const captureBlobs = new Map<string, Blob>();

type Action =
  | { type: "hydrate"; snapshot: WorkspaceSnapshot }
  | { type: "set-user"; userId: string }
  | { type: "add-capture"; capture: SourceCapture }
  | { type: "update-capture"; capture: SourceCapture }
  | { type: "add-knowledge"; entry: KnowledgeEntry; captureId: string; excerpt: string }
  | { type: "update-knowledge"; entry: KnowledgeEntry; reason: string; actorId: string }
  | {
      type: "ask";
      conversationId: string;
      title: string;
      userMessage: WorkspaceSnapshot["messages"][number];
      assistantMessage: WorkspaceSnapshot["messages"][number];
    }
  | { type: "invite"; email: string; role: MemberRole; actorId: string }
  | { type: "update-org"; name: string; industry: string };

function reducer(state: WorkspaceSnapshot, action: Action): WorkspaceSnapshot {
  switch (action.type) {
    case "hydrate":
      return action.snapshot;
    case "set-user":
      return { ...state, currentUserId: action.userId };
    case "add-capture":
      return {
        ...state,
        captures: [action.capture, ...state.captures],
        jobs: [
          {
            id: crypto.randomUUID(),
            organizationId: state.organization.id,
            captureId: action.capture.id,
            knowledgeEntryId: null,
            jobType: "extract",
            status: "pending",
            attemptCount: 0,
            idempotencyKey: `extract:${action.capture.id}`,
            lastError: null,
            createdAt: action.capture.createdAt,
            completedAt: null,
          },
          ...state.jobs,
        ],
      };
    case "update-capture":
      return {
        ...state,
        captures: state.captures.map((capture) =>
          capture.id === action.capture.id ? action.capture : capture,
        ),
        jobs: state.jobs.map((job) =>
          job.idempotencyKey === `extract:${action.capture.id}`
            ? {
                ...job,
                status: action.capture.processingStatus,
                attemptCount: Math.max(1, job.attemptCount),
                completedAt:
                  action.capture.processingStatus === "completed"
                    ? new Date().toISOString()
                    : job.completedAt,
              }
            : job,
        ),
      };
    case "add-knowledge":
      return {
        ...state,
        knowledge: [action.entry, ...state.knowledge],
        versions: [
          {
            id: crypto.randomUUID(),
            knowledgeEntryId: action.entry.id,
            organizationId: state.organization.id,
            versionNumber: 1,
            title: action.entry.title,
            summary: action.entry.summary,
            content: action.entry.content,
            changedBy: action.entry.createdBy,
            changeReason: "AI extraction draft",
            createdAt: action.entry.createdAt,
          },
          ...state.versions,
        ],
        sources: [
          {
            id: crypto.randomUUID(),
            knowledgeEntryId: action.entry.id,
            captureId: action.captureId,
            organizationId: state.organization.id,
            excerpt: action.excerpt,
          },
          ...state.sources,
        ],
        relationships: [
          ...inferRelationships(action.entry, state.knowledge).map((rel) => ({
            id: crypto.randomUUID(),
            organizationId: state.organization.id,
            fromEntryId: action.entry.id,
            toEntryId: rel.toEntryId,
            relationshipType: rel.relationshipType,
            note: rel.note,
          })),
          ...state.relationships,
        ],
      };
    case "update-knowledge": {
      const now = new Date().toISOString();
      return {
        ...state,
        knowledge: state.knowledge.map((entry) =>
          entry.id === action.entry.id ? action.entry : entry,
        ),
        versions: [
          {
            id: crypto.randomUUID(),
            knowledgeEntryId: action.entry.id,
            organizationId: state.organization.id,
            versionNumber: action.entry.currentVersion,
            title: action.entry.title,
            summary: action.entry.summary,
            content: action.entry.content,
            changedBy: action.actorId,
            changeReason: action.reason,
            createdAt: now,
          },
          ...state.versions,
        ],
        audit: [
          {
            id: crypto.randomUUID(),
            organizationId: state.organization.id,
            actorId: action.actorId,
            action: `knowledge.${action.entry.status}`,
            entityType: "knowledge_entry",
            entityId: action.entry.id,
            metadata: { title: action.entry.title },
            createdAt: now,
          },
          ...state.audit,
        ],
      };
    }
    case "ask": {
      const existing = state.conversations.find((item) => item.id === action.conversationId);
      return {
        ...state,
        conversations: existing
          ? state.conversations.map((item) =>
              item.id === action.conversationId
                ? { ...item, title: action.title, updatedAt: action.assistantMessage.createdAt }
                : item,
            )
          : [
              {
                id: action.conversationId,
                organizationId: state.organization.id,
                userId: state.currentUserId,
                title: action.title,
                createdAt: action.userMessage.createdAt,
                updatedAt: action.assistantMessage.createdAt,
              },
              ...state.conversations,
            ],
        messages: [...state.messages, action.userMessage, action.assistantMessage],
      };
    }
    case "invite": {
      const parsed = inviteMemberSchema.parse({ email: action.email, role: action.role });
      return {
        ...state,
        invitations: [
          {
            id: crypto.randomUUID(),
            organizationId: state.organization.id,
            email: parsed.email,
            role: parsed.role,
            invitedBy: action.actorId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            acceptedAt: null,
            createdAt: new Date().toISOString(),
          },
          ...state.invitations,
        ],
      };
    }
    case "update-org":
      return {
        ...state,
        organization: {
          ...state.organization,
          name: action.name,
          industry: action.industry,
          settings: {
            ...state.organization.settings,
            industryLabel:
              action.industry === "hvac"
                ? "HVAC and specialty trades"
                : action.industry,
          },
        },
      };
    default:
      return state;
  }
}

function inferRelationships(
  entry: KnowledgeEntry,
  existing: KnowledgeEntry[],
): Array<{
  toEntryId: string;
  relationshipType: WorkspaceSnapshot["relationships"][number]["relationshipType"];
  note: string;
}> {
  const results: Array<{
    toEntryId: string;
    relationshipType: WorkspaceSnapshot["relationships"][number]["relationshipType"];
    note: string;
  }> = [];

  for (const other of existing) {
    if (entry.equipmentId && other.equipmentId === entry.equipmentId) {
      results.push({
        toEntryId: other.id,
        relationshipType: "same_equipment",
        note: "Same equipment record",
      });
    } else if (entry.customerId && other.customerId === entry.customerId) {
      results.push({
        toEntryId: other.id,
        relationshipType: "related_customer",
        note: "Same customer record",
      });
    } else if (entry.category === other.category) {
      const score = cosineSimilarity(
        embedTextLocal(`${entry.title} ${entry.summary}`),
        embedTextLocal(`${other.title} ${other.summary}`),
      );
      if (score >= 0.72) {
        results.push({
          toEntryId: other.id,
          relationshipType: entry.category === "procedure" ? "same_procedure" : "semantic",
          note: "Similar wording",
        });
      }
    }
  }

  return results.slice(0, 4);
}

type WorkspaceContextValue = {
  ready: boolean;
  snapshot: WorkspaceSnapshot;
  currentUser: WorkspaceUser;
  visibleKnowledge: KnowledgeEntry[];
  pendingReview: KnowledgeEntry[];
  profileName: (userId: string) => string;
  switchDemoUser: (userId: string) => void;
  resetDemo: () => void;
  createNoteCapture: (content: string) => Promise<SourceCapture>;
  createFileCapture: (file: File) => Promise<SourceCapture>;
  createVoiceCapture: (blob: Blob, durationSeconds: number) => Promise<SourceCapture>;
  reviewEntry: (input: {
    entryId: string;
    title: string;
    summary: string;
    content: string;
    category: KnowledgeCategory;
    decision: "approve" | "reject" | "archive";
    reason?: string;
  }) => void;
  ask: (question: string, conversationId?: string) => Promise<string>;
  invite: (email: string, role: MemberRole) => void;
  updateOrganization: (name: string, industry: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, dispatch] = useReducer(reducer, null, createDemoSnapshot);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        dispatch({ type: "hydrate", snapshot: JSON.parse(raw) as WorkspaceSnapshot });
      }
    } catch {
      dispatch({ type: "hydrate", snapshot: createDemoSnapshot() });
    }
    // Hydration from localStorage has to happen after mount so SSR markup stays stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client persistence bootstrap
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }, [ready, snapshot]);

  const currentUser = useMemo<WorkspaceUser>(() => {
    const member = snapshot.members.find((item) => item.userId === snapshot.currentUserId);
    const profile = snapshot.profiles.find((item) => item.id === snapshot.currentUserId);
    return {
      id: snapshot.currentUserId,
      fullName: profile?.fullName ?? "Unknown",
      email: profile?.email ?? "",
      role: member?.role ?? "employee",
    };
  }, [snapshot.currentUserId, snapshot.members, snapshot.profiles]);

  const visibleKnowledge = useMemo(
    () => filterVisibleKnowledge(currentUser, snapshot.knowledge),
    [currentUser, snapshot.knowledge],
  );

  const pendingReview = useMemo(
    () =>
      visibleKnowledge.filter(
        (entry) => entry.status === "pending_review" || entry.status === "draft",
      ),
    [visibleKnowledge],
  );

  const profileName = useCallback(
    (userId: string) => snapshot.profiles.find((item) => item.id === userId)?.fullName ?? "Teammate",
    [snapshot.profiles],
  );

  const processCapture = useCallback(
    async (capture: SourceCapture, text: string) => {
      dispatch({
        type: "update-capture",
        capture: { ...capture, processingStatus: "processing" },
      });

      await new Promise((resolve) => setTimeout(resolve, 700));

      const { transcript } = await transcribeCapture({
        text,
        filename: capture.originalFilename ?? undefined,
      });
      const extraction = await extractKnowledge(transcript);
      const now = new Date().toISOString();

      const completed: SourceCapture = {
        ...capture,
        transcript,
        originalContent: transcript,
        processingStatus: "completed",
      };
      dispatch({ type: "update-capture", capture: completed });

      for (const observation of extraction.observations) {
        const tagIds = observation.tags.map((tagName) => {
          const existing = snapshot.tags.find((tag) => tag.slug === slugify(tagName));
          return existing?.id ?? snapshot.tags[0]?.id;
        }).filter(Boolean) as string[];

        const entry: KnowledgeEntry = {
          id: crypto.randomUUID(),
          organizationId: DEMO_ORG_ID,
          category: observation.category,
          title: observation.title,
          summary: observation.summary,
          content: observation.content,
          status: "pending_review",
          sensitivity:
            observation.category === "customer" || observation.reviewSignals.includes("customer_specific")
              ? "customer_specific"
              : "general",
          customerId: capture.relatedCustomerId,
          equipmentId: capture.relatedEquipmentId,
          createdBy: capture.createdBy,
          approvedBy: null,
          approvedAt: null,
          currentVersion: 1,
          reviewSignals: observation.reviewSignals,
          tagIds,
          createdAt: now,
          updatedAt: now,
        };

        dispatch({
          type: "add-knowledge",
          entry,
          captureId: capture.id,
          excerpt: transcript.slice(0, 240),
        });
      }

      return completed;
    },
    [snapshot.tags],
  );

  const createNoteCapture = useCallback(
    async (content: string) => {
      const parsed = captureNoteSchema.parse({ content });
      const now = new Date().toISOString();
      const capture: SourceCapture = {
        id: crypto.randomUUID(),
        organizationId: DEMO_ORG_ID,
        createdBy: currentUser.id,
        sourceType: "note",
        originalFilename: null,
        storagePath: null,
        transcript: parsed.content,
        originalContent: parsed.content,
        processingStatus: "pending",
        processingError: null,
        durationSeconds: null,
        tags: [],
        relatedCustomerId: null,
        relatedEquipmentId: null,
        createdAt: now,
      };
      dispatch({ type: "add-capture", capture });
      return processCapture(capture, parsed.content);
    },
    [currentUser.id, processCapture],
  );

  const createFileCapture = useCallback(
    async (file: File) => {
      const now = new Date().toISOString();
      const isAudio = file.type.startsWith("audio/");
      const sourceType: SourceType = isAudio
        ? "audio_upload"
        : file.name.toLowerCase().endsWith(".pdf")
          ? "pdf"
          : file.name.toLowerCase().endsWith(".docx")
            ? "docx"
            : "txt";
      let text = "";
      if (sourceType === "txt" || file.type === "text/plain") {
        text = await file.text();
      }
      const capture: SourceCapture = {
        id: crypto.randomUUID(),
        organizationId: DEMO_ORG_ID,
        createdBy: currentUser.id,
        sourceType,
        originalFilename: file.name,
        storagePath: null,
        transcript: text || null,
        originalContent: text,
        processingStatus: "pending",
        processingError: null,
        durationSeconds: null,
        tags: [],
        relatedCustomerId: null,
        relatedEquipmentId: null,
        createdAt: now,
      };
      if (isAudio) captureBlobs.set(capture.id, file);
      dispatch({ type: "add-capture", capture });
      return processCapture(
        capture,
        text || `Uploaded ${file.name}. Extract useful field knowledge from this document.`,
      );
    },
    [currentUser.id, processCapture],
  );

  const createVoiceCapture = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      const now = new Date().toISOString();
      const capture: SourceCapture = {
        id: crypto.randomUUID(),
        organizationId: DEMO_ORG_ID,
        createdBy: currentUser.id,
        sourceType: "voice",
        originalFilename: "voice-note.webm",
        storagePath: null,
        transcript: null,
        originalContent: "",
        processingStatus: "pending",
        processingError: null,
        durationSeconds,
        tags: [],
        relatedCustomerId: null,
        relatedEquipmentId: null,
        createdAt: now,
      };
      captureBlobs.set(capture.id, blob);
      dispatch({ type: "add-capture", capture });
      return processCapture(capture, "");
    },
    [currentUser.id, processCapture],
  );

  const reviewEntry = useCallback(
    (input: {
      entryId: string;
      title: string;
      summary: string;
      content: string;
      category: KnowledgeCategory;
      decision: "approve" | "reject" | "archive";
      reason?: string;
    }) => {
      if (!canReviewKnowledge(currentUser.role)) {
        throw new Error("Only owners and managers can review knowledge");
      }
      const parsed = reviewDecisionSchema.parse(input);
      const existing = snapshot.knowledge.find((entry) => entry.id === parsed.entryId);
      if (!existing) throw new Error("Knowledge entry not found");

      const now = new Date().toISOString();
      const status =
        parsed.decision === "approve"
          ? "approved"
          : parsed.decision === "archive"
            ? "archived"
            : "archived";

      dispatch({
        type: "update-knowledge",
        actorId: currentUser.id,
        reason: parsed.reason ?? parsed.decision,
        entry: {
          ...existing,
          title: parsed.title,
          summary: parsed.summary,
          content: parsed.content,
          category: parsed.category,
          status,
          approvedBy: parsed.decision === "approve" ? currentUser.id : existing.approvedBy,
          approvedAt: parsed.decision === "approve" ? now : existing.approvedAt,
          currentVersion: existing.currentVersion + 1,
          updatedAt: now,
        },
      });
    },
    [currentUser.id, currentUser.role, snapshot.knowledge],
  );

  const ask = useCallback(
    async (question: string, conversationId?: string) => {
      const id = conversationId ?? crypto.randomUUID();
      const now = new Date().toISOString();
      const { answer, citations } = await answerFromKnowledge({
        question,
        entries: visibleKnowledge,
        role: currentUser.role,
      });
      dispatch({
        type: "ask",
        conversationId: id,
        title: question.slice(0, 72),
        userMessage: {
          id: crypto.randomUUID(),
          conversationId: id,
          organizationId: DEMO_ORG_ID,
          role: "user",
          content: question,
          citations: [],
          undocumented: false,
          createdAt: now,
        },
        assistantMessage: {
          id: crypto.randomUUID(),
          conversationId: id,
          organizationId: DEMO_ORG_ID,
          role: "assistant",
          content: answer.answer,
          citations: citations.map((citation) => ({
            ...citation,
            captureId:
              snapshot.sources.find((source) => source.knowledgeEntryId === citation.knowledgeEntryId)
                ?.captureId ?? null,
          })),
          undocumented: answer.undocumented,
          createdAt: new Date().toISOString(),
        },
      });
      return id;
    },
    [currentUser.role, snapshot.sources, visibleKnowledge],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ready,
      snapshot,
      currentUser,
      visibleKnowledge,
      pendingReview,
      profileName,
      switchDemoUser: (userId: string) => dispatch({ type: "set-user", userId }),
      resetDemo: () => {
        captureBlobs.clear();
        window.localStorage.removeItem(STORAGE_KEY);
        dispatch({ type: "hydrate", snapshot: createDemoSnapshot() });
      },
      createNoteCapture,
      createFileCapture,
      createVoiceCapture,
      reviewEntry,
      ask,
      invite: (email, role) =>
        dispatch({ type: "invite", email, role, actorId: currentUser.id }),
      updateOrganization: (name, industry) => dispatch({ type: "update-org", name, industry }),
    }),
    [
      ask,
      createFileCapture,
      createNoteCapture,
      createVoiceCapture,
      currentUser,
      pendingReview,
      profileName,
      ready,
      reviewEntry,
      snapshot,
      visibleKnowledge,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return value;
}

export function useCanViewCustomers() {
  const { currentUser } = useWorkspace();
  return canViewCustomerData(currentUser.role);
}
