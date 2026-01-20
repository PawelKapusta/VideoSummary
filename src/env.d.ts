/// <reference types="astro/client" />
import "./types/youtube-transcript-api.d.ts";

import type { SupabaseClient } from "./db/supabase.client.ts";

// Cloudflare runtime environment variables
interface CloudflareEnv {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL?: string;
  YOUTUBE_API_KEY: string;
  GRADIO_TRANSCRIPT_MODEL?: string;
  LOGTAPE_API_KEY?: string;
  LOGTAPE_PROJECT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
}

// Cloudflare runtime type
type Runtime = import("@astrojs/cloudflare").Runtime<CloudflareEnv>;

declare global {
  namespace App {
    interface Locals extends Runtime {
      supabase: SupabaseClient;
      user: {
        email: string | undefined;
        id: string;
      } | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_MODEL?: string;
  readonly YOUTUBE_API_KEY: string;
  readonly GRADIO_TRANSCRIPT_MODEL?: string;
  readonly LOGTAPE_API_KEY?: string;
  readonly LOGTAPE_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
