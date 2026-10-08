/**
 * 1990 Agency — Norton Park Sales Kick-off Event Backend
 * Script: reconcile-sheets.js
 * 
 * Backfill existing Redis registrations → Google Sheets ERP.
 * Use when: Sheets webhook was added after registrations already existed.
 * 
 * Usage: node scripts/reconcile-sheets.js
 * Requires: .env.local with UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, GOOGLE_SHEETS_WEBHOOK_URL
 */

require('dotenv').config({ path: '.env.local' });

const { Redis } = require('@upstash/redis');
const { appendLeadToSheet } = require('../lib/sheets');

const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : require('../lib/redis').redis;

async function reconcile() {
  const startTime = Date.now();
  console.log('🔍 Scanning Redis for all registrations (reg:cccd6:*)...\n');

  // 1. Scan all registration keys
  const keys = [];
  let cursor = '0';
  try {
    if (typeof redis.scan === 'function') {
      do {
        const [nextCursor, batch] = await redis.scan(cursor, { match: 'reg:cccd6:*', count: 200 });
        cursor = String(nextCursor ?? '0');
        if (Array.isArray(batch)) {
          keys.push(...batch);
        }
      } while (cursor !== '0');
    } else if (typeof redis.keys === 'function') {
      const batch = await redis.keys('reg:cccd6:*');
      if (Array.isArray(batch)) keys.push(...batch);
    } else if (redis.hashes) {
      Object.keys(redis.hashes).forEach(k => {
        if (k.startsWith('reg:cccd6:')) keys.push(k);
      });
    }
  } catch (err) {
    console.error('❌ Error scanning keys:', err.message);
  }

  console.log(`📊 Found ${keys.length} registration keys in Redis.\n`);

  if (keys.length === 0) {
    console.log('✅ Nothing to reconcile.');
    return;
  }

  // 2. Batch fetch registration data in chunks
  console.log('📥 Loading registration records...');
  const records = [];
  let skippedNonHash = 0;
  const FETCH_CHUNK = 100;

  for (let i = 0; i < keys.length; i += FETCH_CHUNK) {
    const chunk = keys.slice(i, i + FETCH_CHUNK);
    let batchData = [];
    if (typeof redis.pipeline === 'function') {
      try {
        const p = redis.pipeline();
        chunk.forEach(k => p.hgetall(k));
        batchData = await p.exec();
      } catch (e) {
        batchData = await Promise.all(chunk.map(k => redis.hgetall(k).catch(() => null)));
      }
    } else {
      batchData = await Promise.all(chunk.map(k => redis.hgetall(k).catch(() => null)));
    }

    for (let j = 0; j < chunk.length; j++) {
      const data = batchData[j];
      if (data && data.ticketNumber) {
        records.push({ key: chunk[j], data });
      } else {
        skippedNonHash++;
      }
    }
  }

  console.log(`📋 Verified ${records.length} valid tickets (${skippedNonHash} non-ticket/invalid keys skipped).\n`);

  if (records.length === 0) {
    console.log('✅ No valid ticket records found to reconcile.');
    return;
  }

  // 3. Process Sheet sync in concurrent batches with clean progress logging
  const BATCH_SIZE = 5;
  const total = records.length;
  let success = 0;
  let skipped = 0;
  let failed = 0;

  console.log(`🚀 Starting sync of ${total} records to Google Sheets ERP (Batch size: ${BATCH_SIZE})...\n`);

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async ({ key, data }) => {
        const cccd6 = key.replace('reg:cccd6:', '');
        const phone = data.phone || cccd6;

        try {
          const result = await appendLeadToSheet({
            leadId: data.leadId || `backfill_${phone}`,
            receiptId: data.receiptId || `rcpt_backfill_${Date.now()}`,
            ticketNumber: data.ticketNumber,
            fullName: data.fullName || '',
            phone: data.phone || phone,
            cccdLast6: data.cccdLast6 || '',
            agency: data.agency || '',
            email: data.email || '',
            role: data.role || '',
            replayed: false,
            clientIp: data.clientIp || 'backfill',
            city: data.city || '',
            country: data.country || 'VN',
            userAgent: 'reconcile-script/1.0',
            utmSource: data.utmSource || '',
            responseTimeMs: 0,
          });

          if (result && result.success) {
            success++;
          } else if (result && result.skipped) {
            skipped++;
          } else {
            failed++;
          }
        } catch (err) {
          failed++;
        }
      })
    );

    const processed = Math.min(i + BATCH_SIZE, total);
    const pct = ((processed / total) * 100).toFixed(1);
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

    // Log progress cleanly every 25 items or at the end
    if (processed % 25 === 0 || processed === total) {
      console.log(`[Reconcile] ${processed}/${total} (${pct}%) — ✅ Synced: ${success} | ⏭️ Skipped: ${skipped} | ❌ Failed: ${failed} | ⏱️ ${elapsedSec}s`);
    }
  }

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n📋 Reconciliation Complete in ${totalTimeSec}s:`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ⏭️  Skipped: ${skipped + skippedNonHash}`);
  console.log(`   ❌ Failed:  ${failed}`);
  console.log(`   📊 Total:   ${keys.length}`);
}

reconcile().catch(console.error);
