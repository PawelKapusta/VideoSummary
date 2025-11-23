import type { SupabaseClient } from '../db/supabase.client';
import type { RatingResponse } from '../types';

/**
 * Rate a summary (create or update rating)
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param summaryId - Summary ID
 * @param rating - Rating value (true = upvote, false = downvote)
 * @returns Rating response with status code indicator
 */
export async function rateSummary(
  supabase: SupabaseClient,
  userId: string,
  summaryId: string,
  rating: boolean
): Promise<RatingResponse & { statusCode: number }> {
  // First verify that the summary exists and user has access to it (via RLS)
  const { data: summary, error: summaryError } = await supabase
    .from('summaries')
    .select('id')
    .eq('id', summaryId)
    .single();

  if (summaryError) {
    if (summaryError.code === 'PGRST116') {
      throw new Error('SUMMARY_NOT_FOUND');
    }
    throw summaryError;
  }

  if (!summary) {
    throw new Error('SUMMARY_NOT_FOUND');
  }

  // Check if rating already exists to determine status code
  const { data: existingRating } = await supabase
    .from('summary_ratings')
    .select('id')
    .eq('user_id', userId)
    .eq('summary_id', summaryId)
    .maybeSingle();

  const statusCode = existingRating ? 200 : 201;

  // Upsert the rating
  const { data: ratingData, error: ratingError } = await supabase
    .from('summary_ratings')
    .upsert(
      {
        user_id: userId,
        summary_id: summaryId,
        rating: rating,
      },
      { onConflict: 'user_id,summary_id' }
    )
    .select('id, summary_id, rating, created_at')
    .single();

  if (ratingError) {
    throw ratingError;
  }

  if (!ratingData) {
    throw new Error('Failed to create or update rating');
  }

  return {
    id: ratingData.id,
    summary_id: ratingData.summary_id,
    rating: ratingData.rating,
    created_at: ratingData.created_at,
    message: statusCode === 201 ? 'Rating created successfully' : 'Rating updated successfully',
    statusCode,
  };
}

/**
 * Remove a rating from a summary
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param summaryId - Summary ID
 * @returns Success message
 */
export async function removeRating(
  supabase: SupabaseClient,
  userId: string,
  summaryId: string
): Promise<{ message: string }> {
  // Delete the rating
  const { count, error } = await supabase
    .from('summary_ratings')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .eq('summary_id', summaryId);

  if (error) {
    throw error;
  }

  // If no rows were deleted, the rating didn't exist
  if (count === 0) {
    throw new Error('RATING_NOT_FOUND');
  }

  return {
    message: 'Rating removed successfully',
  };
}

