import {
  DEMO_CAPTURES,
  DEMO_CONVERSATION,
  DEMO_CUSTOMERS,
  DEMO_EQUIPMENT,
  DEMO_KNOWLEDGE,
  DEMO_ORG_ID,
  DEMO_TAGS,
  DEMO_USERS,
} from "@/lib/demo/ids";
import type {
  AuditEvent,
  Conversation,
  ConversationMessage,
  Customer,
  Equipment,
  Invitation,
  KnowledgeEntry,
  KnowledgeRelationship,
  KnowledgeSource,
  KnowledgeVersion,
  Organization,
  OrganizationMember,
  ProcessingJob,
  Profile,
  SourceCapture,
  Tag,
} from "@/lib/types/domain";

function at(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

export type WorkspaceSnapshot = {
  organization: Organization;
  profiles: Profile[];
  members: OrganizationMember[];
  invitations: Invitation[];
  customers: Customer[];
  equipment: Equipment[];
  tags: Tag[];
  captures: SourceCapture[];
  jobs: ProcessingJob[];
  knowledge: KnowledgeEntry[];
  versions: KnowledgeVersion[];
  sources: KnowledgeSource[];
  relationships: KnowledgeRelationship[];
  conversations: Conversation[];
  messages: ConversationMessage[];
  audit: AuditEvent[];
  currentUserId: string;
};

export function createDemoSnapshot(): WorkspaceSnapshot {
  const organization: Organization = {
    id: DEMO_ORG_ID,
    name: "Peakline HVAC",
    slug: "peakline-hvac",
    industry: "hvac",
    isDemo: true,
    createdAt: at(240),
    settings: {
      taxonomy: [
        "procedure",
        "equipment",
        "pricing",
        "customer",
        "supplier",
        "policy",
        "lesson",
      ],
      limits: { members: 30, capturesPerMonth: 200 },
      industryLabel: "HVAC and specialty trades",
    },
  };

  const profiles: Profile[] = [
    { id: DEMO_USERS.jordan, fullName: "Jordan Hale", email: "jordan@peakline.demo" },
    { id: DEMO_USERS.sam, fullName: "Sam Ortiz", email: "sam@peakline.demo" },
    { id: DEMO_USERS.riley, fullName: "Riley Chen", email: "riley@peakline.demo" },
    { id: DEMO_USERS.morgan, fullName: "Morgan Blake", email: "morgan@peakline.demo" },
  ];

  const members: OrganizationMember[] = [
    {
      id: "aaaaaaa1-0000-4000-8000-000000000001",
      organizationId: DEMO_ORG_ID,
      userId: DEMO_USERS.jordan,
      role: "owner",
      status: "active",
      createdAt: at(240),
    },
    {
      id: "aaaaaaa1-0000-4000-8000-000000000002",
      organizationId: DEMO_ORG_ID,
      userId: DEMO_USERS.sam,
      role: "manager",
      status: "active",
      createdAt: at(200),
    },
    {
      id: "aaaaaaa1-0000-4000-8000-000000000003",
      organizationId: DEMO_ORG_ID,
      userId: DEMO_USERS.riley,
      role: "employee",
      status: "active",
      createdAt: at(180),
    },
    {
      id: "aaaaaaa1-0000-4000-8000-000000000004",
      organizationId: DEMO_ORG_ID,
      userId: DEMO_USERS.morgan,
      role: "employee",
      status: "active",
      createdAt: at(160),
    },
  ];

  const invitations: Invitation[] = [
    {
      id: "bbbbbbb1-0000-4000-8000-000000000001",
      organizationId: DEMO_ORG_ID,
      email: "alex@peakline.demo",
      role: "employee",
      invitedBy: DEMO_USERS.jordan,
      expiresAt: at(-72),
      acceptedAt: null,
      createdAt: at(12),
    },
  ];

  const customers: Customer[] = [
    {
      id: DEMO_CUSTOMERS.johnson,
      organizationId: DEMO_ORG_ID,
      name: "Johnson residence",
      notes: "High-end Cherry Creek home. Gate and dogs.",
      createdAt: at(90),
    },
    {
      id: DEMO_CUSTOMERS.miller,
      organizationId: DEMO_ORG_ID,
      name: "Miller Dental",
      notes: "Commercial rooftop. After-hours only with manager approval.",
      createdAt: at(70),
    },
  ];

  const equipment: Equipment[] = [
    {
      id: DEMO_EQUIPMENT.carrier,
      organizationId: DEMO_ORG_ID,
      name: "Carrier 24ACC6",
      manufacturer: "Carrier",
      model: "24ACC6",
      notes: "Common condenser in our Denver service area.",
      createdAt: at(80),
    },
    {
      id: DEMO_EQUIPMENT.attic,
      organizationId: DEMO_ORG_ID,
      name: "Attic air handler",
      manufacturer: null,
      model: null,
      notes: "Access varies by home. Capture pull-down stairs and insulation notes.",
      createdAt: at(50),
    },
  ];

  const tags: Tag[] = [
    { id: DEMO_TAGS.afterHours, organizationId: DEMO_ORG_ID, name: "after-hours", slug: "after-hours" },
    { id: DEMO_TAGS.emergency, organizationId: DEMO_ORG_ID, name: "emergency", slug: "emergency" },
    { id: DEMO_TAGS.drain, organizationId: DEMO_ORG_ID, name: "drain", slug: "drain" },
    { id: DEMO_TAGS.warranty, organizationId: DEMO_ORG_ID, name: "warranty", slug: "warranty" },
    { id: DEMO_TAGS.access, organizationId: DEMO_ORG_ID, name: "access", slug: "access" },
  ];

  const captures: SourceCapture[] = [
    {
      id: DEMO_CAPTURES.weekendVoice,
      organizationId: DEMO_ORG_ID,
      createdBy: DEMO_USERS.riley,
      sourceType: "voice",
      originalFilename: "weekend-call.webm",
      storagePath: null,
      transcript:
        "Quick note after the Saturday emergency. Weekend emergency jobs are time-and-a-half plus a $95 dispatch fee. Do not quote Saturday morning as regular rate unless Jordan approves an exception.",
      originalContent:
        "Quick note after the Saturday emergency. Weekend emergency jobs are time-and-a-half plus a $95 dispatch fee. Do not quote Saturday morning as regular rate unless Jordan approves an exception.",
      processingStatus: "completed",
      processingError: null,
      durationSeconds: 28,
      tags: ["after-hours", "emergency"],
      relatedCustomerId: null,
      relatedEquipmentId: null,
      createdAt: at(30),
    },
    {
      id: DEMO_CAPTURES.johnsonNote,
      organizationId: DEMO_ORG_ID,
      createdBy: DEMO_USERS.morgan,
      sourceType: "note",
      originalFilename: null,
      storagePath: null,
      transcript: null,
      originalContent:
        "Johnson residence: side gate code is 1947. Both dogs are friendly but must stay in the backyard. Park on the street, not the driveway. Homeowner prefers morning windows.",
      processingStatus: "completed",
      processingError: null,
      durationSeconds: null,
      tags: ["access"],
      relatedCustomerId: DEMO_CUSTOMERS.johnson,
      relatedEquipmentId: null,
      createdAt: at(20),
    },
    {
      id: DEMO_CAPTURES.hardStart,
      organizationId: DEMO_ORG_ID,
      createdBy: DEMO_USERS.sam,
      sourceType: "note",
      originalFilename: null,
      storagePath: null,
      transcript: null,
      originalContent:
        "Carrier 24ACC6 units around 2018-2020 keep failing on hard start. We have had luck with a 5-2-1 hard start kit before replacing the compressor. Confirm warranty status first.",
      processingStatus: "completed",
      processingError: null,
      durationSeconds: null,
      tags: ["warranty"],
      relatedCustomerId: null,
      relatedEquipmentId: DEMO_EQUIPMENT.carrier,
      createdAt: at(16),
    },
    {
      id: DEMO_CAPTURES.drainPdf,
      organizationId: DEMO_ORG_ID,
      createdBy: DEMO_USERS.jordan,
      sourceType: "pdf",
      originalFilename: "winter-condensate-checklist.pdf",
      storagePath: null,
      transcript: null,
      originalContent:
        "Winter condensate procedure: clear the drain, add pan tablets, confirm heat tape on the line, and photograph the trap. If the attic is below freezing, add insulation around the trap before leaving.",
      processingStatus: "completed",
      processingError: null,
      durationSeconds: null,
      tags: ["drain"],
      relatedCustomerId: null,
      relatedEquipmentId: DEMO_EQUIPMENT.attic,
      createdAt: at(10),
    },
    {
      id: DEMO_CAPTURES.atticDraft,
      organizationId: DEMO_ORG_ID,
      createdBy: DEMO_USERS.riley,
      sourceType: "voice",
      originalFilename: "attic-access.webm",
      storagePath: null,
      transcript:
        "The Miller Dental attic unit is a tight pull through a ceiling hatch in the storage closet. Need a second tech and a zipper bag for ceiling dust. Do not quote this as a standard rooftop call.",
      originalContent:
        "The Miller Dental attic unit is a tight pull through a ceiling hatch in the storage closet. Need a second tech and a zipper bag for ceiling dust. Do not quote this as a standard rooftop call.",
      processingStatus: "completed",
      processingError: null,
      durationSeconds: 22,
      tags: ["access"],
      relatedCustomerId: DEMO_CUSTOMERS.miller,
      relatedEquipmentId: DEMO_EQUIPMENT.attic,
      createdAt: at(4),
    },
  ];

  const knowledge: KnowledgeEntry[] = [
    {
      id: DEMO_KNOWLEDGE.weekendPricing,
      organizationId: DEMO_ORG_ID,
      category: "pricing",
      title: "Weekend emergency call pricing",
      summary:
        "Weekend emergency work is billed at time-and-a-half plus a $95 dispatch fee unless the owner approves an exception.",
      content:
        "For after-hours and weekend emergency calls, quote time-and-a-half labor plus a $95 dispatch fee. Saturday morning is not regular rate. Any exception needs owner approval before the customer is quoted. This is approved company pricing guidance.",
      status: "approved",
      sensitivity: "general",
      customerId: null,
      equipmentId: null,
      createdBy: DEMO_USERS.riley,
      approvedBy: DEMO_USERS.jordan,
      approvedAt: at(28),
      currentVersion: 1,
      reviewSignals: ["possible_pricing"],
      tagIds: [DEMO_TAGS.afterHours, DEMO_TAGS.emergency],
      createdAt: at(30),
      updatedAt: at(28),
    },
    {
      id: DEMO_KNOWLEDGE.hardStart,
      organizationId: DEMO_ORG_ID,
      category: "equipment",
      title: "Carrier 24ACC6 hard start pattern",
      summary:
        "2018-2020 Carrier 24ACC6 condensers often need a 5-2-1 hard start kit before compressor replacement.",
      content:
        "We have seen repeated hard-start failures on Carrier 24ACC6 condensers from roughly 2018 to 2020. Check warranty coverage first. If the compressor is still in play, a 5-2-1 hard start kit has resolved several callbacks. Do not skip capacitor testing. This is a field lesson, not a manufacturer bulletin.",
      status: "approved",
      sensitivity: "general",
      customerId: null,
      equipmentId: DEMO_EQUIPMENT.carrier,
      createdBy: DEMO_USERS.sam,
      approvedBy: DEMO_USERS.jordan,
      approvedAt: at(14),
      currentVersion: 1,
      reviewSignals: ["needs_owner_review"],
      tagIds: [DEMO_TAGS.warranty],
      createdAt: at(16),
      updatedAt: at(14),
    },
    {
      id: DEMO_KNOWLEDGE.johnsonAccess,
      organizationId: DEMO_ORG_ID,
      category: "customer",
      title: "Johnson residence access instructions",
      summary:
        "Side gate code 1947, dogs in the backyard, street parking only, morning windows preferred.",
      content:
        "Customer-specific instructions for the Johnson residence in Cherry Creek: use side gate code 1947, keep both dogs in the backyard, park on the street rather than the driveway, and offer morning appointment windows when possible.",
      status: "approved",
      sensitivity: "customer_specific",
      customerId: DEMO_CUSTOMERS.johnson,
      equipmentId: null,
      createdBy: DEMO_USERS.morgan,
      approvedBy: DEMO_USERS.sam,
      approvedAt: at(18),
      currentVersion: 1,
      reviewSignals: ["customer_specific"],
      tagIds: [DEMO_TAGS.access],
      createdAt: at(20),
      updatedAt: at(18),
    },
    {
      id: DEMO_KNOWLEDGE.johnstone,
      organizationId: DEMO_ORG_ID,
      category: "supplier",
      title: "Preferred supplier for OEM replacement parts",
      summary: "Use Johnstone for OEM parts unless the customer already has a warranty parts account.",
      content:
        "Peakline prefers Johnstone Supply for OEM replacement parts. Ferguson is the backup when Johnstone is out. Do not buy the cheapest aftermarket motor unless the customer declines OEM and the manager agrees. Keep receipts with the job notes.",
      status: "approved",
      sensitivity: "general",
      customerId: null,
      equipmentId: null,
      createdBy: DEMO_USERS.jordan,
      approvedBy: DEMO_USERS.jordan,
      approvedAt: at(40),
      currentVersion: 1,
      reviewSignals: [],
      tagIds: [],
      createdAt: at(48),
      updatedAt: at(40),
    },
    {
      id: DEMO_KNOWLEDGE.condensate,
      organizationId: DEMO_ORG_ID,
      category: "procedure",
      title: "Winter condensate drain procedure",
      summary:
        "Clear the drain, treat the pan, confirm heat tape, photograph the trap, and insulate attic traps in freezing weather.",
      content:
        "On heating-season condensate calls: 1) clear the drain, 2) add pan tablets, 3) confirm heat tape on exterior or attic lines, 4) photograph the trap before leaving, 5) if the attic is below freezing, add insulation around the trap. Call a manager if the secondary pan is already full.",
      status: "approved",
      sensitivity: "general",
      customerId: null,
      equipmentId: DEMO_EQUIPMENT.attic,
      createdBy: DEMO_USERS.jordan,
      approvedBy: DEMO_USERS.jordan,
      approvedAt: at(8),
      currentVersion: 1,
      reviewSignals: [],
      tagIds: [DEMO_TAGS.drain],
      createdAt: at(10),
      updatedAt: at(8),
    },
    {
      id: DEMO_KNOWLEDGE.atticDraft,
      organizationId: DEMO_ORG_ID,
      category: "customer",
      title: "Miller Dental attic access needs two techs",
      summary:
        "Attic air handler is reached through a storage-closet hatch. Quote extra labor, not a standard rooftop visit.",
      content:
        "Draft from Riley's voice note: The Miller Dental attic unit is a tight pull through a ceiling hatch in the storage closet. Need a second tech and a zipper bag for ceiling dust. Do not quote this as a standard rooftop call.\n\nThis draft was generated from a source capture. It is not approved company guidance until a manager or owner reviews it.",
      status: "pending_review",
      sensitivity: "customer_specific",
      customerId: DEMO_CUSTOMERS.miller,
      equipmentId: DEMO_EQUIPMENT.attic,
      createdBy: DEMO_USERS.riley,
      approvedBy: null,
      approvedAt: null,
      currentVersion: 1,
      reviewSignals: ["needs_owner_review", "customer_specific", "low_context"],
      tagIds: [DEMO_TAGS.access],
      createdAt: at(4),
      updatedAt: at(4),
    },
    {
      id: DEMO_KNOWLEDGE.lockoutDraft,
      organizationId: DEMO_ORG_ID,
      category: "pricing",
      title: "Commercial after-hours lockout fee suggestion",
      summary:
        "AI suggested a commercial lockout fee after a voice note. Needs owner review before it becomes policy.",
      content:
        "Suggested from a field observation: commercial rooftop lockouts after hours might need a dedicated trip fee. No approved amount exists yet. Do not quote a number until an owner sets it.\n\nThis draft was generated from a source capture. It is not approved company guidance until a manager or owner reviews it.",
      status: "pending_review",
      sensitivity: "general",
      customerId: null,
      equipmentId: null,
      createdBy: DEMO_USERS.riley,
      approvedBy: null,
      approvedAt: null,
      currentVersion: 1,
      reviewSignals: ["needs_owner_review", "possible_pricing", "incomplete"],
      tagIds: [DEMO_TAGS.afterHours],
      createdAt: at(3),
      updatedAt: at(3),
    },
  ];

  const versions: KnowledgeVersion[] = knowledge.map((entry) => ({
    id: entry.id.replace("77777777", "99999991"),
    knowledgeEntryId: entry.id,
    organizationId: DEMO_ORG_ID,
    versionNumber: 1,
    title: entry.title,
    summary: entry.summary,
    content: entry.content,
    changedBy: entry.createdBy,
    changeReason: entry.status === "approved" ? "Initial approval" : "AI draft",
    createdAt: entry.createdAt,
  }));

  const sources: KnowledgeSource[] = [
    {
      id: "aaaaaaa2-0000-4000-8000-000000000001",
      knowledgeEntryId: DEMO_KNOWLEDGE.weekendPricing,
      captureId: DEMO_CAPTURES.weekendVoice,
      organizationId: DEMO_ORG_ID,
      excerpt: "Weekend emergency jobs are time-and-a-half plus a $95 dispatch fee.",
    },
    {
      id: "aaaaaaa2-0000-4000-8000-000000000002",
      knowledgeEntryId: DEMO_KNOWLEDGE.johnsonAccess,
      captureId: DEMO_CAPTURES.johnsonNote,
      organizationId: DEMO_ORG_ID,
      excerpt: "Side gate code is 1947. Both dogs are friendly but must stay in the backyard.",
    },
    {
      id: "aaaaaaa2-0000-4000-8000-000000000003",
      knowledgeEntryId: DEMO_KNOWLEDGE.hardStart,
      captureId: DEMO_CAPTURES.hardStart,
      organizationId: DEMO_ORG_ID,
      excerpt: "Carrier 24ACC6 units around 2018-2020 keep failing on hard start.",
    },
    {
      id: "aaaaaaa2-0000-4000-8000-000000000004",
      knowledgeEntryId: DEMO_KNOWLEDGE.condensate,
      captureId: DEMO_CAPTURES.drainPdf,
      organizationId: DEMO_ORG_ID,
      excerpt: "Winter condensate procedure: clear the drain, add pan tablets, confirm heat tape.",
    },
    {
      id: "aaaaaaa2-0000-4000-8000-000000000005",
      knowledgeEntryId: DEMO_KNOWLEDGE.atticDraft,
      captureId: DEMO_CAPTURES.atticDraft,
      organizationId: DEMO_ORG_ID,
      excerpt: "Miller Dental attic unit is a tight pull through a ceiling hatch.",
    },
  ];

  const relationships: KnowledgeRelationship[] = [
    {
      id: "aaaaaaa3-0000-4000-8000-000000000001",
      organizationId: DEMO_ORG_ID,
      fromEntryId: DEMO_KNOWLEDGE.weekendPricing,
      toEntryId: DEMO_KNOWLEDGE.lockoutDraft,
      relationshipType: "same_procedure",
      note: "Both concern after-hours pricing.",
    },
    {
      id: "aaaaaaa3-0000-4000-8000-000000000002",
      organizationId: DEMO_ORG_ID,
      fromEntryId: DEMO_KNOWLEDGE.hardStart,
      toEntryId: DEMO_KNOWLEDGE.johnstone,
      relationshipType: "same_equipment",
      note: "OEM parts for Carrier repairs.",
    },
    {
      id: "aaaaaaa3-0000-4000-8000-000000000003",
      organizationId: DEMO_ORG_ID,
      fromEntryId: DEMO_KNOWLEDGE.condensate,
      toEntryId: DEMO_KNOWLEDGE.atticDraft,
      relationshipType: "similar_problem",
      note: "Attic equipment access and condensate work often overlap.",
    },
    {
      id: "aaaaaaa3-0000-4000-8000-000000000004",
      organizationId: DEMO_ORG_ID,
      fromEntryId: DEMO_KNOWLEDGE.johnsonAccess,
      toEntryId: DEMO_KNOWLEDGE.atticDraft,
      relationshipType: "related_customer",
      note: "Customer access notes.",
    },
  ];

  const conversations: Conversation[] = [
    {
      id: DEMO_CONVERSATION,
      organizationId: DEMO_ORG_ID,
      userId: DEMO_USERS.jordan,
      title: "Weekend emergency pricing",
      createdAt: at(2),
      updatedAt: at(2),
    },
  ];

  const messages: ConversationMessage[] = [
    {
      id: "aaaaaaa4-0000-4000-8000-000000000001",
      conversationId: DEMO_CONVERSATION,
      organizationId: DEMO_ORG_ID,
      role: "user",
      content: "How do we usually price emergency weekend calls?",
      citations: [],
      undocumented: false,
      createdAt: at(2.05),
    },
    {
      id: "aaaaaaa4-0000-4000-8000-000000000002",
      conversationId: DEMO_CONVERSATION,
      organizationId: DEMO_ORG_ID,
      role: "assistant",
      content:
        "Here is what approved company knowledge says:\n\n1. Weekend emergency call pricing\nFor after-hours and weekend emergency calls, quote time-and-a-half labor plus a $95 dispatch fee. Saturday morning is not regular rate. Any exception needs owner approval before the customer is quoted.\n\nI am not adding anything that is not in those records. If a job is unusual, check with a manager.",
      citations: [
        {
          knowledgeEntryId: DEMO_KNOWLEDGE.weekendPricing,
          title: "Weekend emergency call pricing",
          status: "approved",
          excerpt:
            "quote time-and-a-half labor plus a $95 dispatch fee. Saturday morning is not regular rate.",
          captureId: DEMO_CAPTURES.weekendVoice,
        },
      ],
      undocumented: false,
      createdAt: at(2),
    },
  ];

  const jobs: ProcessingJob[] = captures.map((capture, index) => ({
    id: `aaaaaaa5-0000-4000-8000-00000000000${index + 1}`,
    organizationId: DEMO_ORG_ID,
    captureId: capture.id,
    knowledgeEntryId: null,
    jobType: "extract",
    status: "completed",
    attemptCount: 1,
    idempotencyKey: `extract:${capture.id}`,
    lastError: null,
    createdAt: capture.createdAt,
    completedAt: capture.createdAt,
  }));

  const audit: AuditEvent[] = [
    {
      id: "aaaaaaa6-0000-4000-8000-000000000001",
      organizationId: DEMO_ORG_ID,
      actorId: DEMO_USERS.jordan,
      action: "knowledge.approved",
      entityType: "knowledge_entry",
      entityId: DEMO_KNOWLEDGE.weekendPricing,
      metadata: { title: "Weekend emergency call pricing" },
      createdAt: at(28),
    },
    {
      id: "aaaaaaa6-0000-4000-8000-000000000002",
      organizationId: DEMO_ORG_ID,
      actorId: DEMO_USERS.sam,
      action: "knowledge.approved",
      entityType: "knowledge_entry",
      entityId: DEMO_KNOWLEDGE.johnsonAccess,
      metadata: { title: "Johnson residence access instructions" },
      createdAt: at(18),
    },
  ];

  return {
    organization,
    profiles,
    members,
    invitations,
    customers,
    equipment,
    tags,
    captures,
    jobs,
    knowledge,
    versions,
    sources,
    relationships,
    conversations,
    messages,
    audit,
    currentUserId: DEMO_USERS.jordan,
  };
}
