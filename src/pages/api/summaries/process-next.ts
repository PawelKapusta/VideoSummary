import type { APIRoute } from "astro";
import type { ApiError, ApiSuccess } from "../../../types";
import { securityLogger, errorLogger, performanceLogger, appLogger } from "../../../lib/logger";
import { processNextQueueItem, type ProcessNextQueueResult } from "../../../lib/summaries.service";
import type { RuntimeEnv } from "../../../lib/env";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "../../../lib/env";

const ENDPOINT_PATH = "/api/summaries/process-next";

/**
 * POST /api/summaries/process-next
 *
 * Processes the next pending item from the summary queue.
 * This endpoint is designed to be called by a cron job (GitHub Actions)
 * to process summaries that require long-running tasks (like Gradio transcription).
 *
 * Process:
 * 1. Fetches the next pending queue item (highest priority first)
 * 2. Processes the summary generation (can take 5-10 minutes for Gradio)
 * 3. Updates queue item and summary status
 *
 * Authentication: x-cron-secret header (same as generate-all)
 *
 * Response (200 OK):
 * {
 *   data: {
 *     processed: boolean,
 *     queueItemId?: string,
 *     videoId?: string,
 *     summaryId?: string,
 *     success?: boolean,
 *     error?: string,
 *     message: string
 *   }
 * }
 */
export const POST: APIRoute = async ({ locals }) => {
  const startTime = performance.now();

  try {
    appLogger.info("Queue processing triggered", {
      endpoint: ENDPOINT_PATH,
      timestamp: new Date().toISOString(),
      hasRuntimeEnv: !!locals.runtime?.env,
    });

    // Get runtime environment and create admin client
    const runtimeEnv = locals.runtime?.env as RuntimeEnv;

    // Create Supabase client with SERVICE ROLE key to bypass RLS
    let SUPABASE_URL: string;
    let SUPABASE_SERVICE_ROLE_KEY: string;

    try {
      SUPABASE_URL = requireEnv("SUPABASE_URL", runtimeEnv);
      SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY", runtimeEnv);

      appLogger.info("Environment variables loaded", {
        hasSupabaseUrl: !!SUPABASE_URL,
        hasServiceRoleKey: !!SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrlLength: SUPABASE_URL?.length || 0,
      });
    } catch (envError) {
      const errorMsg = envError instanceof Error ? envError.message : String(envError);
      appLogger.error("Failed to load required environment variables", {
        error: errorMsg,
      });
      throw new Error(`Environment configuration error: ${errorMsg}`);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Process next queue item
    const result: ProcessNextQueueResult = await processNextQueueItem(supabaseAdmin, runtimeEnv);

    // Log result
    const duration = performance.now() - startTime;

    if (result.processed) {
      if (result.success) {
        appLogger.info("Queue item processed successfully", {
          queueItemId: result.queueItemId,
          videoId: result.videoId,
          summaryId: result.summaryId,
          duration: `${duration.toFixed(0)}ms`,
        });
      } else {
        appLogger.warn("Queue item processing failed", {
          queueItemId: result.queueItemId,
          videoId: result.videoId,
          error: result.error,
          duration: `${duration.toFixed(0)}ms`,
        });
      }
    } else {
      appLogger.info("No queue items to process", {
        message: result.message,
        duration: `${duration.toFixed(0)}ms`,
      });
    }

    securityLogger.apiAccess({ method: "POST", path: ENDPOINT_PATH, statusCode: 200 });
    performanceLogger.apiResponseTime("POST", ENDPOINT_PATH, duration, 200);

    return new Response(
      JSON.stringify({
        data: result,
        message: result.message,
      } satisfies ApiSuccess<ProcessNextQueueResult>),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "1; mode=block",
        },
      }
    );
  } catch (error) {
    const duration = performance.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    errorLogger.appError(error instanceof Error ? error : new Error(errorMessage), {
      endpoint: ENDPOINT_PATH,
      method: "POST",
    });
    securityLogger.apiAccess({ method: "POST", path: ENDPOINT_PATH, statusCode: 500 });
    performanceLogger.apiResponseTime("POST", ENDPOINT_PATH, duration, 500);

    appLogger.error("Queue processing failed", {
      errorMessage,
      duration: `${duration.toFixed(0)}ms`,
    });

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Queue processing failed",
        },
      } satisfies ApiError),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
