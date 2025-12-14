/// <reference types="astro/client" />
/// <reference path="./types/youtube-transcript-api.d.ts" />

import type { SupabaseClient } from './db/supabase.client.ts';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
    }
  }
}

interface ImportMetaEnv {
	readonly SUPABASE_URL: string;
	readonly SUPABASE_KEY: string;
	readonly SUPABASE_SERVICE_ROLE_KEY: string;
	readonly OPENROUTER_API_KEY: string;
	readonly YOUTUBE_API_KEY: string;
	readonly LOGTAPE_API_KEY: string;
	readonly LOGTAPE_PROJECT_ID: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
