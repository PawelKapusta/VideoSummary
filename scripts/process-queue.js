#!/usr/bin/env node

/**
 * Development script to process the summary queue locally
 * Calls the /api/summaries/process-next endpoint
 *
 * Requirements:
 * - Development server must be running (localhost access allowed)
 * - CRON_SECRET not needed for local development
 *
 * Usage:
 *   npm run process-queue
 *   APP_URL=http://localhost:3000 npm run process-queue
 */

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

async function processQueue() {
  try {
    console.log('🔄 Processing next queue item...');

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
        console.log('✅ Queue item processed successfully');
        console.log(`   📹 Video ID: ${data.data.videoId}`);
        console.log(`   📄 Summary ID: ${data.data.summaryId}`);
        console.log(`   📊 Success: ${data.data.success}`);
        if (!data.data.success && data.data.error) {
          console.log(`   ❌ Error: ${data.data.error}`);
        }
      } else {
        console.log('ℹ️  No queue items to process');
        console.log(`   📝 Message: ${data.data.message}`);
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
    }
  } catch (error) {
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.error('❌ Could not connect to the development server. Make sure to run `npm run dev` first.');
      console.error(`   Expected server at: ${APP_URL}`);
    } else {
      console.error('❌ Error calling process endpoint:', error.message);
    }
  }
}

// If run directly, process one item
if (import.meta.url === `file://${process.argv[1]}`) {
  processQueue();
}

export { processQueue };