import type { APIRoute } from "astro";
import type { ApiError, ApiSuccess } from "../../../types";
import { securityLogger, errorLogger, performanceLogger, appLogger } from "../../../lib/logger";
import type { RuntimeEnv } from "../../../lib/env";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "../../../lib/env";

const ENDPOINT_PATH = "/api/summaries/complete-bulk";

/**
 * POST /api/summaries/complete-bulk
 *
 * Marks the current bulk generation as completed and calculates statistics.
 * This endpoint is called by GitHub Actions workflow after processing all queue items.
 *
 * Process:
 * 1. Finds the active bulk generation (status: "in_progress")
 * 2. Counts successful and failed summaries from summary_queue
 * 3. Updates bulk_generation_status with final statistics
 * 4. Marks status as "completed"
 *
 * Authentication: x-cron-secret header (validated in middleware)
 * Request Body: Empty (no parameters needed)
 *
 * Response (200 OK):
 * {
 *   data: {
 *     id: string,
 *     status: "completed",
 *     total_channels: number,
 *     successful_summaries: number,
 *     failed_summaries: number,
 *     message: string
 *   }
 * }
 *
 * Error Responses:
 * - 404 Not Found: No active bulk generation found
 * - 500 Internal Server Error: Database or processing error
 */
export const POST: APIRoute = async ({ locals }) => {
  const startTime = performance.now();

  try {
    appLogger.info("Completing bulk generation", {
      endpoint: ENDPOINT_PATH,
      timestamp: new Date().toISOString(),
    });

    // Get runtime environment and create admin client
    const runtimeEnv = locals.runtime?.env as RuntimeEnv;

    // Create Supabase client with SERVICE ROLE key to bypass RLS
    const SUPABASE_URL = requireEnv("SUPABASE_URL", runtimeEnv);
    const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY", runtimeEnv);
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Find active bulk generation (status: "in_progress")
    const { data: activeBulkGeneration, error: fetchError } = await supabaseAdmin
      .from("bulk_generation_status")
      .select("id, total_channels, started_at")
      .eq("status", "in_progress")
      .is("user_id", null) // System generation (not user-initiated)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      appLogger.error("Failed to fetch active bulk generation", { error: fetchError.message });
      throw fetchError;
    }

    if (!activeBulkGeneration) {
      appLogger.warn("No active bulk generation found to complete");

      const duration = performance.now() - startTime;
      securityLogger.apiAccess({ method: "POST", path: ENDPOINT_PATH, statusCode: 404 });
      performanceLogger.apiResponseTime("POST", ENDPOINT_PATH, duration, 404);

      return new Response(
        JSON.stringify({
          error: {
            code: "NO_ACTIVE_BULK_GENERATION",
            message: "No active bulk generation found. It may have already completed or timed out.",
          },
        } satisfies ApiError),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    appLogger.info("Found active bulk generation", {
      bulkGenerationId: activeBulkGeneration.id,
      totalChannels: activeBulkGeneration.total_channels,
    });

    // 2. Count successful and failed summaries from summary_queue
    // Get all queue items created after this bulk generation started
    const { data: queueStats, error: statsError } = await supabaseAdmin
      .from("summary_queue")
      .select("status")
      .gte("queued_at", activeBulkGeneration.started_at);

    if (statsError) {
      appLogger.error("Failed to fetch queue statistics", { error: statsError.message });
      throw statsError;
    }

    const successfulSummaries = queueStats?.filter((item) => item.status === "completed").length || 0;
    const failedSummaries = queueStats?.filter((item) => item.status === "failed").length || 0;
    const totalProcessed = successfulSummaries + failedSummaries;

    appLogger.info("Calculated bulk generation statistics", {
      bulkGenerationId: activeBulkGeneration.id,
      totalProcessed,
      successful: successfulSummaries,
      failed: failedSummaries,
    });

    // 3. Update bulk_generation_status with final statistics
    const { error: updateError } = await supabaseAdmin
      .from("bulk_generation_status")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        processed_channels: activeBulkGeneration.total_channels,
        successful_summaries: successfulSummaries,
        failed_summaries: failedSummaries,
      })
      .eq("id", activeBulkGeneration.id);

    if (updateError) {
      appLogger.error("Failed to update bulk generation status", { error: updateError.message });
      throw updateError;
    }

    // Log success
    const duration = performance.now() - startTime;
    securityLogger.auth("Bulk generation completed successfully", {
      bulk_generation_id: activeBulkGeneration.id,
      successful_summaries: successfulSummaries,
      failed_summaries: failedSummaries,
    });
    securityLogger.apiAccess({ method: "POST", path: ENDPOINT_PATH, statusCode: 200 });
    performanceLogger.apiResponseTime("POST", ENDPOINT_PATH, duration, 200);

    appLogger.info("Bulk generation marked as completed", {
      bulkGenerationId: activeBulkGeneration.id,
      totalChannels: activeBulkGeneration.total_channels,
      successful: successfulSummaries,
      failed: failedSummaries,
    });

    return new Response(
      JSON.stringify({
        data: {
          id: activeBulkGeneration.id,
          status: "completed",
          total_channels: activeBulkGeneration.total_channels,
          successful_summaries: successfulSummaries,
          failed_summaries: failedSummaries,
          message: `Bulk generation completed: ${successfulSummaries} successful, ${failedSummaries} failed`,
        },
        message: "Bulk generation completed successfully",
      } satisfies ApiSuccess<{
        id: string;
        status: string;
        total_channels: number;
        successful_summaries: number;
        failed_summaries: number;
        message: string;
      }>),
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

    appLogger.error("Failed to complete bulk generation", {
      errorMessage,
    });

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to complete bulk generation",
        },
      } satisfies ApiError),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
