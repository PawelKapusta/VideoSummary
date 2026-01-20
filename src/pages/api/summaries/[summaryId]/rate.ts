import type { APIRoute } from "astro";
import type { ApiSuccess, ApiError, RateSummaryRequest } from "../../../../types";
import { z } from "zod";
import { securityLogger, errorLogger, performanceLogger } from "../../../../lib/logger";

const RateSummarySchema = z.object({
  rating: z.boolean(),
});

export const POST: APIRoute = async ({ params, request, locals }) => {
  const startTime = performance.now();
  const { summaryId } = params;

  if (!summaryId || typeof summaryId !== "string") {
    const duration = performance.now() - startTime;
    securityLogger.apiAccess({ method: "POST", path: `/api/summaries/${summaryId}/rate`, statusCode: 400 });
    performanceLogger.apiResponseTime("POST", `/api/summaries/${summaryId}/rate`, duration, 400);

    const errorResponse: ApiError = {
      error: { code: "INVALID_INPUT", message: "Invalid summary ID" },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = locals.supabase;

  try {
    // Get user from session (cookie-based)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const duration = performance.now() - startTime;
      securityLogger.apiAccess({ method: "POST", path: `/api/summaries/${summaryId}/rate`, statusCode: 401 });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${summaryId}/rate`, duration, 401);

      const errorResponse: ApiError = {
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    const body = await request.json();
    const validation = RateSummarySchema.safeParse(body);
    if (!validation.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(new Error("Rate summary validation failed"), undefined, undefined, {
        endpoint: `/api/summaries/${summaryId}/rate`,
        method: "POST",
      });
      securityLogger.apiAccess({ method: "POST", path: `/api/summaries/${summaryId}/rate`, statusCode: 400 });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${summaryId}/rate`, duration, 400);

      const errorResponse: ApiError = {
        error: { code: "INVALID_INPUT", message: "Invalid rating value", details: validation.error.format() },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { rating } = validation.data as RateSummaryRequest;

    // Check if summary exists and belongs to subscribed
    const { data: summaryCheck, error: checkError } = await supabase
      .from("summaries")
      .select("id")
      .eq("id", summaryId)
      .single();

    if (checkError || !summaryCheck) {
      const duration = performance.now() - startTime;
      errorLogger.appError(new Error("Summary not found"), {
        endpoint: `/api/summaries/${summaryId}/rate`,
        method: "POST",
      });
      securityLogger.apiAccess({ method: "POST", path: `/api/summaries/${summaryId}/rate`, statusCode: 404 });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${summaryId}/rate`, duration, 404);

      const errorResponse: ApiError = {
        error: { code: "SUMMARY_NOT_FOUND", message: "Summary not found" },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Upsert rating
    const { data: ratingData, error: upsertError } = await supabase
      .from("summary_ratings")
      .upsert({ user_id: userId, summary_id: summaryId, rating })
      .select("rating")
      .eq("user_id", userId)
      .eq("summary_id", summaryId)
      .single();

    if (upsertError || !ratingData) {
      const duration = performance.now() - startTime;
      errorLogger.appError(upsertError || new Error("Failed to upsert rating"), {
        endpoint: `/api/summaries/${summaryId}/rate`,
        method: "POST",
      });
      securityLogger.apiAccess({ method: "POST", path: `/api/summaries/${summaryId}/rate`, statusCode: 500 });
      performanceLogger.apiResponseTime("POST", `/api/summaries/${summaryId}/rate`, duration, 500);

      const errorResponse: ApiError = {
        error: { code: "INTERNAL_ERROR", message: "Failed to submit rating" },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const duration = performance.now() - startTime;
    securityLogger.apiAccess({ method: "POST", path: `/api/summaries/${summaryId}/rate`, statusCode: 200 });
    performanceLogger.apiResponseTime("POST", `/api/summaries/${summaryId}/rate`, duration, 200);

    const successResponse: ApiSuccess<{ rating: boolean; message: string }> = {
      data: { rating: ratingData.rating, message: "Rating submitted successfully" },
      message: "Rating submitted successfully",
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const duration = performance.now() - startTime;
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), {
      endpoint: `/api/summaries/${summaryId}/rate`,
      method: "POST",
    });
    securityLogger.apiAccess({ method: "POST", path: `/api/summaries/${summaryId}/rate`, statusCode: 500 });
    performanceLogger.apiResponseTime("POST", `/api/summaries/${summaryId}/rate`, duration, 500);

    const errorResponse: ApiError = {
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
