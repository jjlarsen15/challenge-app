# OwnerOS database

Apply `migrations/0001_init.sql` to a Supabase project before enabling authenticated persistence.

## Apply

```bash
supabase db push
# or paste the SQL into the Supabase SQL editor
```

Required extensions: `pgcrypto`, `pg_trgm`, `vector`.

## After apply

1. Enable email auth in Supabase.
2. Confirm the private `source-captures` bucket exists.
3. Add the keys from `.env.example` to `.env.local` and Vercel.
4. Never expose `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` to the browser.

Phase 2 of the app runs without this database by using a labeled demo workspace.
