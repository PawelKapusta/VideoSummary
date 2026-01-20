import type { APIRoute } from "astro";
import type { BulkGenerationStatus, ApiError, ApiSuccess } from "../../../types";
import { securityLogger, errorLogger, performanceLogger } from "../../../lib/logger";
import { getBulkGenerationStatus } from "../../../lib/summaries.service";

/**
 * GET /api/summaries/bulk-status
 *
 * Retrieves the status of bulk summary generation for the authenticated user.
 * Shows the most recent bulk generations and their progress.
 *
 * Authentication: Required (Cookie session)
 * Query Parameters:
 * - id (UUID, optional) - Get status for specific bulk generation
 *
 * Response (200 OK):
 * {
 *   data: BulkGenerationStatus[], // Array of bulk generation records
 *   message: string
 * }
 *
 * BulkGenerationStatus includes:
 * - id: string
 * - status: "pending" | "in_progress" | "completed" | "failed"
 * - started_at: string
 * - completed_at: string | null
 * - total_channels: number
 * - processed_channels: number
 * - successful_summaries: number
 * - failed_summaries: number
 * - error_message: string | null
 *
 * Error Responses:
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid authentication session
 * - 404 Not Found: Bulk generation not found (when specific ID requested)
 * - 500 Internal Server Error: Database error
 */
export const GET: APIRoute = async ({ locals, url }) => {
  const startTime = performance.now();

  // Use Supabase client from middleware (already configured with trace ID)
  const supabase = locals.supabase;

  try {
    // Get user from session (cookie-based)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const duration = performance.now() - startTime;
      securityLogger.auth("Unauthorized bulk status check - no valid session");
      securityLogger.apiAccess({
        method: "GET",
        path: "/api/summaries/bulk-status",
        statusCode: 401,
      });
      performanceLogger.apiResponseTime("GET", "/api/summaries/bulk-status", duration, 401);

      const errorResponse: ApiError = {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Extract and validate query parameters
    const urlParams = new URL(url).searchParams;
    const generationId = urlParams.get("id");

    // Validate generation ID if provided
    if (generationId) {
      const UUIDSchema = (await import("../../../lib/validation/schemas")).UUIDSchema;
      const validationResult = UUIDSchema.safeParse(generationId);
      if (!validationResult.success) {
        const duration = performance.now() - startTime;
        errorLogger.validationError(new Error("Query parameter validation failed"), undefined, undefined, {
          endpoint: "/api/summaries/bulk-status",
          method: "GET",
        });

        securityLogger.apiAccess({
          method: "GET",
          path: "/api/summaries/bulk-status",
          statusCode: 400,
        });
        performanceLogger.apiResponseTime("GET", "/api/summaries/bulk-status", duration, 400);

        const errorResponse: ApiError = {
          error: {
            code: "INVALID_INPUT",
            message: "Invalid generation ID format",
            details: validationResult.error.format(),
          },
        };

        return new Response(JSON.stringify(errorResponse), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Get bulk generation status
    const statusData: BulkGenerationStatus[] = await getBulkGenerationStatus(
      supabase,
      userId,
      generationId || undefined
    );

    // If specific ID was requested but not found, return 404
    if (generationId && statusData.length === 0) {
      const duration = performance.now() - startTime;
      securityLogger.apiAccess({
        method: "GET",
        path: "/api/summaries/bulk-status",
        statusCode: 404,
      });
      performanceLogger.apiResponseTime("GET", "/api/summaries/bulk-status", duration, 404);

      const errorResponse: ApiError = {
        error: {
          code: "BULK_GENERATION_NOT_FOUND",
          message: "Bulk generation not found",
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Log successful status retrieval
    securityLogger.auth("Bulk generation status retrieved successfully", {
      user_id: userId,
      generation_id: generationId,
      results_count: statusData.length,
    });

    // Format successful response
    const successResponse: ApiSuccess<BulkGenerationStatus[]> = {
      data: statusData,
      message: generationId ? "Bulk generation status retrieved" : "Bulk generation history retrieved",
    };

    // Log API access and performance
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({
      method: "GET",
      path: "/api/summaries/bulk-status",
      statusCode: 200,
    });
    performanceLogger.apiResponseTime("GET", "/api/summaries/bulk-status", duration, 200);

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Add security headers
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
      },
    });
  } catch (error) {
    // Handle unexpected errors
    const duration = performance.now() - startTime;
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: "/api/summaries/bulk-status",
      method: "GET",
    });

    securityLogger.apiAccess({
      method: "GET",
      path: "/api/summaries/bulk-status",
      statusCode: 500,
    });
    performanceLogger.apiResponseTime("GET", "/api/summaries/bulk-status", duration, 500);

    const errorResponse: ApiError = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
