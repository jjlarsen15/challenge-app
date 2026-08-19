import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return raw.replace(/\/rest\/v1\/?$/, "");
}

export const supabase = createClient(
  getSupabaseUrl(),
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
);
