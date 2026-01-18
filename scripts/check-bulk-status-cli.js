#!/usr/bin/env node

/**
 * Alternative script using Supabase CLI to check and reset bulk generation status
 * Run this if you have Supabase CLI installed
 */

// Load environment variables from .env file
try {
  const dotenv = await import('dotenv');
  dotenv.config();
  console.log('✅ Loaded environment variables from .env file');
} catch (e) {
  console.warn('⚠️  dotenv not available, trying to load .env manually...');

  // Fallback: try to read .env file manually
  try {
    const fs = await import('fs');
    const path = await import('path');

    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');

      for (const line of envLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
            process.env[key] = value;
          }
        }
      }
      console.log('✅ Loaded environment variables from .env file (manual)');
    } else {
      console.warn('⚠️  .env file not found');
    }
  } catch (fsError) {
    console.warn('⚠️  Could not read .env file manually');
  }
}

const { execSync } = require('child_process');

function runSupabaseSQL(sql) {
  try {
    console.log('🔄 Executing SQL via Supabase CLI...');
    const result = execSync(`supabase db reset --db-url "$(supabase db url)" --sql "${sql.replace(/"/g, '\\"')}"`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return result;
  } catch (error) {
    // Try alternative approach
    try {
      const result = execSync(`echo "${sql}" | supabase db sql`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return result;
    } catch (e) {
      throw new Error('Supabase CLI not available or not configured');
    }
  }
}

function checkStatus() {
  const sql = `
    SELECT id, status, started_at, completed_at, error_message,
           total_channels, processed_channels, successful_summaries, failed_summaries
    FROM bulk_generation_status
    ORDER BY created_at DESC
    LIMIT 5;
  `;

  try {
    const result = runSupabaseSQL(sql);
    console.log('📊 Bulk generation status:');
    console.log(result);
  } catch (error) {
    console.error('❌ Failed to check status via CLI:', error.message);
    console.log('💡 Make sure Supabase CLI is installed and configured:');
    console.log('   npm install -g supabase');
    console.log('   supabase login');
    console.log('   supabase link --project-ref your-project-ref');
  }
}

function resetStuck() {
  const sql = `
    -- Reset bulk generations stuck in "in_progress" for more than 1 hour
    UPDATE bulk_generation_status
    SET
      status = 'failed',
      error_message = 'Manually reset via CLI - stuck in in_progress',
      completed_at = NOW()
    WHERE
      status = 'in_progress'
      AND started_at < NOW() - INTERVAL '1 hour';

    -- Show what was reset
    SELECT 'Reset completed' as message, COUNT(*) as reset_count
    FROM bulk_generation_status
    WHERE status = 'failed'
      AND error_message LIKE '%stuck in in_progress%'
      AND completed_at >= NOW() - INTERVAL '1 minute';
  `;

  try {
    const result = runSupabaseSQL(sql);
    console.log('✅ Reset completed via Supabase CLI:');
    console.log(result);
  } catch (error) {
    console.error('❌ Failed to reset via CLI:', error.message);
    console.log('💡 Alternative: Run SQL manually in Supabase Dashboard');
    console.log('   See: scripts/reset-bulk-status.sql');
  }
}

// Main logic
const command = process.argv[2];

if (command === 'reset') {
  resetStuck();
} else if (command === 'status' || command === 'check') {
  checkStatus();
} else {
  console.log('🚀 Bulk Generation Status Management (Supabase CLI)\n');
  console.log('Usage:');
  console.log('  node scripts/check-bulk-status-cli.js status  # Check status');
  console.log('  node scripts/check-bulk-status-cli.js reset   # Reset stuck generations');
  console.log('');
  console.log('Requirements:');
  console.log('  - Supabase CLI installed: npm install -g supabase');
  console.log('  - Logged in: supabase login');
  console.log('  - Project linked: supabase link --project-ref <ref>');
}