import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().trim().default("http://localhost:3000"),
  NEXT_PUBLIC_FORCE_DEMO: z
    .string()
    .optional()
    .transform((value) => value === "true" || value === "1"),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalUrl,
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: optionalUrl,
  OPENAI_API_KEY: optionalUrl,
  OPENAI_TRANSCRIBE_MODEL: z.string().default("gpt-4o-mini-transcribe"),
  OPENAI_EXTRACT_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_ANSWER_MODEL: z.string().default("gpt-4.1-mini"),
  OPENAI_EMBED_MODEL: z.string().default("text-embedding-3-small"),
  MAX_AUDIO_UPLOAD_MB: z.coerce.number().positive().default(25),
  MAX_DOCUMENT_UPLOAD_MB: z.coerce.number().positive().default(10),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

const rawEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_FORCE_DEMO: process.env.NEXT_PUBLIC_FORCE_DEMO,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_TRANSCRIBE_MODEL: process.env.OPENAI_TRANSCRIBE_MODEL,
  OPENAI_EXTRACT_MODEL: process.env.OPENAI_EXTRACT_MODEL,
  OPENAI_ANSWER_MODEL: process.env.OPENAI_ANSWER_MODEL,
  OPENAI_EMBED_MODEL: process.env.OPENAI_EMBED_MODEL,
  MAX_AUDIO_UPLOAD_MB: process.env.MAX_AUDIO_UPLOAD_MB,
  MAX_DOCUMENT_UPLOAD_MB: process.env.MAX_DOCUMENT_UPLOAD_MB,
};

export function getPublicEnv(): PublicEnv {
  return publicSchema.parse(rawEnv);
}

export function getServerEnv(): ServerEnv {
  return serverSchema.parse(rawEnv);
}

export function isSupabaseConfigured(env: PublicEnv = getPublicEnv()): boolean {
  const key =
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && key);
}

export function isOpenAIConfigured(): boolean {
  if (typeof process.env.OPENAI_API_KEY !== "string") return false;
  return process.env.OPENAI_API_KEY.trim().length > 0;
}

export function shouldUseDemoWorkspace(): boolean {
  const env = getPublicEnv();
  return env.NEXT_PUBLIC_FORCE_DEMO || !isSupabaseConfigured(env);
}

export function getSupabasePublishableKey(env: PublicEnv = getPublicEnv()): string | undefined {
  return env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}
