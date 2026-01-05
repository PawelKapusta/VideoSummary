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
      // Use react-dom/server.edge instead of react-dom/server.browser for React 19.
      // Without this, MessageChannel from node:worker_threads needs to be polyfilled.
      alias: {
        "react-dom/server": "react-dom/server.edge",
      },
    },
  },
  env: {
    schema: {
      // Supabase
      SUPABASE_URL: envField.string({ context: "server", access: "secret" }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret" }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({ context: "server", access: "secret" }),
      
      // OpenRouter AI
      OPENROUTER_API_KEY: envField.string({ context: "server", access: "secret" }),
      OPENROUTER_MODEL: envField.string({ 
        context: "server", 
        access: "secret",
        optional: true,
      }),
      
      // YouTube API
      YOUTUBE_API_KEY: envField.string({ context: "server", access: "secret" }),
      
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
    },
  },
  adapter: cloudflare(),
});
