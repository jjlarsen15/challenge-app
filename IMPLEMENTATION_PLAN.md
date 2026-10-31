# OwnerOS Implementation Plan

OwnerOS is a multi-tenant SaaS that captures field-service knowledge as a byproduct of work, organizes it into company memory, and answers questions only from approved, cited sources.

This repository previously contained a group-challenge prototype. That product is being replaced. The Next.js 16 / React 19 / Tailwind 4 toolchain is kept; application code, schema, and UI are new.

## Success workflow

An owner can:

1. Sign up and create a company
2. Record a voice note
3. Have it transcribed
4. Review an AI-generated knowledge suggestion
5. Approve it
6. Have an employee ask a question that retrieves the approved knowledge with a source citation

That vertical slice is the product. Everything else supports it.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Next.js App Router (Vercel)                                 │
│  Landing · Auth · Workspace shell · Capture · Memory · Ask  │
└───────────────┬─────────────────────────┬───────────────────┘
                │                         │
                ▼                         ▼
     ┌──────────────────┐      ┌─────────────────────┐
     │ Supabase         │      │ AI services         │
     │ Auth, Postgres,  │      │ transcription       │
     │ Storage, RLS,    │      │ extraction          │
     │ pgvector         │      │ embedding           │
     └──────────────────┘      │ retrieval           │
                               │ grounded answering  │
                               └──────────┬──────────┘
                                          │
                               OpenAI when configured
                               Mock adapters otherwise
```

### Application layers

- **UI:** App Router pages, shadcn/ui, Lucide, mobile-first shell.
- **Workspace state (Phase 2):** a typed in-app repository with labeled demo data so the product is usable without secrets.
- **Persistence (Phase 3):** Supabase client/server helpers, membership, RLS-backed CRUD, private storage.
- **AI (Phase 4):** server-only services with Zod structured outputs, durable jobs, no client-side keys.
- **Contracts:** shared domain types, permission helpers, and validation schemas used by UI, jobs, and tests.

### Tenant isolation

Every tenant-owned row includes `organization_id`. Access requires verified membership. Customer-specific knowledge is stricter than general procedures. RLS is the last line of defense; server code still checks roles before writes.

### Knowledge trust model

| Status           | Meaning                                      | Used in Ask? |
| ---------------- | -------------------------------------------- | ------------ |
| `draft`          | AI or human working notes                    | No           |
| `pending_review` | Suggested knowledge awaiting a manager       | No           |
| `approved`       | Authoritative company guidance               | Yes          |
| `archived`       | Outdated; retained for provenance            | No           |

Raw captures stay source material. AI never silently promotes an observation into policy. Answers must cite accessible records. If nothing approved matches, the assistant says it is not documented.

### AI pipeline

Captures enqueue retryable, idempotent jobs:

1. **Transcribe** audio through a server-side transcription adapter
2. **Extract** structured draft entries with Zod schemas and review signals
3. **Embed** approved chunks with pgvector after approval
4. **Retrieve** organization-scoped results, filtered by permission
5. **Answer** only from retrieved approved knowledge, with citations

Prompt injection from source content is treated as untrusted data. Source text cannot override system instructions.

## Database

Normalized tables (see `supabase/migrations/`):

- `organizations`, `organization_members`, `invitations`
- `source_captures`, `capture_attachments`, `processing_jobs`
- `knowledge_entries`, `knowledge_versions`, `knowledge_sources`, `knowledge_relationships`
- `knowledge_chunks` (pgvector embeddings for approved searchable text)
- `customers`, `equipment`, `tags`, `knowledge_tags`
- `conversations`, `conversation_messages`
- `audit_events`

Industry taxonomy lives in organization settings so HVAC defaults are not hard-coded into the data model.

## Security

- Supabase RLS on every tenant-owned table and private storage bucket
- Server-side permission checks in addition to RLS
- Zod validation on all writes
- Private buckets + signed URLs
- File type and size limits
- Rate limits on AI and upload routes
- No OpenAI or service-role keys in the client
- Audit provenance for knowledge changes
- Safe-deletion and export foundations in schema (`deleted_at`, export hooks later)

## Milestones

### Phase 1 — Foundation (this PR)

- Replace the prototype UI with OwnerOS application shell
- Tailwind v4 tokens, shadcn/ui, reusable primitives
- Responsive navigation (desktop sidebar, mobile bottom nav)
- `.env.example` with every required variable
- Postgres migrations, pgvector, RLS, storage policies
- AI service interfaces with mock adapters

### Phase 2 — Functional mock experience (this PR)

- Polished dashboard, capture, memory, review, ask, and settings
- Browser MediaRecorder + file/note capture
- Labeled Peakline HVAC demo dataset
- Working local capture → extract → review → approve → ask loop
- Role preview (owner / manager / employee) for permission UX

### Phase 3 — Real backend

- Supabase Auth (email)
- Organization create/invite/membership
- Persist captures, attachments, knowledge, conversations
- Private storage uploads
- Switch workspace repository from demo store to Supabase when configured

### Phase 4 — AI pipeline

- OpenAI transcription, extraction, embeddings
- Durable `processing_jobs` with retry/idempotency
- Grounded Ask with citations and “not documented” fallback
- Configurable model/prompt settings (server-side only)

### Phase 5 — Quality

- Expand unit tests (permissions, extraction, retrieval)
- RLS isolation tests against a local or CI Postgres
- Playwright happy-path including voice/note capture
- Accessibility and empty/error/loading states
- Deployment runbook on Vercel + Supabase

## What is intentionally out of scope

CRM, billing, scheduling, dispatch, native apps, heavy analytics, ServiceTitan/Jobber/Housecall Pro integrations, autonomous customer messaging, unattended SOP publishing, and visual knowledge graphs.

## Configuration gates

| Capability        | Required env                         | Without it                                      |
| ----------------- | ------------------------------------ | ----------------------------------------------- |
| App UI            | none                                 | Demo workspace                                  |
| Auth / tenancy    | Supabase URL + anon/publishable key  | Demo login and local repository                 |
| File persistence  | Supabase service role + storage      | Local blobs (session) + labeled limitations     |
| Transcription     | `OPENAI_API_KEY`                     | Mock/demo transcript adapter                    |
| Extraction / Ask  | `OPENAI_API_KEY`                     | Deterministic grounded mock answering           |
| Embeddings        | `OPENAI_API_KEY`                     | Lexical + in-memory similarity                  |

Paid APIs are never called unless configured.

## Current next task after this PR

Phase 3: wire Supabase Auth, organization membership, and persist the capture → review → approve path to Postgres while keeping the mock repository as a fallback.
