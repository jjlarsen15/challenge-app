# OwnerOS

OwnerOS is the AI business memory for small service companies. Technicians capture what they just learned. Managers approve it. The team asks questions against trusted, cited company knowledge.

This repository previously held a group-challenge prototype. That product has been replaced.

## Current milestone

Phase 1 foundation and Phase 2 functional mock are in place.

You can walk the success path without secrets:

1. Open the labeled Peakline HVAC demo
2. Capture a note or voice recording
3. Review the AI draft
4. Approve it
5. Ask OwnerOS and get a cited answer from approved knowledge

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS v4 and shadcn/ui
- Supabase Auth, Postgres, Storage, and RLS (schema ready)
- pgvector for approved knowledge embeddings (wired in schema)
- Zod, React Hook Form, Vitest, Playwright
- OpenAI adapters behind a server-side interface (mock until configured)

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and choose **Enter demo**.

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
```

Playwright needs browsers once: `npx playwright install chromium`.

## Environment

See `.env.example`. Nothing paid is called unless `OPENAI_API_KEY` is set. The UI stays on the demo workspace until Supabase keys are present (or `NEXT_PUBLIC_FORCE_DEMO=true`).

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin/storage |
| `OPENAI_API_KEY` | Transcription, extraction, embeddings, answering |
| `OPENAI_*_MODEL` | Optional model overrides |

Never put service-role or OpenAI keys in client code.

## Database

Apply `supabase/migrations/0001_init.sql` to enable Phase 3 persistence, RLS, pgvector, and the private `source-captures` bucket. Details are in `supabase/README.md`.

## Architecture

Read `IMPLEMENTATION_PLAN.md` for the trust model, tenant isolation, AI pipeline, and remaining phases.

Phase 3 next: persist capture → review → approve to Supabase while keeping the demo repository as a fallback.
