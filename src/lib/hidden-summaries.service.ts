import type { SupabaseClient } from '../db/supabase.client';

/**
 * Hide a summary from user's dashboard
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param summaryId - Summary ID
 * @returns Success message
 */
export async function hideSummary(
  supabase: SupabaseClient,
  userId: string,
  summaryId: string
): Promise<{ message: string }> {
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

  // Check if summary is already hidden for this user
  const { data: existingHidden } = await supabase
    .from('hidden_summaries')
    .select('id')
    .eq('user_id', userId)
    .eq('summary_id', summaryId)
    .maybeSingle();

  if (existingHidden) {
    throw new Error('ALREADY_HIDDEN');
  }

  // Create hidden_summaries record
  const { error: insertError } = await supabase
    .from('hidden_summaries')
    .insert({
      user_id: userId,
      summary_id: summaryId,
    });

  if (insertError) {
    throw insertError;
  }

  return {
    message: 'Summary hidden from your dashboard',
  };
}

/**
 * Unhide a summary (restore to user's dashboard)
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param summaryId - Summary ID
 * @returns Success message
 */
export async function unhideSummary(
  supabase: SupabaseClient,
  userId: string,
  summaryId: string
): Promise<{ message: string }> {
  // Delete the hidden_summaries record
  const { count, error } = await supabase
    .from('hidden_summaries')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .eq('summary_id', summaryId);

  if (error) {
    throw error;
  }

  // If no rows were deleted, the summary wasn't hidden
  if (count === 0) {
    throw new Error('SUMMARY_NOT_HIDDEN');
  }

  return {
    message: 'Summary restored to your dashboard',
  };
}

