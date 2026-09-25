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

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function reconcile() {
  console.log('🔍 Scanning Redis for all registrations (reg:phone:*)...\n');

  // Scan all phone registration keys
  const keys = [];
  let cursor = 0;
  do {
    const [nextCursor, batch] = await redis.scan(cursor, { match: 'reg:phone:*', count: 100 });
    cursor = Number(nextCursor);
    keys.push(...batch);
  } while (cursor !== 0);

  console.log(`📊 Found ${keys.length} registrations in Redis.\n`);

  if (keys.length === 0) {
    console.log('✅ Nothing to reconcile.');
    return;
  }

  let success = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    
    let data;
    try {
      data = await redis.hgetall(key);
    } catch (e) {
      // Key is not a hash type (string, set, etc.) — skip
      skipped++;
      continue;
    }
    
    if (!data || !data.ticketNumber) {
      skipped++;
      continue;
    }

    const phone = key.replace('reg:phone:', '');

    try {
      const result = await appendLeadToSheet({
        leadId: data.leadId || `backfill_${phone}`,
        receiptId: data.receiptId || `rcpt_backfill_${Date.now()}`,
        ticketNumber: data.ticketNumber,
        fullName: data.fullName || '',
        phone: data.phone || phone,
        cccdLast4: data.cccdLast4 || '',
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

      if (result.success) {
        success++;
        process.stdout.write(`\r✅ ${success}/${keys.length} synced`);
      } else if (result.skipped) {
        skipped++;
      } else {
        failed++;
        console.log(`\n❌ Failed: ${phone} - ${result.error || result.status}`);
      }
    } catch (err) {
      failed++;
      console.log(`\n❌ Error: ${phone} - ${err.message}`);
    }

    // Rate limit: 50ms between requests to not overwhelm Apps Script
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n\n📋 Reconciliation Complete:`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed:  ${failed}`);
  console.log(`   📊 Total:   ${keys.length}`);
}

reconcile().catch(console.error);
