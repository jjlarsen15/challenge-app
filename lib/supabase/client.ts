"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  getPublicEnv,
  getSupabasePublishableKey,
  isSupabaseConfigured,
} from "@/lib/env";

export function createSupabaseBrowserClient() {
  const env = getPublicEnv();
  const key = getSupabasePublishableKey(env);
  if (!isSupabaseConfigured(env) || !env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    return null;
  }

  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, key);
}
