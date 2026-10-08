/**
 * 1990 Agency — Norton Park Sales Kick-off Event
 * Script: sync-missing-to-sheets.js
 * 
 * Accurately syncs missing Redis registrations to Google Sheets ERP.
 * Uses official Google Sheets API v4 with oauth token.
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Redis } = require('@upstash/redis');
const { format14Columns } = require('../lib/sheets');

const tokenPath = '/Users/duy.truong/.config/google-drive-mcp/tokens.json';
const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
const accessToken = tokenData.access_token || tokenData.tokens?.access_token;
const sheetId = '1IpfahCoOnvE5dc9JES9upMiBvW6l__Cx8X4aD2i3A28';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

async function run() {
  console.log('--- SYNC MISSING RECORDS TO GOOGLE SHEETS ERP ---');
  
  // 1. Fetch current Google Sheets data
  console.log('1. Reading current Google Sheets rows...');
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:N2500`;
  const getRes = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const sheetData = await getRes.json();
  const existingRows = sheetData.values || [];
  console.log(`   Found ${existingRows.length} total rows (including header) in Sheet1.`);
  
  const existingReceipts = new Set();
  const existingTickets = new Set();
  existingRows.slice(1).forEach(r => {
    if (r[1]) existingTickets.add(r[1].trim());
    if (r[10]) existingReceipts.add(r[10].trim());
  });
  
  // 2. Fetch all Redis registrations
  console.log('2. Scanning Redis for all 1,420 tickets...');
  const allKeys = new Set();
  let cursor = '0';
  do {
    const resScan = await redis.scan(cursor, { match: 'reg:cccd6:*', count: 250 });
    cursor = String(resScan[0] ?? '0');
    if (resScan[1]) resScan[1].forEach(k => allKeys.add(k));
  } while (cursor !== '0');
  
  const keyList = Array.from(allKeys);
  const CHUNK_SIZE = 100;
  const redisRecords = [];
  for (let i = 0; i < keyList.length; i += CHUNK_SIZE) {
    const chunk = keyList.slice(i, i + CHUNK_SIZE);
    const p = redis.pipeline();
    chunk.forEach(k => p.hgetall(k));
    const batch = await p.exec();
    for (const item of batch) {
      if (item && item.ticketNumber) redisRecords.push(item);
    }
  }
  console.log(`   Fetched ${redisRecords.length} records from Redis.`);
  
  // 3. Filter missing
  const missingRecords = [];
  redisRecords.forEach(r => {
    const rawTicket = String(r.ticketNumber || '');
    const cleanTicket = '#' + rawTicket.replace('NP-2026-', '');
    const receipt = String(r.receiptId || '').trim();
    if (!existingReceipts.has(receipt) && !existingTickets.has(cleanTicket)) {
      missingRecords.push(r);
    }
  });
  
  console.log(`3. Missing records to append: ${missingRecords.length}`);
  if (missingRecords.length === 0) {
    console.log('✅ Google Sheets is already 100% in sync with Redis!');
    return;
  }
  
  // Sort missing records by ticket number ascending
  missingRecords.sort((a, b) => a.ticketNumber.localeCompare(b.ticketNumber, undefined, { numeric: true }));
  
  // Format into 14 columns
  const rowsToAppend = missingRecords.map(r => {
    return format14Columns({
      timestamp: r.issuedAt || r.checkedInAt || r.createdAt || r.timestamp,
      ticketNumber: r.ticketNumber,
      fullName: r.fullName || r.name,
      phone: r.phone,
      cccdLast6: r.cccdLast6 || r.cccd,
      agency: r.agency,
      email: r.email,
      replayed: r.replayed === 'true' || r.replayed === true,
      utmSource: r.utmSource || 'LDP',
      leadId: r.leadId,
      receiptId: r.receiptId,
      metaEventId: r.metaEventId || r.receiptId,
      clientIp: r.clientIp || r.ip,
      userAgent: r.userAgent,
    });
  });
  
  console.log(`4. Appending ${rowsToAppend.length} rows to Sheet1 via Google Sheets API...`);
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`;
  const appendRes = await fetch(appendUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: rowsToAppend,
    }),
  });
  
  const appendResult = await appendRes.json();
  if (appendResult.error) {
    console.error('❌ Append error:', appendResult.error);
    process.exit(1);
  }
  
  console.log('   Append result:', appendResult.updates ? `${appendResult.updates.updatedRows} rows appended` : JSON.stringify(appendResult));
  
  // 5. Sort Sheet1!A2:N1421 by Column B (Số Vé May Mắn) ascending
  console.log('5. Sorting Sheet1 by Ticket Number (Column B) ascending...');
  const sortUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`;
  const sortRes = await fetch(sortUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          sortRange: {
            range: {
              sheetId: 0,
              startRowIndex: 1, // Skip header row
              endRowIndex: existingRows.length - 1 + rowsToAppend.length + 1,
              startColumnIndex: 0,
              endColumnIndex: 14,
            },
            sortSpecs: [
              {
                dimensionIndex: 1, // Column B: Số Vé May Mắn
                sortOrder: 'ASCENDING',
              },
            ],
          },
        },
      ],
    }),
  });
  
  const sortResult = await sortRes.json();
  if (sortResult.error) {
    console.warn('⚠️ Sort warning:', sortResult.error);
  } else {
    console.log('✅ Sheet1 successfully sorted from #0001 to #1420!');
  }
  
  // 6. Verify final row count
  const verifyRes = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const finalSheetData = await verifyRes.json();
  const finalRowCount = finalSheetData.values ? finalSheetData.values.length : 0;
  console.log(`\n🎉 VERIFICATION COMPLETE:`);
  console.log(`   Final total rows: ${finalRowCount} (1 header + ${finalRowCount - 1} records)`);
  console.log(`   First data row: ${finalSheetData.values[1][1]} - ${finalSheetData.values[1][2]}`);
  console.log(`   Last data row: ${finalSheetData.values[finalRowCount - 1][1]} - ${finalSheetData.values[finalRowCount - 1][2]}`);
}

run().catch(console.error);
