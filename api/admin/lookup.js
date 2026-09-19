/**
 * 1990 Agency — Norton Park Sales Kick-off Event Backend
 * API Endpoint: /api/admin/lookup
 * 
 * Protected by ADMIN_SECRET
 * Real-time dispute lookup by CCCD or Phone number
 * Returns Registration Dossier, Cryptographic Receipt, and Audit Log Timeline
 */

const { redis } = require('../../lib/redis');
const { cleanCCCD, normalizePhoneVN, sha256Hex } = require('../../lib/helpers');
const { getReceipt } = require('../../lib/audit');

const DEFAULT_ADMIN_SECRET = 'norton_admin_secret_2026';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-secret, Authorization'
  );
}

function verifyAdminAuth(req) {
  const secretKey = process.env.ADMIN_SECRET || DEFAULT_ADMIN_SECRET;

  const authHeader = req.headers['authorization'];
  let bearerToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.substring(7).trim();
  }

  const customHeader = req.headers['x-admin-secret'];
  const querySecret = req.query ? (req.query.secret || req.query.adminSecret) : null;

  const providedSecret = customHeader || bearerToken || querySecret;
  return Boolean(providedSecret && providedSecret === secretKey);
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
    });
  }

  // Admin authentication check
  if (!verifyAdminAuth(req)) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Mã xác thực quản trị (ADMIN_SECRET) không chính xác.',
    });
  }

  const rawQuery = String(req.query?.query || req.query?.cccd || req.query?.phone || '').trim();
  if (!rawQuery) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_QUERY',
      message: 'Vui lòng cung cấp CCCD hoặc Số điện thoại để tra cứu.',
    });
  }

  try {
    const cleanDigits = rawQuery.replace(/\D/g, '');
    let matchedCccd = null;
    let registration = null;

    // 1. Try finding by CCCD key directly
    if (cleanDigits) {
      const byCccd = await redis.hgetall(`reg:cccd:${cleanDigits}`);
      if (byCccd && byCccd.ticketNumber) {
        matchedCccd = cleanDigits;
        registration = byCccd;
      }
    }

    // 2. If not found, try finding via Phone Index
    if (!registration) {
      const phoneInfo = normalizePhoneVN(rawQuery);
      if (phoneInfo.local) {
        const cccdFromPhone = await redis.get(`reg:phone:${phoneInfo.local}`);
        if (cccdFromPhone) {
          matchedCccd = cccdFromPhone;
          registration = await redis.hgetall(`reg:cccd:${cccdFromPhone}`);
        }
      }
    }

    // 3. If still not found, search in raw query format
    if (!registration && cleanDigits) {
      const cccdFromPhone = await redis.get(`reg:phone:${cleanDigits}`);
      if (cccdFromPhone) {
        matchedCccd = cccdFromPhone;
        registration = await redis.hgetall(`reg:cccd:${cccdFromPhone}`);
      }
    }

    // If no record found
    if (!registration || !registration.ticketNumber) {
      return res.status(200).json({
        success: true,
        matched: null,
        registration: null,
        receipt: null,
        timeline: [],
        message: `Không tìm thấy thông tin đăng ký cho từ khóa: ${rawQuery}`,
      });
    }

    // 4. Retrieve immutable verification receipt
    const leadId = registration.leadId;
    const receipt = await getReceipt(leadId);

    // 5. Query Redis Stream audit:log for dispute timeline
    let timeline = [];
    try {
      // Fetch recent 100 audit entries
      const streamEntries = await redis.xrange('audit:log', '-', '+', 100);
      if (Array.isArray(streamEntries)) {
        const cccdHashed = sha256Hex(registration.cccd);
        const phoneLocal = registration.phone;

        timeline = streamEntries
          .map(([msgId, fields]) => {
            const entry = typeof fields === 'object' ? fields : {};
            return {
              messageId: msgId,
              timestamp: entry.timestamp || new Date().toISOString(),
              action: entry.action || 'system_event',
              status: entry.status || 'INFO',
              leadId: entry.leadId || '',
              ticketNumber: entry.ticketNumber || '',
              ip: entry.ip || '',
              cccdHash: entry.cccdHash || '',
              phoneMasked: entry.phoneMasked || '',
              responseTimeMs: entry.responseTimeMs || '0',
            };
          })
          .filter(e => {
            return (
              (e.leadId && e.leadId === leadId) ||
              (e.ticketNumber && e.ticketNumber === registration.ticketNumber) ||
              (e.cccdHash && e.cccdHash === cccdHashed) ||
              (e.phoneMasked && phoneLocal && e.phoneMasked.includes(phoneLocal.slice(-3)))
            );
          });
      }
    } catch (streamErr) {
      console.warn('[Admin Lookup] Stream audit query error (fail-soft):', streamErr.message);
    }

    // 6. Format matched view model compatible with admin.html UI
    const isReplay = registration.replayed === 'true' || (receipt && receipt.replayed);
    const luckyNum = (registration.ticketNumber || '')
      .replace('NP-2026-', '')
      .replace('NP-OVERFLOW-', 'OVERFLOW-');

    const matched = {
      name: registration.fullName,
      phone: registration.phone,
      cccd: registration.cccd,
      agency: registration.agency || 'Khách mời tự do',
      email: registration.email || 'sales@gamudaland.vn',
      luckyNumber: luckyNum,
      ticketCode: registration.ticketNumber,
      checkedInAt: registration.issuedAt,
      displayTime: new Date(registration.issuedAt).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false,
      }),
      clientIp: registration.ip || (receipt && receipt.clientIp) || '127.0.0.1',
      userAgent: registration.userAgent || '',
      receiptId: receipt ? receipt.receiptId : registration.receiptId,
      isReplay: Boolean(isReplay),
      replayCount: isReplay ? 2 : 1,
      integrityHash: receipt ? receipt.signature : sha256Hex(`${leadId}|${registration.ticketNumber}`),
    };

    return res.status(200).json({
      success: true,
      matched,
      registration,
      receipt,
      timeline,
      message: 'Tra cứu hồ sơ thành công.',
    });
  } catch (err) {
    console.error('[Admin Lookup Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Lỗi trong quá trình tra cứu thông tin: ' + err.message,
    });
  }
};
