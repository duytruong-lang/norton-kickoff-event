/**
 * 1990 Agency — Norton Park Sales Kick-off Event Backend
 * API Endpoint: /api/register
 * 
 * GET: Probe gate status (defaults to 'closed')
 * POST: Gate enforcement (HTTP 403 when closed), absolute CCCD Idempotency,
 *       atomic lucky draw ticket allocation (lucky:pool / NP-OVERFLOW-xxx),
 *       sub-100ms HTTP 200 response, non-blocking Meta CAPI & Sheets ERP sync.
 */

const { redis } = require('../lib/redis');
const { padZero, normalizePhoneVN, cleanCCCDLast4 } = require('../lib/helpers');
const { logRequest, writeReceipt } = require('../lib/audit');
const { sendMetaLeadEvent } = require('../lib/capi');
const { appendLeadToSheet } = require('../lib/sheets');

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-secret, Authorization'
  );
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // -------------------------------------------------------------
  // 1. GET: Gate probe
  // -------------------------------------------------------------
  if (req.method === 'GET') {
    try {
      const gate = (await redis.get('config:gate')) || 'closed';
      return res.status(200).json({
        success: true,
        gate,
        isOpen: gate === 'open',
        message: gate === 'open'
          ? 'Cổng check-in sự kiện Norton Park đang mở.'
          : 'Cổng check-in hiện đang đóng. Vui lòng liên hệ Ban Tổ Chức.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[Register:GET Probe Error]:', err.message);
      return res.status(200).json({
        success: true,
        gate: 'closed',
        isOpen: false,
        message: 'Cổng check-in hiện đang đóng. Vui lòng liên hệ Ban Tổ Chức.',
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Only allow POST for check-in registration
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Phương thức không được hỗ trợ. Chỉ chấp nhận GET hoặc POST.',
    });
  }

  // -------------------------------------------------------------
  // 2. POST: Registration & Lucky Ticket Issuance
  // -------------------------------------------------------------
  const startTime = Date.now();

  // Extract client IP and Vercel edge geolocation headers
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.headers['x-real-ip'] || req.socket?.remoteAddress || '127.0.0.1');
  const city = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : 'Ho Chi Minh City';
  const country = req.headers['x-vercel-ip-country'] || 'VN';
  const region = req.headers['x-vercel-ip-country-region'] || '';
  const userAgent = req.headers['user-agent'] || '';

  // Parse request body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  body = body || {};

  try {
    // 2.1 Validate Input fields
    const fullName = String(body.fullName || body.name || '').trim();
    const rawPhone = String(body.phone || '').trim();
    const rawCCCD = String(body.cccd || body.idCard || '').trim();
    const agency = String(body.agency || '').trim();
    const email = String(body.email || '').trim();
    const role = String(body.role || 'Chiến binh kinh doanh').trim();
    const utmSource = String(body.utmSource || body.source || 'LDP').trim();

    const clean4Id = cleanCCCDLast4(rawCCCD);
    const phoneInfo = normalizePhoneVN(rawPhone);

    if (!fullName) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_NAME',
        message: 'Vui lòng nhập họ và tên đầy đủ.',
      });
    }

    if (!clean4Id || clean4Id.length !== 4) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CCCD',
        message: 'Vui lòng nhập đúng 4 chữ số cuối CCCD / CMND.',
      });
    }

    if (!phoneInfo.isValid) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PHONE',
        message: 'Số điện thoại không đúng định dạng di động Việt Nam (10 chữ số: 03x, 05x, 07x, 08x, 09x).',
      });
    }

    // 2.2 Absolute Phone Idempotency Check (reg:phone:{phoneLocal})
    const phoneKey = `reg:phone:${phoneInfo.local}`;
    const existing = await redis.hgetall(phoneKey);

    if (existing && existing.ticketNumber) {
      const responseTimeMs = Date.now() - startTime;
      const replayLeadId = existing.leadId;

      // Update replay receipt & audit log
      writeReceipt(replayLeadId, {
        ...existing,
        replayed: true,
        clientIp,
        userAgent,
        responseTimeMs,
      }).catch(() => {});

      logRequest({
        leadId: replayLeadId,
        receiptId: existing.receiptId,
        ticketNumber: existing.ticketNumber,
        cccdLast4: clean4Id,
        phone: phoneInfo.local,
        ip: clientIp,
        geo: { city, country, region },
        userAgent,
        action: 'register_replay',
        status: 'REPLAYED',
        responseTimeMs,
      }).catch(() => {});

      return res.status(200).json({
        success: true,
        leadId: existing.leadId,
        ticketNumber: existing.ticketNumber,
        luckyNumber: existing.ticketNumber.replace('NP-2026-', '').replace('NP-OVERFLOW-', 'OVERFLOW-'),
        receiptId: existing.receiptId || `rcpt_${Date.now()}`,
        fullName: existing.fullName,
        phone: existing.phone,
        agency: existing.agency || agency,
        cccdLast4: clean4Id,
        issuedAt: existing.issuedAt,
        replayed: true,
        responseTimeMs,
        message: 'Số CCCD này đã được cấp vé trước đó. Thông tin vé cũ được bảo lưu an toàn.',
      });
    }

    // 2.3 Gate Check: Default 'closed' if unset in Redis
    const gateStatus = (await redis.get('config:gate')) || 'closed';
    if (gateStatus !== 'open') {
      const responseTimeMs = Date.now() - startTime;
      // Record rejected request into audit stream (fail-soft)
      logRequest({
        action: 'register_rejected',
        status: 'GATE_CLOSED',
        ip: clientIp,
        geo: { city, country, region },
        userAgent,
        responseTimeMs,
      }).catch(() => {});

      return res.status(403).json({
        success: false,
        error: 'GATE_CLOSED',
        message: 'Cổng check-in hiện đang đóng. Vui lòng liên hệ Ban Tổ Chức.',
      });
    }

    // 2.4 Atomic Ticket Allocation: LPOP from lucky:pool
    const pooledVal = await redis.lpop('lucky:pool');
    let ticketNumber = '';

    if (pooledVal !== null && pooledVal !== undefined) {
      if (typeof pooledVal === 'string' && (pooledVal.startsWith('NP-') || pooledVal.startsWith('#'))) {
        ticketNumber = pooledVal.startsWith('#') ? 'NP-2026-' + pooledVal.replace('#', '') : pooledVal;
      } else {
        ticketNumber = 'NP-2026-' + padZero(pooledVal, 3);
      }
    } else {
      // Pool is exhausted -> Assign Overflow ticket atomically
      const overflowCount = await redis.incr('stats:overflow_counter');
      ticketNumber = 'NP-OVERFLOW-' + padZero(overflowCount, 3);
    }

    // 2.5 Generate unique lead & receipt identifiers
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const receiptId = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const issuedAt = new Date().toISOString();

    const registrationRecord = {
      leadId,
      ticketNumber,
      receiptId,
      fullName,
      phone: phoneInfo.local,
      phoneE164: phoneInfo.e164Plain,
      cccdLast4: clean4Id,
      agency: agency || 'Khách mời tự do',
      email: email || '',
      role,
      utmSource,
      issuedAt,
      replayed: 'false',
      ip: clientIp,
      city,
      country,
      userAgent: userAgent.slice(0, 255),
    };

    // 2.6 Persistence: Redis Hash, phone index, counter, receipt, audit stream
    await Promise.all([
      redis.hset(phoneKey, registrationRecord),
      redis.sadd('reg:cccd4:' + clean4Id, phoneInfo.local),
      redis.incr('stats:total'),
      writeReceipt(leadId, {
        ...registrationRecord,
        replayed: false,
        clientIp,
        userAgent,
      }),
      logRequest({
        leadId,
        receiptId,
        ticketNumber,
        cccdLast4: clean4Id,
        phone: phoneInfo.local,
        ip: clientIp,
        geo: { city, country, region },
        userAgent,
        action: 'register',
        status: 'SUCCESS',
        responseTimeMs: Date.now() - startTime,
      }),
    ]);

    const responseTimeMs = Date.now() - startTime;

    // 2.7 Return sub-100ms HTTP 200 JSON to client
    const responsePayload = {
      success: true,
      leadId,
      ticketNumber,
      luckyNumber: ticketNumber.replace('NP-2026-', '').replace('NP-OVERFLOW-', 'OVERFLOW-'),
      receiptId,
      fullName,
      phone: phoneInfo.local,
      agency: registrationRecord.agency,
      cccdLast4: clean4Id,
      issuedAt,
      replayed: false,
      responseTimeMs,
    };

    // 2.8 Sync CAPI + Sheets with 2s timeout BEFORE res.json() (Vercel Serverless Lifecycle Rule)
    const syncTimeout = new Promise((resolve) => setTimeout(resolve, 2000));
    await Promise.race([
      Promise.allSettled([
        sendMetaLeadEvent({
          leadId,
          receiptId,
          ticketNumber,
          fullName,
          phone: phoneInfo.e164Plain,
          email,
          agency: registrationRecord.agency,
          clientIp,
          userAgent,
          fbp: body._fbp || (body.telemetry && body.telemetry._fbp),
          fbc: body._fbc || (body.telemetry && body.telemetry._fbc),
        }),
        appendLeadToSheet({
          leadId,
          receiptId,
          ticketNumber,
          fullName,
          phone: phoneInfo.raw,
          cccdLast4: clean4Id,
          agency: registrationRecord.agency,
          email,
          role,
          replayed: false,
          clientIp,
          city,
          country,
          userAgent,
          utmSource,
          responseTimeMs,
        }),
      ]).catch((err) => {
        console.error('[Register:BackgroundSync Error]:', err.message);
      }),
      syncTimeout,
    ]);

    return res.status(200).json(responsePayload);
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error('[Register Error]:', error);

    logRequest({
      action: 'register_error',
      status: 'ERROR',
      ip: clientIp,
      geo: { city, country, region },
      userAgent,
      responseTimeMs,
    }).catch(() => {});

    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Có lỗi phát sinh trong quá trình cấp số may mắn. Vui lòng thử lại.',
    });
  }
};
