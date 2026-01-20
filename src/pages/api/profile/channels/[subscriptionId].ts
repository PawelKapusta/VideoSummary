import type { APIRoute } from "astro";
import { errorLogger, performanceLogger } from "../../../../lib/logger";
import { unsubscribeFromChannel } from "../../../../lib/subscriptions.service";

export const prerender = false;

/**
 * DELETE /api/profile/channels/:subscriptionId
 *
 * Unsubscribes the authenticated user from a channel.
 *
 * Authentication: Required (Cookie session)
 *
 * Response (204 No Content):
 * Success, no body content.
 *
 * Error Responses:
 * - 401 Unauthorized: Missing or invalid session.
 * - 403 Forbidden: User does not own the subscription.
 * - 404 Not Found: Subscription not found.
 * - 500 Internal Server Error.
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  const startTime = performance.now();
  const { subscriptionId } = params;
  const { supabase } = locals;

  if (!subscriptionId) {
    return new Response(JSON.stringify({ error: { code: "INVALID_INPUT", message: "Subscription ID is required." } }), {
      status: 400,
    });
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }), {
        status: 401,
      });
    }

    await unsubscribeFromChannel(supabase, user.id, subscriptionId);

    const duration = performance.now() - startTime;
    performanceLogger.apiResponseTime("DELETE", `/api/profile/channels/${subscriptionId}`, duration, 204);

    return new Response(null, { status: 204 });
  } catch (error) {
    const err = error as Error;
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";

    if (err.message.includes("not found")) {
      statusCode = 404;
      errorCode = "NOT_FOUND";
    } else if (err.message.includes("does not own")) {
      statusCode = 403;
      errorCode = "FORBIDDEN";
    }

    errorLogger.appError(err, { endpoint: `/api/profile/channels/${subscriptionId}`, method: "DELETE" });

    const duration = performance.now() - startTime;
    performanceLogger.apiResponseTime("DELETE", `/api/profile/channels/${subscriptionId}`, duration, statusCode);

    return new Response(JSON.stringify({ error: { code: errorCode, message: err.message } }), { status: statusCode });
  }
};
