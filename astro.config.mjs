// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // Use react-dom/server.edge for Cloudflare (production only)
      // In development, use default react-dom/server
      alias: process.env.CF_PAGES === '1' || process.env.NODE_ENV === 'production' ? {
        "react-dom/server": "react-dom/server.edge",
      } : {},
    },
  },
  env: {
    schema: {
      // Supabase
      SUPABASE_URL: envField.string({ context: "server", access: "secret" }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret" }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: "server", access: "secret" }),

      // OpenRouter AI
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      OPENROUTER_MODEL: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),

      // YouTube API
      YOUTUBE_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),

      // Site URL (for YouTube API Referer header)
      SITE_URL: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "https://video-summary.pages.dev"
      }),

      // Gradio (optional)
      GRADIO_TRANSCRIPT_MODEL: envField.string({
        context: "server",
        access: "secret",
        optional: true
      }),

      // LogTape (optional)
      LOGTAPE_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true
      }),
      LOGTAPE_PROJECT_ID: envField.string({
        context: "server",
        access: "secret",
        optional: true
      }),

      // Cron Secret for automated tasks
      CRON_SECRET: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
  adapter: cloudflare(),
});
