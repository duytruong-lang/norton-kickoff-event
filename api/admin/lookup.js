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
    let registrations = [];

    if (cleanDigits.length === 4) {
      const phones = await redis.smembers(`reg:cccd4:${cleanDigits}`);
      if (phones && phones.length > 0) {
        const pipeline = redis.pipeline();
        phones.forEach(phone => pipeline.hgetall(`reg:phone:${phone}`));
        const results = await pipeline.exec();
        registrations = results.map(res => res[1]).filter(r => r && r.ticketNumber);
      }
    } else {
      const phoneInfo = normalizePhoneVN(rawQuery);
      let targetPhone = phoneInfo.isValid ? phoneInfo.local : cleanDigits;
      if (targetPhone) {
        const reg = await redis.hgetall(`reg:phone:${targetPhone}`);
        if (reg && reg.ticketNumber) {
          registrations = [reg];
        }
      }
    }

    if (registrations.length === 0) {
      return res.status(200).json({
        success: true,
        matched: null,
        registration: null,
        receipt: null,
        timeline: [],
        message: `Không tìm thấy thông tin đăng ký cho từ khóa: ${rawQuery}`,
      });
    }

    const processRegistration = async (registration) => {
      const leadId = registration.leadId;
      const receipt = await getReceipt(leadId);
      
      let timeline = [];
      try {
        const streamEntries = await redis.xrange('audit:log', '-', '+', 100);
        if (Array.isArray(streamEntries)) {
          const cccdHashed = sha256Hex(registration.cccdLast4 || registration.cccd);
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

      const isReplay = registration.replayed === 'true' || (receipt && receipt.replayed);
      const luckyNum = (registration.ticketNumber || '')
        .replace('NP-2026-', '')
        .replace('NP-OVERFLOW-', 'OVERFLOW-');

      const matched = {
        name: registration.fullName,
        phone: registration.phone,
        cccd: registration.cccdLast4 || registration.cccd,
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

      return { matched, registration, receipt, timeline };
    };

    const results = await Promise.all(registrations.map(processRegistration));
    
    if (results.length === 1) {
      return res.status(200).json({
        success: true,
        matched: results[0].matched,
        registration: results[0].registration,
        receipt: results[0].receipt,
        timeline: results[0].timeline,
        message: 'Tra cứu hồ sơ thành công.',
      });
    } else {
      return res.status(200).json({
        success: true,
        matched: results.map(r => r.matched),
        registration: results.map(r => r.registration),
        receipt: results.map(r => r.receipt),
        timeline: results.map(r => r.timeline),
        message: `Tìm thấy ${results.length} hồ sơ.`,
      });
    }
  } catch (err) {
    console.error('[Admin Lookup Error]:', err.message);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Lỗi trong quá trình tra cứu thông tin: ' + err.message,
    });
  }
};
