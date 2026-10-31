export const MEMBER_ROLES = ["owner", "manager", "employee"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const MEMBER_STATUSES = ["active", "invited", "disabled"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const KNOWLEDGE_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "archived",
] as const;
export type KnowledgeStatus = (typeof KNOWLEDGE_STATUSES)[number];

export const KNOWLEDGE_CATEGORIES = [
  "procedure",
  "equipment",
  "pricing",
  "customer",
  "supplier",
  "policy",
  "lesson",
] as const;
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export const SOURCE_TYPES = [
  "voice",
  "audio_upload",
  "note",
  "pdf",
  "txt",
  "docx",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const PROCESSING_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;
export type ProcessingStatus = (typeof PROCESSING_STATUSES)[number];

export const JOB_TYPES = ["transcribe", "extract", "embed"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const SENSITIVITY_LEVELS = ["general", "customer_specific"] as const;
export type SensitivityLevel = (typeof SENSITIVITY_LEVELS)[number];

export const RELATIONSHIP_TYPES = [
  "same_equipment",
  "same_procedure",
  "similar_problem",
  "related_customer",
  "semantic",
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const REVIEW_SIGNALS = [
  "needs_owner_review",
  "possible_pricing",
  "customer_specific",
  "incomplete",
  "conflicting",
  "low_context",
] as const;
export type ReviewSignal = (typeof REVIEW_SIGNALS)[number];

export type Organization = {
  id: string;
  name: string;
  slug: string;
  industry: string;
  settings: OrganizationSettings;
  isDemo: boolean;
  createdAt: string;
};

export type OrganizationSettings = {
  taxonomy: KnowledgeCategory[];
  limits: {
    members: number;
    capturesPerMonth: number;
  };
  industryLabel: string;
};

export type Profile = {
  id: string;
  fullName: string;
  email: string;
};

export type OrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: string;
};

export type Invitation = {
  id: string;
  organizationId: string;
  email: string;
  role: MemberRole;
  invitedBy: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

export type Customer = {
  id: string;
  organizationId: string;
  name: string;
  notes: string;
  createdAt: string;
};

export type Equipment = {
  id: string;
  organizationId: string;
  name: string;
  manufacturer: string | null;
  model: string | null;
  notes: string;
  createdAt: string;
};

export type Tag = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
};

export type SourceCapture = {
  id: string;
  organizationId: string;
  createdBy: string;
  sourceType: SourceType;
  originalFilename: string | null;
  storagePath: string | null;
  transcript: string | null;
  originalContent: string;
  processingStatus: ProcessingStatus;
  processingError: string | null;
  durationSeconds: number | null;
  tags: string[];
  relatedCustomerId: string | null;
  relatedEquipmentId: string | null;
  createdAt: string;
};

export type CaptureAttachment = {
  id: string;
  captureId: string;
  organizationId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string | null;
};

export type ProcessingJob = {
  id: string;
  organizationId: string;
  captureId: string | null;
  knowledgeEntryId: string | null;
  jobType: JobType;
  status: ProcessingStatus;
  attemptCount: number;
  idempotencyKey: string;
  lastError: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type KnowledgeEntry = {
  id: string;
  organizationId: string;
  category: KnowledgeCategory;
  title: string;
  summary: string;
  content: string;
  status: KnowledgeStatus;
  sensitivity: SensitivityLevel;
  customerId: string | null;
  equipmentId: string | null;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  currentVersion: number;
  reviewSignals: ReviewSignal[];
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeVersion = {
  id: string;
  knowledgeEntryId: string;
  organizationId: string;
  versionNumber: number;
  title: string;
  summary: string;
  content: string;
  changedBy: string;
  changeReason: string;
  createdAt: string;
};

export type KnowledgeSource = {
  id: string;
  knowledgeEntryId: string;
  captureId: string;
  organizationId: string;
  excerpt: string;
};

export type KnowledgeRelationship = {
  id: string;
  organizationId: string;
  fromEntryId: string;
  toEntryId: string;
  relationshipType: RelationshipType;
  note: string | null;
};

export type Conversation = {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type Citation = {
  knowledgeEntryId: string;
  title: string;
  status: KnowledgeStatus;
  excerpt: string;
  captureId: string | null;
};

export type ConversationMessage = {
  id: string;
  conversationId: string;
  organizationId: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  undocumented: boolean;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  organizationId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, string>;
  createdAt: string;
};

export type WorkspaceUser = Profile & {
  role: MemberRole;
};

export const CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  procedure: "Procedures",
  equipment: "Equipment",
  pricing: "Pricing",
  customer: "Customers",
  supplier: "Suppliers",
  policy: "Policies",
  lesson: "Lessons learned",
};

export const STATUS_LABELS: Record<KnowledgeStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  approved: "Approved",
  archived: "Archived",
};

export const SOURCE_LABELS: Record<SourceType, string> = {
  voice: "Voice note",
  audio_upload: "Audio upload",
  note: "Typed note",
  pdf: "PDF",
  txt: "Text file",
  docx: "Word document",
};

export const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  manager: "Manager",
  employee: "Employee",
};

export const ALLOWED_AUDIO_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/m4a",
  "audio/mp3",
  "audio/ogg",
];

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
