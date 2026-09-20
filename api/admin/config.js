/**
 * 1990 Agency — Norton Park Sales Kick-off Event Backend
 * API Endpoint: /api/admin/config
 * 
 * Protected by ADMIN_SECRET
 * GET: Retrieve real-time event statistics, gate status, and lucky draw pool capacity
 * POST: Execute administrative actions ('gate', 'seed', 'config')
 */

const { redis } = require('../../lib/redis');
const { padZero } = require('../../lib/helpers');
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
      const mode = poolMode || 'SHUFFLE';

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
          mode: poolMode || 'SHUFFLE',
          updatedAt: new Date().toISOString(),
        });
      }

      // 2.2 Action: Seed Lucky Pool
      if (action === 'seed') {
        const poolMax = Math.max(1, parseInt(body.poolMax || body.max, 10) || 1000);
        const mode = (String(body.mode || 'SHUFFLE').toUpperCase() === 'SEQUENTIAL') ? 'SEQUENTIAL' : 'SHUFFLE';

        // Generate pool tickets array [1, 2, ..., poolMax]
        const poolItems = [];
        for (let i = 1; i <= poolMax; i++) {
          poolItems.push(`NP-2026-${padZero(i, 3)}`);
        }

        // Shuffle if in SHUFFLE mode (Fisher-Yates Shuffle)
        if (mode === 'SHUFFLE') {
          for (let i = poolItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [poolItems[i], poolItems[j]] = [poolItems[j], poolItems[i]];
          }
        }

        // Reset and populate lucky:pool using chunks of 100
        await redis.del('lucky:pool');
        const CHUNK_SIZE = 100;
        for (let i = 0; i < poolItems.length; i += CHUNK_SIZE) {
          const chunk = poolItems.slice(i, i + CHUNK_SIZE);
          await redis.rpush('lucky:pool', ...chunk);
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
      if (action === 'reset') {
        if (body.confirm !== 'XÓA HẾT') {
          return res.status(400).json({
            success: false,
            error: 'CONFIRMATION_REQUIRED',
            message: 'Thiếu xác nhận hoặc xác nhận không đúng. Yêu cầu: confirm = "XÓA HẾT"',
          });
        }

        const cccdKeys = (await redis.keys('reg:cccd:*')) || [];
        const phoneKeys = (await redis.keys('reg:phone:*')) || [];
        const receiptKeys = (await redis.keys('receipt:*')) || [];
        const keysToDelete = [...cccdKeys, ...phoneKeys, ...receiptKeys];

        const CHUNK_SIZE = 100;
        for (let i = 0; i < keysToDelete.length; i += CHUNK_SIZE) {
          const chunk = keysToDelete.slice(i, i + CHUNK_SIZE);
          const p = redis.pipeline();
          chunk.forEach(k => p.del(k));
          await p.exec();
        }

        await redis.del('lucky:pool');
        await redis.set('stats:total', 0);
        await redis.set('stats:overflow_counter', 0);
        await redis.del('audit:log');
        await redis.del('audit:admin');
        await redis.set('config:gate', 'closed');

        const poolMaxRaw = body.poolMax || await redis.get('config:pool_max') || 1000;
        const poolMax = Math.max(1, parseInt(poolMaxRaw, 10));
        const modeRaw = body.mode || await redis.get('config:pool_mode') || 'SHUFFLE';
        const mode = (String(modeRaw).toUpperCase() === 'SEQUENTIAL') ? 'SEQUENTIAL' : 'SHUFFLE';

        const poolItems = [];
        for (let i = 1; i <= poolMax; i++) {
          poolItems.push(`NP-2026-${padZero(i, 3)}`);
        }

        if (mode === 'SHUFFLE') {
          for (let i = poolItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [poolItems[i], poolItems[j]] = [poolItems[j], poolItems[i]];
          }
        }

        for (let i = 0; i < poolItems.length; i += CHUNK_SIZE) {
          const chunk = poolItems.slice(i, i + CHUNK_SIZE);
          await redis.rpush('lucky:pool', ...chunk);
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
          message: `Đã xóa toàn bộ dữ liệu và reset hệ thống (xóa ${keysToDelete.length} keys), khởi tạo lại ${poolMax} vé.`,
          gateStatus: 'closed',
          gate: 'closed',
          poolMax,
          poolRemaining: poolMax,
          totalCheckin: 0,
          overflowCount: 0,
          mode,
          updatedAt: new Date().toISOString(),
        });
      }

      return res.status(400).json({
        success: false,
        error: 'INVALID_ACTION',
        message: `Action '${action}' không được hỗ trợ. Sử dụng 'gate', 'seed', 'config', hoặc 'reset'.`,
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
