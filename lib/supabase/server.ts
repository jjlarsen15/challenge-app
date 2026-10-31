import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getPublicEnv,
  getSupabasePublishableKey,
  isSupabaseConfigured,
} from "@/lib/env";

export async function createSupabaseServerClient() {
  const env = getPublicEnv();
  const key = getSupabasePublishableKey(env);
  if (!isSupabaseConfigured(env) || !env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component; proxy.ts handles session refresh.
        }
      },
    },
  });
}
