import type { SupabaseClient } from '../db/supabase.client';
import type { GenerationStatusResponse } from '../types';

/**
 * Check if a summary can be generated for a specific channel today
 * Checks GLOBAL limit (1 successful summary per channel per day across all users)
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param channelId - Channel ID
 * @returns Generation status information
 */
export async function checkGenerationStatus(
  supabase: SupabaseClient,
  userId: string,
  channelId: string
): Promise<GenerationStatusResponse> {
  // First verify user is subscribed to the channel
  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('channel_id', channelId)
    .maybeSingle();

  if (subscriptionError) {
    throw subscriptionError;
  }

  if (!subscription) {
    throw new Error('CHANNEL_NOT_SUBSCRIBED');
  }

  // Get today's date range (UTC)
  const today = new Date().toISOString().split('T')[0];
  const startOfDay = `${today}T00:00:00Z`;
  const endOfDay = `${today}T23:59:59.999Z`;

  // Get all videos from this channel
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('id')
    .eq('channel_id', channelId);

  if (videosError) {
    throw videosError;
  }

  const videoIds = videos?.map(v => v.id) || [];

  // Count successful summaries today for this channel
  let successfulSummariesToday = 0;
  let lastSuccessfulGenerationAt: string | null = null;

  if (videoIds.length > 0) {
    const { data: summaries, error: summariesError } = await supabase
      .from('summaries')
      .select('id, generated_at')
      .in('video_id', videoIds)
      .eq('status', 'completed')
      .gte('generated_at', startOfDay)
      .lte('generated_at', endOfDay)
      .order('generated_at', { ascending: false });

    if (summariesError) {
      throw summariesError;
    }

    successfulSummariesToday = summaries?.length || 0;
    lastSuccessfulGenerationAt = summaries?.[0]?.generated_at || null;
  }

  const limit = 1;
  const canGenerate = successfulSummariesToday < limit;

  return {
    channel_id: channelId,
    can_generate: canGenerate,
    successful_summaries_today_global: successfulSummariesToday,
    limit: limit,
    last_successful_generation_at: lastSuccessfulGenerationAt,
    note: 'This is a GLOBAL limit per channel (across all users). Only successful (completed) summaries count toward the daily limit. Failed generation attempts can be retried.',
  };
}

