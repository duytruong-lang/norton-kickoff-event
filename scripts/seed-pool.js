#!/usr/bin/env node

/**
 * 1990 Agency — Norton Park Sales Kick-off Event
 * CLI Script: Seed Lucky Draw Ticket Pool to Upstash Redis
 * 
 * Usage:
 *   node scripts/seed-pool.js
 *   node scripts/seed-pool.js --max=1000 --mode=SHUFFLE
 *   node scripts/seed-pool.js --max=500 --mode=SEQUENTIAL
 * 
 * Specifications:
 *   - Default: --max=1000 --mode=SHUFFLE
 *   - Atomic RPUSH in chunks of 100 to prevent packet overflow
 *   - Enforce config:pool_max = 1000
 *   - Enforce config:gate = 'closed' (Theo đúng chỉ đạo của Sếp Di)
 */

try {
  require('dotenv').config();
} catch (e) {}

const { redis, isUsingFallback } = require('../lib/redis');
const { padZero } = require('../lib/helpers');

// Parse CLI flags
function parseArgs() {
  const args = process.argv.slice(2);
  let max = 1000;
  let mode = 'SHUFFLE';

  for (const arg of args) {
    if (arg.startsWith('--max=')) {
      const val = parseInt(arg.split('=')[1], 10);
      if (!isNaN(val) && val > 0) max = val;
    } else if (arg.startsWith('--mode=')) {
      const val = arg.split('=')[1].toUpperCase();
      if (val === 'SEQUENTIAL' || val === 'SHUFFLE') mode = val;
    }
  }

  return { max, mode };
}

/**
 * Fisher-Yates unbiased shuffle algorithm
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function seedPool() {
  const { max, mode } = parseArgs();

  console.log('\n============================================================');
  console.log('🌲 1990 AGENCY — NORTON PARK SALES KICK-OFF SEED CLI');
  console.log('============================================================');
  console.log(`🎯 Mục tiêu: Seed kho vé may mắn (Lucky Draw Pool)`);
  console.log(`📦 Tổng số lượng vé (--max): ${max}`);
  console.log(`🎲 Chế độ cấp số (--mode):   ${mode}`);
  console.log(`🚪 Trạng thái cổng (config:gate): CLOSED (Chỉ đạo Sếp Di)`);
  if (isUsingFallback) {
    console.log(`⚠️  Lưu ý: Đang chạy với Redis fallback credentials.`);
  }
  console.log('------------------------------------------------------------\n');

  try {
    // 1. Generate formatted ticket array [NP-2026-001 ... NP-2026-1000]
    console.log(`[1/4] 🔨 Đang tạo ${max} mã vé định dạng chuẩn NP-2026-xxx...`);
    let tickets = [];
    for (let i = 1; i <= max; i++) {
      tickets.push(`NP-2026-${padZero(i, 3)}`);
    }

    // 2. Shuffle if requested
    if (mode === 'SHUFFLE') {
      console.log(`[2/4] 🔀 Đang xáo trộn ngẫu nhiên (Fisher-Yates Shuffle)...`);
      tickets = shuffleArray(tickets);
    } else {
      console.log(`[2/4] ➡️  Giữ nguyên thứ tự tịnh tiến (Sequential)...`);
    }

    // 3. Clear existing lucky:pool and push in chunks of 100
    console.log(`[3/4] 🗑️  Xóa kho số cũ trên Redis key 'lucky:pool'...`);
    await redis.del('lucky:pool');

    const CHUNK_SIZE = 100;
    const totalChunks = Math.ceil(tickets.length / CHUNK_SIZE);
    console.log(`[3/4] 🚀 Đang nạp vé vào Redis theo từng chunk 100 phần tử (${totalChunks} chunks)...`);

    for (let i = 0; i < tickets.length; i += CHUNK_SIZE) {
      const chunk = tickets.slice(i, i + CHUNK_SIZE);
      const chunkIndex = Math.floor(i / CHUNK_SIZE) + 1;
      await redis.rpush('lucky:pool', ...chunk);
      process.stdout.write(`   ✓ Đã nạp Chunk ${chunkIndex}/${totalChunks} (${chunk[0]} -> ${chunk[chunk.length - 1]})\n`);
    }

    // 4. Set configuration keys
    console.log('\n[4/4] 🔒 Thiết lập cấu hình hệ thống:');
    await redis.set('config:pool_max', max);
    console.log(`   ✓ config:pool_max = ${max}`);

    await redis.set('config:pool_mode', mode);
    console.log(`   ✓ config:pool_mode = '${mode}'`);

    // Theo đúng chỉ đạo của Sếp Di: Mặc định cổng đóng (closed)
    await redis.set('config:gate', 'closed');
    console.log(`   ✓ config:gate = 'closed' (BẢO VỆ CỔNG CHECK-IN)`);

    // Verify final length in Redis
    const verifiedLength = await redis.llen('lucky:pool');
    console.log('\n============================================================');
    console.log(`🎉 HOÀN THÀNH SEED POOL THÀNH CÔNG!`);
    console.log(`📊 Số lượng vé thực tế trong 'lucky:pool': ${verifiedLength}`);
    console.log(`🛡️ Trạng thái cổng hiện tại: ĐÃ KHÓA (CLOSED)`);
    console.log('============================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ [Seed Pool Error]:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedPool();
}

module.exports = { seedPool, parseArgs, shuffleArray };
