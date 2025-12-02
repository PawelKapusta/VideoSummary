import type { APIRoute } from 'astro';
import type { ApiSuccess, ApiError } from '../../../types';
import { z } from 'zod';
import { securityLogger, errorLogger, performanceLogger } from '../../../lib/logger';

const HideSummarySchema = z.object({
  summary_id: z.string().uuid(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const startTime = performance.now();

  const supabase = locals.supabase;

  try {
    // Get user from session (cookie-based)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const duration = performance.now() - startTime;
      securityLogger.apiAccess({ method: 'POST', path: '/api/summaries/hide', statusCode: 401 });
      performanceLogger.apiResponseTime('POST', '/api/summaries/hide', duration, 401);

      const errorResponse: ApiError = {
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      };

      return new Response(JSON.stringify(errorResponse), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const userId = user.id;

    const body = await request.json();
    const validation = HideSummarySchema.safeParse(body);
    if (!validation.success) {
      const duration = performance.now() - startTime;
      errorLogger.validationError(new Error('Hide summary validation failed'), undefined, undefined, { endpoint: '/api/summaries/hide', method: 'POST' });
      securityLogger.apiAccess({ method: 'POST', path: '/api/summaries/hide', statusCode: 400 });
      performanceLogger.apiResponseTime('POST', '/api/summaries/hide', duration, 400);

      const errorResponse: ApiError = {
        error: { code: 'INVALID_INPUT', message: 'Invalid summary ID', details: validation.error.format() },
      };

      return new Response(JSON.stringify(errorResponse), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { summary_id } = validation.data;

    // Check if summary belongs to user's subscribed video
    const { data: summaryCheck, error: checkError } = await supabase
      .from('summaries')
      .select('id')
      .eq('id', summary_id)
      .single();

    if (checkError || !summaryCheck) {
      const duration = performance.now() - startTime;
      errorLogger.appError(new Error('Summary not found'), { endpoint: '/api/summaries/hide', method: 'POST' });
      securityLogger.apiAccess({ method: 'POST', path: '/api/summaries/hide', statusCode: 404 });
      performanceLogger.apiResponseTime('POST', '/api/summaries/hide', duration, 404);

      const errorResponse: ApiError = {
        error: { code: 'SUMMARY_NOT_FOUND', message: 'Summary not found' },
      };

      return new Response(JSON.stringify(errorResponse), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Insert or ignore if already hidden
    const { error: insertError } = await supabase
      .from('hidden_summaries')
      .upsert({ user_id: userId, summary_id, hidden_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('summary_id', summary_id);

    if (insertError) {
      const duration = performance.now() - startTime;
      errorLogger.appError(insertError, { endpoint: '/api/summaries/hide', method: 'POST' });
      securityLogger.apiAccess({ method: 'POST', path: '/api/summaries/hide', statusCode: 500 });
      performanceLogger.apiResponseTime('POST', '/api/summaries/hide', duration, 500);

      const errorResponse: ApiError = {
        error: { code: 'INTERNAL_ERROR', message: 'Failed to hide summary' },
      };

      return new Response(JSON.stringify(errorResponse), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const duration = performance.now() - startTime;
    securityLogger.apiAccess({ method: 'POST', path: '/api/summaries/hide', statusCode: 200 });
    performanceLogger.apiResponseTime('POST', '/api/summaries/hide', duration, 200);

    const successResponse: ApiSuccess<{ message: string }> = {
      data: { message: 'Summary hidden successfully' },
      message: 'Summary hidden successfully',
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    errorLogger.appError(error instanceof Error ? error : new Error(String(error)), { endpoint: '/api/summaries/hide', method: 'POST' });
    securityLogger.apiAccess({ method: 'POST', path: '/api/summaries/hide', statusCode: 500 });
    performanceLogger.apiResponseTime('POST', '/api/summaries/hide', duration, 500);

    const errorResponse: ApiError = {
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };

    return new Response(JSON.stringify(errorResponse), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
