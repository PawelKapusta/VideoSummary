import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

console.log('Daily summary generation function started');

serve(async (req: Request) => {
  try {
    // Sprawdź metodę HTTP
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Sprawdź autoryzację - tylko service role może wywoływać tę funkcję
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.substring(7);

    // Pobierz zmienne środowiskowe
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables');
      return new Response('Server configuration error', { status: 500 });
    }

    // Sprawdź czy token to service role key
    if (token !== supabaseServiceKey) {
      console.error('Invalid service role key');
      return new Response('Unauthorized', { status: 401 });
    }

    // Utwórz klienta Supabase z service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('Starting bulk summary generation...');

    // Import funkcji (w prawdziwej aplikacji trzeba by to zrobić inaczej)
    // Tutaj symuluję wywołanie - w rzeczywistości należałoby
    // zreplikować logikę z summaries.service.ts

    // 1. Sprawdź czy już jakaś generacja jest w trakcie
    const { data: activeGeneration } = await supabase
      .from('bulk_generation_status')
      .select('id, status')
      .in('status', ['pending', 'in_progress'])
      .maybeSingle();

    if (activeGeneration) {
      console.log('Bulk generation already in progress:', activeGeneration.id);
      return new Response(
        JSON.stringify({
          error: 'Bulk generation already in progress',
          generation_id: activeGeneration.id
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 2. Pobierz wszystkie kanały
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id, youtube_channel_id, name')
      .order('created_at', { ascending: false });

    if (channelsError) {
      console.error('Error fetching channels:', channelsError);
      return new Response('Database error', { status: 500 });
    }

    if (!channels || channels.length === 0) {
      console.log('No channels found');
      return new Response(
        JSON.stringify({ message: 'No channels found' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 3. Utwórz rekord generacji
    const { data: bulkGeneration, error: insertError } = await supabase
      .from('bulk_generation_status')
      .insert({
        user_id: null, // systemowa generacja
        status: 'pending',
        total_channels: channels.length,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating bulk generation:', insertError);
      return new Response('Database error', { status: 500 });
    }

    console.log(`Created bulk generation ${bulkGeneration.id} for ${channels.length} channels`);

    // 4. Dodaj wszystkie kanały do kolejki
    const workerId = `bulk-${bulkGeneration.id}-${Date.now()}`;
    const queueItems = [];

    for (const channel of channels) {
      try {
        // Pobierz najnowszy film dla kanału
        const { data: latestVideo } = await supabase
          .from('videos')
          .select('id, youtube_video_id, channel_id')
          .eq('channel_id', channel.id)
          .order('published_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!latestVideo) {
          console.log(`No videos found for channel ${channel.id}, skipping`);
          continue;
        }

        // Sprawdź czy już istnieje podsumowanie dla tego filmu dzisiaj
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: existingSummary } = await supabase
          .from('summaries')
          .select('id, status')
          .eq('video_id', latestVideo.id)
          .gte('generated_at', today.toISOString())
          .lt('generated_at', tomorrow.toISOString())
          .maybeSingle();

        if (existingSummary && existingSummary.status === 'completed') {
          console.log(`Summary already exists for video ${latestVideo.id} today, skipping`);
          continue;
        }

        // Sprawdź czy zadanie już jest w kolejce
        const { data: existingQueueItem } = await supabase
          .from('summary_queue')
          .select('id')
          .eq('video_id', latestVideo.id)
          .in('status', ['pending', 'processing'])
          .maybeSingle();

        if (existingQueueItem) {
          console.log(`Video ${latestVideo.id} already in queue, skipping`);
          continue;
        }

        // Dodaj do kolejki
        queueItems.push({
          video_id: latestVideo.id,
          priority: 1, // Normal priority for daily generation
          status: 'pending'
        });

      } catch (error) {
        console.error(`Error checking channel ${channel.id}:`, error);
        // Continue with other channels
      }
    }

    // Insert all queue items in batch
    if (queueItems.length > 0) {
      const { error: queueError } = await supabase
        .from('summary_queue')
        .insert(queueItems);

      if (queueError) {
        console.error('Error adding items to queue:', queueError);
        return new Response('Queue error', { status: 500 });
      }

      console.log(`Added ${queueItems.length} items to summary queue`);
    }

    // 5. Uruchom przetwarzanie kolejki partiami
    processQueueBatch(supabase, workerId, bulkGeneration.id);

    return new Response(
      JSON.stringify({
        message: 'Daily summary generation started',
        generation_id: bulkGeneration.id,
        total_channels: channels.length
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response('Internal server error', { status: 500 });
  }
});

// Przetwarzanie kolejki partiami
async function processQueueBatch(supabase: any, workerId: string, bulkGenerationId: string) {
  const BATCH_SIZE = 3; // Przetwarzaj 3 zadania naraz żeby nie przeciążyć
  const MAX_PROCESSING_TIME = 4 * 60 * 1000; // 4 minuty max
  const startTime = Date.now();

  try {
    console.log(`Starting queue processing with worker ${workerId}`);

    // Zaktualizuj status generacji na in_progress
    await supabase
      .from('bulk_generation_status')
      .update({ status: 'in_progress' })
      .eq('id', bulkGenerationId);

    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;

    while (Date.now() - startTime < MAX_PROCESSING_TIME) {
      // Pobierz następną partię zadań
      const { data: queueItems, error: fetchError } = await supabase
        .from('summary_queue')
        .select(`
          id,
          video_id,
          retry_count,
          max_retries,
          videos (
            id,
            youtube_video_id,
            title
          )
        `)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('queued_at', { ascending: true })
        .limit(BATCH_SIZE);

      if (fetchError) {
        console.error('Error fetching queue items:', fetchError);
        break;
      }

      if (!queueItems || queueItems.length === 0) {
        console.log('No more pending items in queue');
        break;
      }

      console.log(`Processing batch of ${queueItems.length} items`);

      // Przetwórz każde zadanie w partii
      for (const item of queueItems) {
        try {
          // Oznacz zadanie jako przetwarzane
          await supabase
            .from('summary_queue')
            .update({
              status: 'processing',
              started_at: new Date().toISOString(),
              worker_id: workerId
            })
            .eq('id', item.id);

          console.log(`Processing summary for video ${item.videos.youtube_video_id}`);

          // Przetwórz podsumowanie
          const result = await processSummaryForVideo(supabase, item.video_id, item.id);

          if (result.success) {
            // Oznacz jako ukończone
            await supabase
              .from('summary_queue')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString()
              })
              .eq('id', item.id);

            totalSuccessful++;
            console.log(`Successfully processed video ${item.videos.youtube_video_id}`);
          } else {
            // Sprawdź czy można retry
            const newRetryCount = item.retry_count + 1;
            if (newRetryCount < item.max_retries) {
              // Reset do pending dla retry
              await supabase
                .from('summary_queue')
                .update({
                  status: 'pending',
                  retry_count: newRetryCount,
                  error_message: result.error,
                  worker_id: null,
                  started_at: null
                })
                .eq('id', item.id);

              console.log(`Retrying video ${item.videos.youtube_video_id} (attempt ${newRetryCount})`);
            } else {
              // Oznacz jako failed
              await supabase
                .from('summary_queue')
                .update({
                  status: 'failed',
                  error_message: result.error,
                  completed_at: new Date().toISOString()
                })
                .eq('id', item.id);

              totalFailed++;
              console.error(`Failed to process video ${item.videos.youtube_video_id} after ${item.max_retries} attempts`);
            }
          }

          totalProcessed++;

        } catch (itemError: any) {
          console.error(`Error processing queue item ${item.id}:`, itemError);

          // Oznacz jako failed
          await supabase
            .from('summary_queue')
            .update({
              status: 'failed',
              error_message: itemError.message,
              completed_at: new Date().toISOString()
            })
            .eq('id', item.id);

          totalFailed++;
          totalProcessed++;
        }
      }

      // Krótka przerwa między partiami żeby nie przeciążyć systemu
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Sprawdź czy zostały jakieś oczekujące zadania
    const { count: remainingCount } = await supabase
      .from('summary_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Zaktualizuj status generacji
    const finalStatus = remainingCount > 0 ? 'in_progress' : 'completed';
    await supabase
      .from('bulk_generation_status')
      .update({
        status: finalStatus,
        processed_channels: totalProcessed,
        successful_summaries: totalSuccessful,
        failed_summaries: totalFailed,
        completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', bulkGenerationId);

    console.log(`Queue processing completed. Processed: ${totalProcessed}, Successful: ${totalSuccessful}, Failed: ${totalFailed}, Remaining: ${remainingCount || 0}`);

  } catch (error: any) {
    console.error(`Queue processing failed:`, error);

    await supabase
      .from('bulk_generation_status')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', bulkGenerationId);
  }
}

// Przetwarzanie podsumowania dla konkretnego filmu
async function processSummaryForVideo(supabase: any, videoId: string, queueItemId: string): Promise<{ success: boolean; summaryId?: string; error?: string }> {
  try {
    console.log(`Processing summary for video ${videoId}`);

    // 1. Sprawdź czy podsumowanie już istnieje dla tego filmu
    const { data: existingSummary } = await supabase
      .from('summaries')
      .select('id, status')
      .eq('video_id', videoId)
      .maybeSingle();

    if (existingSummary) {
      if (existingSummary.status === 'completed') {
        console.log(`Summary already exists for video ${videoId}`);
        return { success: false, error: 'SUMMARY_ALREADY_EXISTS' };
      } else if (existingSummary.status === 'processing') {
        console.log(`Summary already being processed for video ${videoId}`);
        return { success: false, error: 'ALREADY_PROCESSING' };
      }
      // Jeśli failed lub pending, możemy nadpisać
    }

    // 2. Pobierz informacje o filmie
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        channel_id,
        channels (
          id,
          name
        )
      `)
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      console.error('Error fetching video:', videoError);
      return { success: false, error: 'VIDEO_NOT_FOUND' };
    }

    // 3. Utwórz lub zaktualizuj podsumowanie
    const summaryData = {
      video_id: videoId,
      status: 'pending',
    };

    let summaryId: string;

    if (existingSummary) {
      // Zaktualizuj istniejące
      const { error: updateError } = await supabase
        .from('summaries')
        .update(summaryData)
        .eq('id', existingSummary.id);

      if (updateError) {
        console.error('Error updating summary:', updateError);
        return { success: false, error: 'UPDATE_FAILED' };
      }

      summaryId = existingSummary.id;
      console.log(`Updated existing summary ${summaryId}`);
    } else {
      // Utwórz nowe
      const { data: newSummary, error: insertError } = await supabase
        .from('summaries')
        .insert(summaryData)
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating summary:', insertError);
        return { success: false, error: 'CREATION_FAILED' };
      }

      summaryId = newSummary.id;
      console.log(`Created new summary ${summaryId}`);
    }

    // 4. WYGENERUJ PODSUMOWANIE
    // Tutaj powinna być prawdziwa logika generacji z OpenRouter
    // Na razie placeholder

    try {
      // Symulacja przetwarzania AI
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 sekundy

      const mockSummary = {
        tldr: `Automated summary for "${video.title}" by ${video.channels.name}`,
        full_summary: {
          genre: 'Technology', // Placeholder - w rzeczywistości z AI
          key_points: [
            'This is an automated summary generated by the system',
            `Video from channel: ${video.channels.name}`,
            'Content analysis performed automatically'
          ],
          detailed_summary: `This video titled "${video.title}" was automatically summarized by the daily generation system. The system analyzed the video content and created this placeholder summary. In a full implementation, this would contain actual AI-generated insights from the video transcript.`,
          conclusions: [
            'Automated processing completed successfully',
            'Summary ready for user consumption'
          ],
          memorable_quotes: [],
          duration: 'Unknown', // Placeholder
          language: 'en',
          worth_watching: 'Yes'
        },
        status: 'completed',
        generated_at: new Date().toISOString(),
      };

      // Zaktualizuj podsumowanie
      const { error: finalUpdateError } = await supabase
        .from('summaries')
        .update(mockSummary)
        .eq('id', summaryId);

      if (finalUpdateError) {
        console.error('Error finalizing summary:', finalUpdateError);
        return { success: false, error: 'FINALIZATION_FAILED' };
      }

      console.log(`Successfully generated summary ${summaryId} for video ${video.youtube_video_id}`);
      return { success: true, summaryId };

    } catch (generationError: any) {
      console.error('Error during summary generation:', generationError);

      // Oznacz jako failed
      await supabase
        .from('summaries')
        .update({
          status: 'failed',
          error_code: 'GENERATION_ERROR',
          generated_at: new Date().toISOString(),
        })
        .eq('id', summaryId);

      return { success: false, error: generationError.message };
    }

  } catch (error: any) {
    console.error(`Error processing summary for video ${videoId}:`, error);
    return { success: false, error: error.message };
  }
}