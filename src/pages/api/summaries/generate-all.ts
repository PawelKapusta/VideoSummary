import type { APIRoute } from "astro";
import type { BulkGenerationResponse, ApiError, ApiSuccess } from "../../../types";
import { securityLogger, errorLogger, performanceLogger, appLogger } from "../../../lib/logger";
import { startBulkSummaryGeneration } from "../../../lib/summaries.service";
import type { RuntimeEnv } from "../../../lib/env";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "astro:env/server";

const ENDPOINT_PATH = "/api/summaries/generate-all";

/**
 * POST /api/summaries/generate-all
 *
 * Starts system bulk summary generation for all channels in the database.
 * This endpoint is called by a cron job (GitHub Actions) to generate daily summaries.
 *
 * Process:
 * 1. Cleans up stale generations (stuck > 1 hour)
 * 2. Fetches all channels from the database
 * 3. For each channel, gets the latest video
 * 4. Checks if summary is needed (not generated today, video not too long)
 * 5. Adds videos to the summary_queue table
 * 6. Processes queue with parallel workers (3 concurrent)
 *
 * Authentication: x-cron-secret header (validated in middleware)
 * Request Body: Empty (no parameters needed)
 *
 * Response (202 Accepted):
 * {
 *   data: {
 *     id: string,                    // Bulk generation ID
 *     status: "pending",             // Initial status
 *     message: string,               // Success message with queue stats
 *     estimated_completion_time: string // Estimated time in minutes
 *   }
 * }
 *
 * Error Responses:
 * - 400 Bad Request: Invalid request body
 * - 409 Conflict: Bulk generation already in progress
 * - 422 Unprocessable Entity: No channels found
 * - 500 Internal Server Error: Database or processing error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();

  try {
    appLogger.info("Daily summary generation triggered", {
      endpoint: ENDPOINT_PATH,
      timestamp: new Date().toISOString(),
    });

    // Validate request body (should be empty, but check if valid JSON)
    const body = await request.text();
    if (body && body.trim()) {
      try {
        JSON.parse(body);
      } catch {
        const duration = performance.now() - startTime;
        errorLogger.validationError(new Error("Request body validation failed"), undefined, undefined, {
          endpoint: ENDPOINT_PATH,
          method: "POST",
        });

        securityLogger.apiAccess({ method: "POST", path: ENDPOINT_PATH, statusCode: 400 });
        performanceLogger.apiResponseTime("POST", ENDPOINT_PATH, duration, 400);

        return new Response(
          JSON.stringify({
            error: {
              code: "INVALID_REQUEST_BODY",
              message: "Request body must be empty or valid JSON",
            },
          } satisfies ApiError),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Get runtime environment and create admin client
    const runtimeEnv = locals.runtime?.env as RuntimeEnv;

    // Create Supabase client with SERVICE ROLE key to bypass RLS
    // Required because cron job has no user session
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Start bulk summary generation (queues videos, processing done by cron)
    const result: BulkGenerationResponse = await startBulkSummaryGeneration(supabaseAdmin, runtimeEnv);

    // Log success
    const duration = performance.now() - startTime;
    securityLogger.auth("System bulk summary generation initiated", {
      bulk_generation_id: result.id,
      status: result.status,
    });
    securityLogger.apiAccess({ method: "POST", path: ENDPOINT_PATH, statusCode: 202 });
    performanceLogger.apiResponseTime("POST", ENDPOINT_PATH, duration, 202);

    appLogger.info("Daily summary generation started successfully", {
      bulkGenerationId: result.id,
      message: result.message,
      estimatedTime: result.estimated_completion_time,
    });

    return new Response(
      JSON.stringify({
        data: result,
        message: result.message,
      } satisfies ApiSuccess<BulkGenerationResponse>),
      {
        status: 202,
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

    // Map error codes to HTTP status codes
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";
    let message = "An unexpected error occurred";

    if (errorMessage === "BULK_GENERATION_IN_PROGRESS") {
      statusCode = 409;
      errorCode = "BULK_GENERATION_IN_PROGRESS";
      message = "Bulk summary generation is already in progress. Please wait for it to complete.";
    } else if (errorMessage === "NO_CHANNELS_FOUND") {
      statusCode = 422;
      errorCode = "NO_CHANNELS_FOUND";
      message = "No channels found in database. Subscribe to channels first.";
    }

    // Log error
    errorLogger.appError(error instanceof Error ? error : new Error(errorMessage), {
      endpoint: ENDPOINT_PATH,
      method: "POST",
    });
    securityLogger.apiAccess({ method: "POST", path: ENDPOINT_PATH, statusCode });
    performanceLogger.apiResponseTime("POST", ENDPOINT_PATH, duration, statusCode);

    appLogger.error("Daily summary generation failed", {
      errorCode,
      errorMessage,
      statusCode,
    });

    return new Response(
      JSON.stringify({
        error: {
          code: errorCode,
          message,
        },
      } satisfies ApiError),
      { status: statusCode, headers: { "Content-Type": "application/json" } }
    );
  }
};
