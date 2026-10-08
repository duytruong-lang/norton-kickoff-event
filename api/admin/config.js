/**
 * 1990 Agency — Norton Park Sales Kick-off Event Backend
 * API Endpoint: /api/admin/config
 * 
 * Protected by ADMIN_SECRET
 * GET: Retrieve real-time event statistics, gate status, and lucky draw pool capacity
 * POST: Execute administrative actions ('gate', 'seed', 'config')
 */

const { redis } = require('../../lib/redis');
const { padZero, normalizePhoneVN, cleanCCCDLast6 } = require('../../lib/helpers');
const { logAdminAction } = require('../../lib/audit');

const DEFAULT_ADMIN_SECRET = 'norton_admin_secret_2026';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-secret, Authorization'
  );
}

function verifyAdminAuth(req, body = {}) {
  const secretKey = process.env.ADMIN_SECRET || DEFAULT_ADMIN_SECRET;

  const authHeader = req.headers['authorization'];
  let bearerToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.substring(7).trim();
  }

  const customHeader = req.headers['x-admin-secret'];
  const querySecret = req.query ? (req.query.secret || req.query.adminSecret) : null;
  const bodySecret = body.secret || body.adminSecret;

  const providedSecret = customHeader || bearerToken || querySecret || bodySecret;

  // In demo or fallback if secret is matched
  return Boolean(providedSecret && providedSecret === secretKey);
}

/**
 * Format phone string to preserve leading zero cleanly
 */
function formatPhone(phone) {
  if (!phone) return '';
  const norm = normalizePhoneVN(phone);
  if (norm.isValid && norm.local) return norm.local;
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 9) return '0' + digits;
  if (digits.startsWith('84') && digits.length === 11) return '0' + digits.slice(2);
  if (digits.startsWith('0')) return digits;
  return digits ? '0' + digits : String(phone).trim();
}

/**
 * Format timestamp into standard Vietnam DateTime string (DD/MM/YYYY HH:mm:ss)
 */
function formatTimestamp(val) {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const pad = (n) => String(n).padStart(2, '0');
      const vnTime = new Date(d.getTime() + 7 * 3600 * 1000);
      const year = vnTime.getUTCFullYear();
      const month = pad(vnTime.getUTCMonth() + 1);
      const day = pad(vnTime.getUTCDate());
      const hours = pad(vnTime.getUTCHours());
      const mins = pad(vnTime.getUTCMinutes());
      const secs = pad(vnTime.getUTCSeconds());
      return `${day}/${month}/${year} ${hours}:${mins}:${secs}`;
    }
  } catch (e) {}
  return String(val);
}

/**
 * Escape CSV field according to RFC 4180
 */
function escapeCsvCell(val) {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/[\r\n]+/g, ' ').trim();
  if (str.includes(',') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Handle CSV Export of all lucky draw tickets directly from Redis
 */
async function handleExportCsv(req, res, clientIp) {
  try {
    const allKeys = new Set();
    try {
      if (typeof redis.scan === 'function') {
        let cursor = '0';
        do {
          const resScan = await redis.scan(cursor, { match: 'reg:cccd6:*', count: 250 });
          cursor = String(resScan[0] ?? '0');
          const batch = resScan[1] || [];
          if (Array.isArray(batch)) {
            batch.forEach(k => allKeys.add(k));
          }
        } while (cursor !== '0');
      } else if (typeof redis.keys === 'function') {
        const matched = await redis.keys('reg:cccd6:*');
        if (Array.isArray(matched)) {
          matched.forEach(k => allKeys.add(k));
        }
      }
    } catch (scanErr) {
      console.warn('[Admin Config:Export CSV Scan Warning]:', scanErr.message);
    }

    if (allKeys.size === 0 && redis.hashes) {
      Object.keys(redis.hashes).forEach(k => {
        if (k.startsWith('reg:cccd6:')) {
          allKeys.add(k);
        }
      });
    }

    const keyList = Array.from(allKeys);
    const entries = [];
    const CHUNK_SIZE = 100;

    for (let i = 0; i < keyList.length; i += CHUNK_SIZE) {
      const chunk = keyList.slice(i, i + CHUNK_SIZE);
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

      for (let j = 0; j < batchData.length; j++) {
        let item = batchData[j];
        if (!item && redis.hashes && redis.hashes[chunk[j]]) {
          item = redis.hashes[chunk[j]];
        }
        if (item && item.ticketNumber) {
          entries.push(item);
        }
      }
    }

    if (entries.length === 0 && redis.hashes) {
      Object.entries(redis.hashes).forEach(([k, item]) => {
        if (k.startsWith('reg:cccd6:') && item && item.ticketNumber) {
          entries.push(item);
        }
      });
    }

    // Sort entries by ticketNumber ascending or issuedAt
    entries.sort((a, b) => {
      const tA = String(a.ticketNumber || '');
      const tB = String(b.ticketNumber || '');
      const cmp = tA.localeCompare(tB, 'en', { numeric: true });
      if (cmp !== 0) return cmp;
      return String(a.issuedAt || '').localeCompare(String(b.issuedAt || ''));
    });

    // Generate CSV with UTF-8 BOM
    const headerRow = 'Thời Gian,Số Vé May Mắn,Họ Và Tên,Số Điện Thoại,CCCD (6 số cuối),Sàn Phân Phối,Email,Trạng Thái,Lead ID,Biên Lai (Receipt ID)';
    const rows = entries.map(entry => {
      const formattedTime = formatTimestamp(entry.issuedAt || entry.checkedInAt || entry.createdAt || entry.timestamp);
      const ticketNumber = entry.ticketNumber || '';
      const fullName = entry.fullName || entry.name || '';
      const phone = formatPhone(entry.phone);
      const cccd = cleanCCCDLast6(entry.cccdLast6 || entry.cccd || '');
      const agency = entry.agency || 'Khách mời tự do';
      const email = entry.email || '';
      const status = (entry.replayed === 'true' || entry.replayed === true) ? 'REPLAYED' : (entry.status || 'HỢP LỆ');
      const leadId = entry.leadId || '';
      const receiptId = entry.receiptId || '';

      return [
        formattedTime,
        ticketNumber,
        fullName,
        phone,
        cccd,
        agency,
        email,
        status,
        leadId,
        receiptId,
      ];
    });

    const BOM = '\uFEFF';
    const csvLines = [headerRow, ...rows.map(r => r.map(escapeCsvCell).join(','))];
    const csvContent = BOM + csvLines.join('\r\n');

    await logAdminAction({
      action: 'export_csv',
      adminUser: 'admin',
      ip: clientIp,
      details: { count: entries.length, exportedAt: new Date().toISOString() },
    }).catch(() => {});

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="The_SYNC_Show_Lucky_Draw_Tickets.csv"');
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[Admin Config:Export CSV Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'EXPORT_FAILED',
      message: 'Lỗi khi xuất danh sách vé: ' + err.message,
    });
  }
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse body safely
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  // Auth enforcement
  if (!verifyAdminAuth(req, body)) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Mã xác thực quản trị (ADMIN_SECRET) không chính xác.',
    });
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1');

  // Check for export-csv action on GET or POST
  const isExportCsv =
    (req.method === 'GET' && (req.query?.action === 'export-csv' || req.query?.action === 'export_csv')) ||
    (req.method === 'POST' && (body.action === 'export-csv' || body.action === 'export_csv'));

  if (isExportCsv) {
    return await handleExportCsv(req, res, clientIp);
  }

  // -------------------------------------------------------------
  // 1. GET: Real-time Stats & Config
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    try {
      const [gate, poolMax, poolMode, poolRemaining, totalCheckin, overflowCount] = await Promise.all([
        redis.get('config:gate'),
        redis.get('config:pool_max'),
        redis.get('config:pool_mode'),
        redis.llen('lucky:pool'),
        redis.get('stats:total'),
        redis.get('stats:overflow_counter'),
      ]);

      const gateStatus = gate || 'closed';
      const maxTickets = parseInt(poolMax, 10) || 1000;
      const remaining = Number(poolRemaining || 0);
      const total = parseInt(totalCheckin, 10) || 0;
      const overflow = parseInt(overflowCount, 10) || 0;
      const mode = poolMode || 'SEQUENTIAL';

      return res.status(200).json({
        success: true,
        gateStatus,
        gate: gateStatus,
        poolMax: maxTickets,
        poolRemaining: remaining,
        totalCheckin: total,
        total,
        overflowCount: overflow,
        mode,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Admin Config:GET Error]:', err.message);
      return res.status(500).json({
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Lỗi truy xuất trạng thái từ Upstash Redis.',
      });
    }
  }

  // -------------------------------------------------------------
  // 2. POST: Administrative Operations
  // -------------------------------------------------------------
  if (req.method === 'POST') {
    const action = String(body.action || '').toLowerCase();

    try {
      // 2.1 Action: Gate Toggle (open / closed)
      if (action === 'gate') {
        const value = String(body.value || body.gate || '').toLowerCase();
        const newGate = value === 'open' ? 'open' : 'closed';
        const previousGate = (await redis.get('config:gate')) || 'closed';

        await redis.set('config:gate', newGate);

        await logAdminAction({
          action: 'gate_toggle',
          adminUser: 'admin',
          ip: clientIp,
          previousState: previousGate,
          newState: newGate,
          details: { requestedBy: 'admin_dashboard', timestamp: new Date().toISOString() },
        });

        const [poolMax, poolMode, poolRemaining, totalCheckin] = await Promise.all([
          redis.get('config:pool_max'),
          redis.get('config:pool_mode'),
          redis.llen('lucky:pool'),
          redis.get('stats:total'),
        ]);

        return res.status(200).json({
          success: true,
          message: `Cổng check-in đã chuyển sang trạng thái: ${newGate.toUpperCase()}`,
          gateStatus: newGate,
          gate: newGate,
          poolMax: parseInt(poolMax, 10) || 1000,
          poolRemaining: Number(poolRemaining || 0),
          totalCheckin: parseInt(totalCheckin, 10) || 0,
          mode: poolMode || 'SEQUENTIAL',
          updatedAt: new Date().toISOString(),
        });
      }

      // 2.2 Action: Seed Lucky Pool
      if (action === 'seed') {
        const poolMax = Math.max(1, parseInt(body.poolMax || body.max, 10) || 1000);
        const mode = (String(body.mode || 'SEQUENTIAL').toUpperCase() === 'SHUFFLE') ? 'SHUFFLE' : 'SEQUENTIAL';

        // Generate pool tickets array [1, 2, ..., poolMax]
        const padSize = Math.max(3, String(poolMax).length);
        const poolItems = [];
        for (let i = 1; i <= poolMax; i++) {
          poolItems.push(`NP-2026-${padZero(i, padSize)}`);
        }

        // Shuffle if in SHUFFLE mode (Fisher-Yates Shuffle)
        if (mode === 'SHUFFLE') {
          for (let i = poolItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [poolItems[i], poolItems[j]] = [poolItems[j], poolItems[i]];
          }
        }

        // Reset and populate lucky:pool using chunks of 250 with pipeline
        await redis.del('lucky:pool');
        const POOL_CHUNK_SIZE = 250;
        if (typeof redis.pipeline === 'function') {
          const pipe = redis.pipeline();
          for (let i = 0; i < poolItems.length; i += POOL_CHUNK_SIZE) {
            const chunk = poolItems.slice(i, i + POOL_CHUNK_SIZE);
            pipe.rpush('lucky:pool', ...chunk);
          }
          await pipe.exec();
        } else {
          for (let i = 0; i < poolItems.length; i += POOL_CHUNK_SIZE) {
            const chunk = poolItems.slice(i, i + POOL_CHUNK_SIZE);
            await redis.rpush('lucky:pool', ...chunk);
          }
        }

        await Promise.all([
          redis.set('config:pool_max', poolMax),
          redis.set('config:pool_mode', mode),
        ]);

        const poolRemaining = await redis.llen('lucky:pool');
        const currentGate = (await redis.get('config:gate')) || 'closed';
        const totalCheckin = (await redis.get('stats:total')) || 0;

        await logAdminAction({
          action: 'seed_pool',
          adminUser: 'admin',
          ip: clientIp,
          details: { poolMax, mode, itemsPushed: poolRemaining },
        });

        return res.status(200).json({
          success: true,
          message: `Đã khởi tạo lại kho vé thành công: ${poolRemaining} vé (${mode})`,
          gateStatus: currentGate,
          gate: currentGate,
          poolMax,
          poolRemaining: Number(poolRemaining),
          totalCheckin: parseInt(totalCheckin, 10) || 0,
          mode,
          updatedAt: new Date().toISOString(),
        });
      }

      // 2.3 Action: General Config Update
      if (action === 'config') {
        if (body.poolMax) {
          await redis.set('config:pool_max', parseInt(body.poolMax, 10));
        }
        if (body.mode) {
          await redis.set('config:pool_mode', body.mode);
        }

        await logAdminAction({
          action: 'config_update',
          adminUser: 'admin',
          ip: clientIp,
          details: body,
        });

        return res.status(200).json({
          success: true,
          message: 'Cập nhật cấu hình thành công.',
          updatedAt: new Date().toISOString(),
        });
      }

      // 2.4 Action: Nuclear Reset
      // 2.4 Action: Nuclear Reset (Clean All Data & Re-seed Pool)
      if (action === 'reset') {
        if (body.confirm !== 'XÓA HẾT') {
          return res.status(400).json({
            success: false,
            error: 'CONFIRMATION_REQUIRED',
            message: 'Thiếu xác nhận hoặc xác nhận không đúng. Yêu cầu: confirm = "XÓA HẾT"',
          });
        }

        // Clean all registration, receipt, and audit keys
        const scanPatterns = ['reg:*', 'idx:*', 'receipt:*', 'rcpt:*', 'audit:*', 'stats:*', 'lock:*'];
        const allKeysToDelete = new Set();

        for (const pat of scanPatterns) {
          try {
            if (typeof redis.keys === 'function') {
              const matched = await redis.keys(pat);
              if (Array.isArray(matched)) {
                matched.forEach(k => allKeysToDelete.add(k));
              }
            } else if (typeof redis.scan === 'function') {
              let cursor = '0';
              do {
                const [nextCursor, batch] = await redis.scan(cursor, { match: pat, count: 200 });
                cursor = String(nextCursor ?? '0');
                if (batch && batch.length > 0) {
                  batch.forEach(k => allKeysToDelete.add(k));
                }
              } while (cursor !== '0');
            }
          } catch (scanErr) {
            console.warn(`[Reset Scan Warning for ${pat}]:`, scanErr.message);
          }
        }

        const keysToDelete = Array.from(allKeysToDelete);
        const CHUNK_SIZE = 100;
        for (let i = 0; i < keysToDelete.length; i += CHUNK_SIZE) {
          const chunk = keysToDelete.slice(i, i + CHUNK_SIZE);
          const p = redis.pipeline();
          chunk.forEach(k => p.del(k));
          await p.exec();
        }

        // Reset counters and gate
        await redis.del('lucky:pool');
        await redis.set('stats:total', 0);
        await redis.set('stats:overflow_counter', 0);
        await redis.set('config:gate', 'closed');

        const poolMaxRaw = body.poolMax || await redis.get('config:pool_max') || 1000;
        const poolMax = Math.max(1, parseInt(poolMaxRaw, 10));
        const modeRaw = body.mode || await redis.get('config:pool_mode') || 'SEQUENTIAL';
        const mode = (String(modeRaw).toUpperCase() === 'SHUFFLE') ? 'SHUFFLE' : 'SEQUENTIAL';

        const padSize = Math.max(3, String(poolMax).length);
        const poolItems = [];
        for (let i = 1; i <= poolMax; i++) {
          poolItems.push(`NP-2026-${padZero(i, padSize)}`);
        }

        if (mode === 'SHUFFLE') {
          for (let i = poolItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [poolItems[i], poolItems[j]] = [poolItems[j], poolItems[i]];
          }
        }

        const POOL_CHUNK_SIZE = 250;
        if (typeof redis.pipeline === 'function') {
          const pipe = redis.pipeline();
          for (let i = 0; i < poolItems.length; i += POOL_CHUNK_SIZE) {
            const chunk = poolItems.slice(i, i + POOL_CHUNK_SIZE);
            pipe.rpush('lucky:pool', ...chunk);
          }
          await pipe.exec();
        } else {
          for (let i = 0; i < poolItems.length; i += POOL_CHUNK_SIZE) {
            const chunk = poolItems.slice(i, i + POOL_CHUNK_SIZE);
            await redis.rpush('lucky:pool', ...chunk);
          }
        }

        await Promise.all([
          redis.set('config:pool_max', poolMax),
          redis.set('config:pool_mode', mode),
        ]);

        await logAdminAction({
          action: 'nuclear_reset',
          adminUser: 'admin',
          ip: clientIp,
          details: { poolMax, mode, keysDeleted: keysToDelete.length },
        });

        return res.status(200).json({
          success: true,
          message: `Đã dọn dẹp sạch toàn bộ database (xóa ${keysToDelete.length} keys), khởi tạo lại kho ${poolMax} vé và đặt số đếm về 0.`,
          gateStatus: 'closed',
          gate: 'closed',
          poolMax,
          poolRemaining: poolMax,
          totalCheckin: 0,
          total: 0,
          overflowCount: 0,
          mode,
          updatedAt: new Date().toISOString(),
        });
      }

      // 2.5 Action: Reset Counter Only (stats:total & overflow)
      if (action === 'reset_counter') {
        await Promise.all([
          redis.set('stats:total', 0),
          redis.set('stats:overflow_counter', 0),
        ]);

        const poolRemaining = await redis.llen('lucky:pool');
        const currentGate = (await redis.get('config:gate')) || 'closed';
        const poolMax = (await redis.get('config:pool_max')) || 1000;

        await logAdminAction({
          action: 'reset_counter',
          adminUser: 'admin',
          ip: clientIp,
          details: { resetAt: new Date().toISOString() },
        });

        return res.status(200).json({
          success: true,
          message: 'Đã đặt lại số đếm check-in về 0 thành công.',
          gateStatus: currentGate,
          gate: currentGate,
          poolMax: parseInt(poolMax, 10),
          poolRemaining: Number(poolRemaining),
          totalCheckin: 0,
          total: 0,
          overflowCount: 0,
          updatedAt: new Date().toISOString(),
        });
      }

      return res.status(400).json({
        success: false,
        error: 'INVALID_ACTION',
        message: `Action '${action}' không được hỗ trợ. Sử dụng 'gate', 'seed', 'config', 'reset', hoặc 'export-csv'.`,
      });
    } catch (err) {
      console.error('[Admin Config:POST Error]:', err.message);
      return res.status(500).json({
        success: false,
        error: 'ACTION_FAILED',
        message: err.message,
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'METHOD_NOT_ALLOWED',
  });
};
