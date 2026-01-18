#!/usr/bin/env node

/**
 * Development script to process all pending summary queue items locally
 * Useful for development when GitHub Actions cron jobs aren't available
 *
 * Requirements:
 * - Development server must be running (localhost access allowed)
 * - CRON_SECRET not needed for local development
 *
 * Usage:
 *   npm run process-queue-all
 *   APP_URL=http://localhost:3000 npm run process-queue-all
 */

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function processAllQueueItems() {
  console.log('🚀 Starting queue processing...');
  let processedCount = 0;
  let errorCount = 0;

  while (true) {
    try {
      console.log(`\n🔄 Processing queue item #${processedCount + 1}...`);

      const headers = {
        'Content-Type': 'application/json',
      };

      // Cron secret not needed for local development (middleware allows access)
      // Only add if explicitly set and we're not connecting to localhost
      if (process.env.CRON_SECRET && !APP_URL.includes('localhost')) {
        headers['x-cron-secret'] = process.env.CRON_SECRET;
      }

      const response = await fetch(`${APP_URL}/api/summaries/process-next`, {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (response.ok) {
        if (data.data.processed) {
          processedCount++;
          console.log('✅ Queue item processed successfully');
          console.log(`   📹 Video ID: ${data.data.videoId}`);
          console.log(`   📄 Summary ID: ${data.data.summaryId}`);
          console.log(`   📊 Success: ${data.data.success}`);
          if (!data.data.success && data.data.error) {
            console.log(`   ❌ Error: ${data.data.error}`);
            errorCount++;
          }

          // Small delay between processing to avoid overwhelming
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log('ℹ️  No more queue items to process');
          console.log(`   📝 Message: ${data.data.message}`);
          break;
        }
      } else {
        console.error('❌ Failed to process queue:');
        console.error(`   📊 HTTP Status: ${response.status}`);
        console.error(`   📝 Error: ${data.error?.message || 'Unknown error'}`);
        if (data.error?.code) {
          console.error(`   🏷️  Code: ${data.error.code}`);
        }
        if (response.status === 401) {
          console.error('   💡 Hint: Check authentication or server configuration');
        }
        errorCount++;
        break;
      }
    } catch (error) {
      if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
        console.error('❌ Could not connect to the development server. Make sure to run `npm run dev` first.');
        console.error(`   Expected server at: ${APP_URL}`);
      } else {
        console.error('❌ Error calling process endpoint:', error.message);
      }
      errorCount++;
      break;
    }
  }

  console.log(`\n📊 Processing complete:`);
  console.log(`   ✅ Items processed: ${processedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

// If run directly, process all items
if (import.meta.url === `file://${process.argv[1]}`) {
  processAllQueueItems();
}

export { processAllQueueItems };