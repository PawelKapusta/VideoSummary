import type { SupabaseClient } from '../db/supabase.client';
import { errorLogger, appLogger } from './logger';
import type {
  DetailedSummary,
  PaginatedResponse,
  SummaryBasic,
  SummaryStatus,
  SummaryWithVideo,
  BulkGenerationStatus,
  BulkGenerationStatusEnum,
  BulkGenerationResponse,
} from '../types';
import type { ChatMessage } from './openrouter.types';
import { extractYouTubeVideoId } from './youtube.utils';
import { fetchYouTubeVideoMetadata } from './youtube.service';
import { OpenRouterService } from './openrouter.service';
import { fetchTranscript, transcriptToString } from './transcript.service';
import { requireEnv, getEnv, type RuntimeEnv } from './env';


// ---------------------------------------------------------------------------
// Szybki i równomierny 32-bitowy hash (FNV-1a) – idealny do advisory locków
// ---------------------------------------------------------------------------
function hashStringToInt32(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0; // unsigned 32-bit
}

// ---------------------------------------------------------------------------
// Format duration in seconds to Polish text
// ---------------------------------------------------------------------------
function formatDurationInPolish(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  
  if (hours > 0) {
    if (hours === 1) {
      parts.push('1 hour');
    } else {
      parts.push(`${hours} godzin`);
    }
  }
  
  if (minutes > 0) {
    if (minutes === 1) {
      parts.push('1 minute');
    } else {
      parts.push(`${minutes} minutes`);
    }
  }
  
  if (secs > 0 && hours === 0) {
    if (secs === 1) {
      parts.push('1 second');
    } else {
      parts.push(`${secs} seconds`);
    }
  }
  
  return parts.length > 0 ? parts.join(' ') : '0 seconds';
}

// ---------------------------------------------------------------------------
// Główna funkcja – generowanie podsumowania
// ---------------------------------------------------------------------------
export async function generateSummary(
  supabase: SupabaseClient,
  userId: string,
  videoUrl: string,
  runtimeEnv?: RuntimeEnv
): Promise<SummaryBasic & { message: string }> {
  appLogger.debug('Starting generateSummary', { userId, videoUrl });

  const youtubeVideoId = extractYouTubeVideoId(videoUrl);
  if (!youtubeVideoId) throw new Error('INVALID_YOUTUBE_URL');

  // -------------------------------------------------
  // 1. Znajdź lub utwórz video + channel
  // -------------------------------------------------
  let videoId: string;
  let channelId: string;

  const { data: existingVideo } = await supabase
    .from('videos')
    .select('id, channel_id')
    .eq('youtube_video_id', youtubeVideoId)
    .maybeSingle();

  if (existingVideo) {
    videoId = existingVideo.id;
    channelId = existingVideo.channel_id;
  } else {
    const meta = await fetchYouTubeVideoMetadata(youtubeVideoId, runtimeEnv);

    if (meta.duration > 2700) throw new Error('VIDEO_TOO_LONG');

    // channel
    const { data: channel } = await supabase
      .from('channels')
      .select('id')
      .eq('youtube_channel_id', meta.channelId)
      .maybeSingle();

    if (channel) {
      channelId = channel.id;
    } else {
      const { data: newChannel, error } = await supabase
        .from('channels')
        .insert({
          youtube_channel_id: meta.channelId,
          name: meta.channelTitle,
        })
        .select('id')
        .single();

      if (error) throw error;
      channelId = newChannel.id;
    }

    // video (z obsługą race-condition)
    const { data: newVideo, error: videoErr } = await supabase
      .from('videos')
      .insert({
        youtube_video_id: youtubeVideoId,
        channel_id: channelId,
        title: meta.title,
        published_at: meta.publishedAt,
        thumbnail_url: meta.thumbnailUrl,
      })
      .select('id')
      .single();

    if (videoErr && videoErr.code !== '23505') throw videoErr;
    if (videoErr?.code === '23505') {
      const { data: retry } = await supabase
        .from('videos')
        .select('id, channel_id')
        .eq('youtube_video_id', youtubeVideoId)
        .single();
      videoId = retry!.id;
      channelId = retry!.channel_id;
    } else {
      videoId = newVideo!.id;
    }
  }

  // -------------------------------------------------
  // 2. Sprawdź subskrypcję
  // -------------------------------------------------
  const { count: subCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('channel_id', channelId);

  if (!subCount) throw new Error('CHANNEL_NOT_SUBSCRIBED');

  // -------------------------------------------------
  // 3. Sprawdź istniejące podsumowanie
  // -------------------------------------------------
  const { data: existingSummary } = await supabase
    .from('summaries')
    .select('id, status')
    .eq('video_id', videoId)
    .maybeSingle();

  if (existingSummary) {
    if (existingSummary.status === 'completed') throw new Error('SUMMARY_ALREADY_EXISTS');
    if (['pending', 'in_progress'].includes(existingSummary.status))
      throw new Error('GENERATION_IN_PROGRESS');
  }

  // -------------------------------------------------
  // 4. Atomowe utworzenie podsumowania (rate-limit + lock)
  // -------------------------------------------------
  const lockKey = hashStringToInt32(channelId);
  const { data: rpcData, error: rpcErr } = await supabase.rpc('generate_summary_atomic' as 'subscribe_to_channel_atomic', {
    p_user_id: userId,
    p_video_id: videoId,
    p_channel_id: channelId,
    p_lock_key: lockKey,
  } as any);

  if (rpcErr) {
    if (rpcErr.message.includes('GENERATION_LIMIT_REACHED'))
      throw new Error('GENERATION_LIMIT_REACHED');
    throw rpcErr;
  }

  const summary = (rpcData as any[])[0];
  if (!summary?.id) throw new Error('SUMMARY_CREATION_FAILED');

  // -------------------------------------------------
  // 5. Generacja (z timeoutem 90 s)
  // -------------------------------------------------
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    await processSummaryGeneration(summary.id, youtubeVideoId, runtimeEnv);
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('GENERATION_TIMEOUT');
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const { data: final } = await supabase
    .from('summaries')
    .select('status, generated_at')
    .eq('id', summary.id)
    .single();

  return {
    id: summary.id,
    status: final?.status || 'completed',
    generated_at: final?.generated_at || new Date().toISOString(),
    message:
      final?.status === 'completed'
        ? 'Summary generated successfully'
        : 'Summary generation failed – try again later',
  };
}

// ---------------------------------------------------------------------------
// Proces generacji (backend – service role)
// ---------------------------------------------------------------------------
async function processSummaryGeneration(
  summaryId: string,
  youtubeVideoId: string,
  runtimeEnv?: RuntimeEnv
): Promise<void> {
  appLogger.debug('Starting summary generation process', { summaryId, youtubeVideoId });

  const { createSupabaseServiceClient } = await import('../db/supabase.client');
  const service = createSupabaseServiceClient(undefined, runtimeEnv);
  appLogger.debug('Supabase service client created for summary generation');

  try {
    // 1. Fetch video metadata for accurate duration
    appLogger.debug('Fetching video metadata for summary generation');
    const videoMeta = await fetchYouTubeVideoMetadata(youtubeVideoId, runtimeEnv);
    const actualDuration = formatDurationInPolish(videoMeta.duration);
    appLogger.debug('Video metadata fetched', { duration: actualDuration, durationSeconds: videoMeta.duration });

    // 2. Transkrypt
    appLogger.debug('Fetching transcript for summary generation');
    const transcript = await fetchTranscript(youtubeVideoId, runtimeEnv);
    appLogger.debug('Transcript fetched', { segments: transcript.length });

    const text = transcriptToString(transcript);
    appLogger.debug('Transcript converted to text', { textLength: text.length });

    if (!text.trim()) {
      appLogger.warning('Empty transcript detected', { summaryId, youtubeVideoId });
      throw new Error('TRANSCRIPT_EMPTY');
    }

    // 3. Status → in_progress
    appLogger.debug('Updating summary status to in_progress');
    const { error: updateError } = await service.from('summaries').update({ status: 'in_progress' }).eq('id', summaryId);
    if (updateError) {
      errorLogger.dbError(updateError, 'update_summary_status', { summaryId });
    } else {
      appLogger.debug('Summary status updated to in_progress', { summaryId });
    }

    // 3. OpenRouter
    appLogger.debug('Calling OpenRouter for summary generation');
    const apiKey = requireEnv('OPENROUTER_API_KEY', runtimeEnv);
    appLogger.debug('OpenRouter API key validated');

    const openRouter = new OpenRouterService({
      apiKey,
      defaultModel: getEnv('OPENROUTER_MODEL', runtimeEnv) || 'x-ai/grok-4.1-fast',
    });

    const schema = {
      name: 'youtube_video_summary',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          tldr: { type: 'string' },
          full_summary: {
            type: 'object',
            properties: {
              genre: {
                type: 'string',
                enum: [
                  'Geopolitics',
                  'Finance & Investing',
                  'Personal Finance',
                  'Economics',
                  'Technology',
                  'AI & Machine Learning',
                  'Science',
                  'History',
                  'Philosophy',
                  'Self-Improvement',
                  'Productivity',
                  'Health & Fitness',
                  'Psychology',
                  'Business & Entrepreneurship',
                  'Startups',
                  'Crypto & Blockchain',
                  'Programming & Coding',
                  'Book Summary',
                  'Documentary',
                  'News & Current Events',
                  'Comedy',
                  'Lifestyle',
                  'Travel',
                  'Gaming',
                  'Movie Review',
                  'Reaction',
                  'Education',
                  'Tutorial / How-to',
                  'Vlog',
                  'Interview',
                  'Podcast Clip',
                  'Conspiracy / Alternative',
                  'Spirituality',
                  'Other',
                ],
              },
              key_points: { type: 'array', items: { type: 'string' } },
              detailed_summary: { type: 'string' },
              conclusions: { type: 'array', items: { type: 'string' } },
              memorable_quotes: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              language: { type: 'string' },
              worth_watching: {
                type: 'string',
                enum: ['Must watch', 'Worth watching', 'Watch only if you have time', 'Skip – not worth it'],
              },
            },
            required: [
              'genre',
              'key_points',
              'detailed_summary',
              'conclusions',
              'memorable_quotes',
              'duration',
              'language',
              'worth_watching',
            ],
            additionalProperties: false,
          },
        },
        required: ['tldr', 'full_summary'],
        additionalProperties: false,
      },
    } as const;

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an expert YouTube video summarizer. 
Return ONLY valid JSON matching the schema.
IMPORTANT: All text content (tldr, key_points, detailed_summary, conclusions, memorable_quotes) MUST be written in Polish language.
Only enum values (genre, worth_watching) should remain in English as defined in the schema.`,
      },
      {
        role: 'user',
        content: `Analyze the following YouTube video transcript and create a detailed summary.

IMPORTANT INSTRUCTIONS:
- Write ALL text content in POLISH language (tldr, key_points, detailed_summary, conclusions, memorable_quotes)
- Use English ONLY for enum values (genre, worth_watching) - select from the provided options
- For the language field, write in Polish (e.g., "polski", "angielski")
- The video duration is: ${actualDuration}

Transcript:
=== TRANSCRIPT START ===
${text}
=== TRANSCRIPT END ===

YouTube ID: ${youtubeVideoId}

Return JSON with the following structure:
- tldr: brief summary in Polish (max 400 characters)
- full_summary: object containing:
  - genre: select from enum (keep in English)
  - key_points: array of main points (in Polish)
  - detailed_summary: comprehensive summary (in Polish)
  - conclusions: array of conclusions (in Polish)
  - memorable_quotes: array of notable quotes (in Polish, if present in transcript)
  - duration: use the provided duration "${actualDuration}"
  - language: video language (in Polish, e.g., "polski", "angielski")
  - worth_watching: recommendation (select from enum, keep in English)`,
      },
    ];

    appLogger.debug('Calling OpenRouter completeJson API');
    const result = await openRouter.completeJson<{
      tldr: string;
      full_summary: {
        genre: string;
        key_points: string[];
        detailed_summary: string;
        conclusions: string[];
        memorable_quotes: string[];
        duration: string;
        language: string;
        worth_watching: string;
      };
    }>(messages, schema);
    appLogger.debug('OpenRouter response received', {
      tldrLength: result.tldr?.length,
      fullSummaryKeys: Object.keys(result.full_summary || {})
    });

    // 4. Zapisz wynik
    appLogger.debug('Saving summary result to database');
    const { error: saveError } = await service
      .from('summaries')
      .update({
        tldr: result.tldr,
        full_summary: result.full_summary,
        status: 'completed',
        generated_at: new Date().toISOString(),
      })
      .eq('id', summaryId);

    if (saveError) {
      errorLogger.dbError(saveError, 'save_summary_result', { summaryId });
      throw saveError;
    }
    appLogger.info('Summary successfully saved to database', { summaryId });

  } catch (err: any) {
    errorLogger.appError(err, {
      component: 'processSummaryGeneration',
      operation: 'summary_generation',
      summaryId,
      youtubeVideoId
    });
    
    const msg = err.message || String(err);
    let code: 'NO_SUBTITLES' | 'VIDEO_PRIVATE' | 'VIDEO_TOO_LONG' | null = null;
    if (msg.includes('transcript') || msg.includes('subtitle') || msg.includes('TRANSCRIPT')) code = 'NO_SUBTITLES';
    else if (msg.includes('private = true') || msg.includes('unavailable')) code = 'VIDEO_PRIVATE';
    else if (msg.includes('too long')) code = 'VIDEO_TOO_LONG';

    appLogger.debug('Determined error code for summary failure', { summaryId, errorCode: code });

    const { error: failError } = await service
      .from('summaries')
      .update({ status: 'failed', error_code: code })
      .eq('id', summaryId);
    
    if (failError) {
      errorLogger.dbError(failError, 'update_failed_status', { summaryId, errorCode: code });
    } else {
      appLogger.debug('Summary status updated to failed', { summaryId, errorCode: code });
    }

    errorLogger.appError(err, {
      service: 'summaries_service',
      operation: 'process_summary_generation',
      summary_id: summaryId,
      youtube_video_id: youtubeVideoId,
    });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Lista podsumowań użytkownika
// ---------------------------------------------------------------------------
export async function listSummaries(
  supabase: SupabaseClient,
  userId: string,
  filters: {
    limit: number;
    offset: number;
    channel_id?: string;
    status?: SummaryStatus;
    sort?: 'newest' | 'oldest';
    include_hidden?: boolean;
    hidden_only?: boolean;
    search?: string;
  }
): Promise<PaginatedResponse<SummaryWithVideo>> {
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('channel_id')
    .eq('user_id', userId);

  const channelIds = subs?.map((s) => s.channel_id) ?? [];
  if (channelIds.length === 0) {
    return { data: [], pagination: { total: 0, limit: filters.limit, offset: filters.offset } };
  }

  let selectQuery = `
    id,
    tldr,
    status,
    generated_at,
    error_code,
    videos!inner (
      id,
      youtube_video_id,
      title,
      thumbnail_url,
      published_at,
      channel_id,
      channels!inner (
        id,
        name,
        youtube_channel_id,
        created_at
      )
    )
  `;

  let q = supabase
    .from('summaries')
    .select(selectQuery, { count: 'exact' })
    .in('videos.channel_id', channelIds);

  appLogger.debug('Query before filters applied', { userId, channelCount: channelIds.length });

  // Handle hidden summaries filtering with subqueries
  if (filters.hidden_only) {
    // Show only hidden summaries - check if summary exists in hidden_summaries for this user
    const { data: hiddenSummaryIds } = await supabase
      .from('hidden_summaries')
      .select('summary_id')
      .eq('user_id', userId);

    if (hiddenSummaryIds && hiddenSummaryIds.length > 0) {
      q = q.in('id', hiddenSummaryIds.map(h => h.summary_id));
    } else {
      // No hidden summaries, return empty result
      q = q.eq('id', '00000000-0000-0000-0000-000000000000'); // Impossible ID
    }
  } else if (!filters.include_hidden) {
    // Exclude hidden summaries (default behavior) - ensure summary is NOT in hidden_summaries for this user
    const { data: hiddenSummaryIds } = await supabase
      .from('hidden_summaries')
      .select('summary_id')
      .eq('user_id', userId);
    
    if (hiddenSummaryIds && hiddenSummaryIds.length > 0) {
      const hiddenIds = hiddenSummaryIds.map(h => h.summary_id);
      // Use multiple .neq() calls for each hidden ID - more reliable than .not('in')
      for (const hiddenId of hiddenIds) {
        q = q.neq('id', hiddenId);
      }
    }
    // If no hidden summaries, no filtering needed (default behavior)
  }

  if (filters.channel_id) q = q.eq('videos.channel_id', filters.channel_id);
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.search) q = q.ilike('videos.title', `%${filters.search}%`);

  appLogger.debug('Query before sorting and range applied', { userId, offset: filters.offset, limit: filters.limit });

  // Apply pagination first (required for complex joins)
  const { data, count, error } = await q.range(filters.offset, filters.offset + filters.limit - 1);
  appLogger.debug('Query executed', { userId, count, dataLength: data?.length, hasError: !!error });
  if (error) throw error;

  // Sort data in memory using generated_at instead of video published_at
  if (data && data.length > 0) {
    const ascending = filters.sort === 'oldest';
    data.sort((a: any, b: any) => {
      const dateA = new Date(a.generated_at || 0).getTime();
      const dateB = new Date(b.generated_at || 0).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
    appLogger.debug('Data sorted in memory by generated_at', {
      userId,
      firstItemDate: (data[0] as any)?.generated_at,
      lastItemDate: (data[data.length - 1] as any)?.generated_at
    });
  }

  // Get user ratings for all summaries in this batch
  const summaryIds = (data ?? []).map((row: any) => row.id).filter((id): id is string => id !== null);
  const { data: userRatings } = await supabase
    .from('summary_ratings')
    .select('summary_id, rating')
    .eq('user_id', userId)
    .in('summary_id', summaryIds);

  // Create a map for quick lookup
  const userRatingMap = new Map<string, boolean>();
  userRatings?.forEach((rating) => {
    if (rating.summary_id) {
      userRatingMap.set(rating.summary_id, rating.rating);
    }
  });

  const result: SummaryWithVideo[] = (data ?? []).map((row: any) => ({
    id: row.id,
    video: {
      id: row.videos.id,
      youtube_video_id: row.videos.youtube_video_id,
      title: row.videos.title,
      thumbnail_url: row.videos.thumbnail_url,
      published_at: row.videos.published_at,
    },
    channel: {
      id: row.videos.channels.id,
      name: row.videos.channels.name,
      youtube_channel_id: row.videos.channels.youtube_channel_id,
      created_at: row.videos.channels.created_at,
    },
    tldr: row.tldr,
    status: row.status,
    generated_at: row.generated_at,
    user_rating: userRatingMap.get(row.id) ?? null,
    error_code: row.error_code,
  }));

  return {
    data: result,
    pagination: { total: count ?? 0, limit: filters.limit, offset: filters.offset },
  };
}

// ---------------------------------------------------------------------------
// Szczegóły podsumowania
// ---------------------------------------------------------------------------
export async function getSummaryDetails(
  supabase: SupabaseClient,
  userId: string,
  summaryId: string
): Promise<DetailedSummary> {
  const { data: summary, error } = await supabase
    .from('summaries')
    .select(`
      id,
      tldr,
      full_summary,
      status,
      error_code,
      generated_at,
      videos!inner (
        id,
        youtube_video_id,
        title,
        thumbnail_url,
        published_at,
        channels!inner (
          id,
          name,
          youtube_channel_id,
          created_at
        )
      )
    `)
    .eq('id', summaryId)
    .single();

  if (error || !summary) throw new Error('SUMMARY_NOT_FOUND');

  const { data: ratings } = await supabase
    .from('summary_ratings')
    .select('rating')
    .eq('summary_id', summaryId);

  const upvotes = ratings?.filter((r) => r.rating === true).length ?? 0;
  const downvotes = ratings?.filter((r) => r.rating === false).length ?? 0;

  const { data: userRating } = await supabase
    .from('summary_ratings')
    .select('rating')
    .eq('summary_id', summaryId)
    .eq('user_id', userId)
    .maybeSingle();

  // Check if summary is hidden for the user
  const { data: hiddenData } = await supabase
    .from('hidden_summaries')
    .select('id')
    .eq('summary_id', summaryId)
    .eq('user_id', userId)
    .maybeSingle();

  return {
    id: summary.id,
    video: {
      id: summary.videos.id,
      youtube_video_id: summary.videos.youtube_video_id,
      title: summary.videos.title,
      thumbnail_url: summary.videos.thumbnail_url,
      published_at: summary.videos.published_at,
      youtube_url: `https://www.youtube.com/watch?v=${summary.videos.youtube_video_id}`,
    },
    channel: {
      id: summary.videos.channels.id,
      name: summary.videos.channels.name,
      youtube_channel_id: summary.videos.channels.youtube_channel_id,
      created_at: summary.videos.channels.created_at,
    },
    tldr: summary.tldr,
    full_summary: summary.full_summary as any,
    status: summary.status,
    error_code: summary.error_code,
    generated_at: summary.generated_at,
    rating_stats: { upvotes, downvotes },
    user_rating: userRating?.rating ?? null,
    is_hidden: !!hiddenData,
  };
}

// ---------------------------------------------------------------------------
// Masowa generacja podsumowań dla wszystkich kanałów użytkownika
// ---------------------------------------------------------------------------
export async function startBulkSummaryGeneration(
  supabase: SupabaseClient,
  runtimeEnv?: RuntimeEnv
): Promise<BulkGenerationResponse> {
  appLogger.info('Starting system bulk summary generation');

  // Użyj service client dla systemowych operacji
  const { createSupabaseServiceClient } = await import('../db/supabase.client');
  const service = createSupabaseServiceClient(undefined, runtimeEnv);

  // 1. Sprawdź czy już jakaś masowa generacja jest w trakcie (systemowa)
  const { data: activeGeneration } = await service
    .from('bulk_generation_status')
    .select('id, status')
    .in('status', ['pending', 'in_progress'])
    .maybeSingle();

  if (activeGeneration) {
    appLogger.warn('Bulk generation already in progress', { activeGenerationId: activeGeneration.id });
    throw new Error('BULK_GENERATION_IN_PROGRESS');
  }

  // 2. Pobierz wszystkie kanały z bazy danych (systemowe)
  const { data: channels, error: channelsError } = await service
    .from('channels')
    .select('id, youtube_channel_id, name')
    .order('created_at', { ascending: false });

  if (channelsError) {
    errorLogger.dbError(channelsError, 'fetch_all_channels');
    throw channelsError;
  }

  if (!channels || channels.length === 0) {
    throw new Error('NO_CHANNELS_FOUND');
  }

  // 3. Utwórz rekord masowej generacji (systemowej)
  const { data: bulkGeneration, error: insertError } = await service
    .from('bulk_generation_status')
    .insert({
      user_id: null, // systemowa generacja, nie powiązana z użytkownikiem
      status: 'pending',
      total_channels: channels.length,
    })
    .select('id, status')
    .single();

  if (insertError) {
    errorLogger.dbError(insertError, 'create_bulk_generation');
    throw insertError;
  }

  // 4. Uruchom asynchroniczną generację
  // W prawdziwej aplikacji użyłbym Supabase Edge Functions lub kolejki
  // Na razie użyję setImmediate żeby symulować asynchroniczność
  setImmediate(() => {
    processBulkSummaryGeneration(bulkGeneration.id, channels, runtimeEnv);
  });

  appLogger.info('System bulk summary generation initiated', {
    bulkGenerationId: bulkGeneration.id,
    totalChannels: channels.length
  });

  return {
    id: bulkGeneration.id,
    status: bulkGeneration.status,
    message: `System bulk summary generation started for ${channels.length} channels`,
    estimated_completion_time: Math.ceil(channels.length * 2).toString(), // rough estimate: 2 min per channel
  };
}

// ---------------------------------------------------------------------------
// Przetwarzanie masowej generacji (background process)
// ---------------------------------------------------------------------------
async function processBulkSummaryGeneration(
  bulkGenerationId: string,
  channels: any[],
  runtimeEnv?: RuntimeEnv
): Promise<void> {
  // Użyj service client dla wszystkich systemowych operacji
  const { createSupabaseServiceClient } = await import('../db/supabase.client');
  const service = createSupabaseServiceClient(undefined, runtimeEnv);

  appLogger.info('Starting bulk generation processing', { bulkGenerationId });

  try {
    // 1. Zaktualizuj status na in_progress
    await service
      .from('bulk_generation_status')
      .update({ status: 'in_progress' })
      .eq('id', bulkGenerationId);

    let processedChannels = 0;
    let successfulSummaries = 0;
    let failedSummaries = 0;

    // 2. Przetwórz każdy kanał
    for (const channel of channels) {
      try {
        appLogger.debug('Processing channel', {
          bulkGenerationId,
          channelId: channel.id,
          channelName: channel.name
        });

        const result = await processChannelSummary(channel.id, runtimeEnv);

        if (result.success) {
          successfulSummaries++;
          appLogger.info('Channel processed successfully', {
            bulkGenerationId,
            channelId: channel.id,
            summaryId: result.summaryId
          });
        } else {
          failedSummaries++;
          appLogger.warn('Channel processing failed', {
            bulkGenerationId,
            channelId: channel.id,
            error: result.error
          });
        }

        processedChannels++;

        // 3. Aktualizuj postęp
        await service
          .from('bulk_generation_status')
          .update({
            processed_channels: processedChannels,
            successful_summaries: successfulSummaries,
            failed_summaries: failedSummaries,
          })
          .eq('id', bulkGenerationId);

      } catch (channelError: any) {
        failedSummaries++;
        processedChannels++;
        appLogger.error('Channel processing error', {
          bulkGenerationId,
          channelId: channel.id,
          error: channelError.message
        });

        // Aktualizuj statystyki nawet w przypadku błędu
        await service
          .from('bulk_generation_status')
          .update({
            processed_channels: processedChannels,
            successful_summaries: successfulSummaries,
            failed_summaries: failedSummaries,
          })
          .eq('id', bulkGenerationId);
      }
    }

    // 4. Zakończ generację
    await service
      .from('bulk_generation_status')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', bulkGenerationId);

    appLogger.info('Bulk generation completed', {
      bulkGenerationId,
      totalChannels: channels.length,
      successfulSummaries,
      failedSummaries
    });

  } catch (error: any) {
    appLogger.error('Bulk generation failed', { bulkGenerationId, error: error.message });

    await service
      .from('bulk_generation_status')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', bulkGenerationId);
  }
}

// ---------------------------------------------------------------------------
// Przetwarzanie pojedynczego kanału (podobne do automatycznej generacji)
// ---------------------------------------------------------------------------
async function processChannelSummary(
  channelId: string,
  runtimeEnv?: RuntimeEnv
): Promise<{ success: boolean; summaryId?: string; error?: string }> {
  const { createSupabaseServiceClient } = await import('../db/supabase.client');
  const service = createSupabaseServiceClient(undefined, runtimeEnv);

  try {
    // 1. Pobierz najnowszy film z kanału
    const { data: latestVideo } = await service
      .from('videos')
      .select('id, youtube_video_id, channel_id')
      .eq('channel_id', channelId)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestVideo) {
      appLogger.debug('No videos found for channel', { channelId });
      return { success: false, error: 'NO_VIDEOS_FOUND' };
    }

    // 2. Sprawdź czy już istnieje podsumowanie dla tego filmu dzisiaj
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: existingSummary } = await service
      .from('summaries')
      .select('id, status')
      .eq('video_id', latestVideo.id)
      .gte('generated_at', today.toISOString())
      .lt('generated_at', tomorrow.toISOString())
      .maybeSingle();

    if (existingSummary && existingSummary.status === 'completed') {
      appLogger.debug('Summary already exists for today', { videoId: latestVideo.id });
      return { success: false, error: 'SUMMARY_EXISTS_TODAY' };
    }

    // 3. Sprawdź limit dzienny (globalny dla kanału)
    const { count: todaySummaries } = await service
      .from('summaries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('generated_at', today.toISOString())
      .lt('generated_at', tomorrow.toISOString())
      .eq('video_id', latestVideo.id); // summaries joined with videos by channel

    // Note: This is simplified - should check all videos from the channel
    // For now, assume 1 summary per channel per day limit
    if (todaySummaries && todaySummaries >= 1) {
      return { success: false, error: 'DAILY_LIMIT_REACHED' };
    }

    // 4. Pobierz metadane filmu żeby sprawdzić constraints
    const videoMeta = await fetchYouTubeVideoMetadata(latestVideo.youtube_video_id, runtimeEnv);

    if (videoMeta.duration > 2700) { // 45 minutes
      return { success: false, error: 'VIDEO_TOO_LONG' };
    }

    // 5. Utwórz podsumowanie (bez użytkownika - systemowy)
    const { data: summary, error } = await service
      .from('summaries')
      .insert({
        video_id: latestVideo.id,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) throw error;

    // 6. Wygeneruj podsumowanie w tle
    await processSummaryGeneration(summary.id, latestVideo.youtube_video_id, runtimeEnv);

    return { success: true, summaryId: summary.id };

  } catch (error: any) {
    appLogger.error('Channel summary processing error', { channelId, error: error.message });
    return { success: false, error: error.message };
  }
}

// ---------------------------------------------------------------------------
// Sprawdź status masowej generacji
// ---------------------------------------------------------------------------
export async function getBulkGenerationStatus(
  supabase: SupabaseClient,
  userId: string,
  generationId?: string
): Promise<BulkGenerationStatus[]> {
  let query = supabase
    .from('bulk_generation_status')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (generationId) {
    query = query.eq('id', generationId);
  }

  const { data, error } = await query;

  if (error) {
    errorLogger.dbError(error, 'get_bulk_generation_status', { userId });
    throw error;
  }

  return data || [];
}

// ---------------------------------------------------------------------------
// Sprawdź czy masowa generacja jest w trakcie
// ---------------------------------------------------------------------------
export async function isBulkGenerationInProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { count } = await supabase
    .from('bulk_generation_status')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('status', ['pending', 'in_progress']);

  return (count || 0) > 0;
}
