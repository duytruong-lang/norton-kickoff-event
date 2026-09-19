/**
 * 1990 Agency — Norton Park Sales Kick-off Event Backend
 * Audit Logging (Redis Streams) & Immutable Verification Receipts (Redis Hash)
 */

const { redis } = require('./redis');
const { sha256Hex } = require('./helpers');

const STREAM_AUDIT_LOG = 'audit:log';
const STREAM_AUDIT_ADMIN = 'audit:admin';

/**
 * Log customer registration requests to Redis Stream 'audit:log' (Fail-soft)
 * @param {Object} entry
 * @returns {Promise<string|null>} Message ID in stream
 */
async function logRequest(entry = {}) {
  try {
    const payload = {
      timestamp: entry.timestamp || new Date().toISOString(),
      leadId: String(entry.leadId || ''),
      receiptId: String(entry.receiptId || ''),
      action: String(entry.action || 'register'),
      status: String(entry.status || 'SUCCESS'),
      ticketNumber: String(entry.ticketNumber || ''),
      cccdHash: entry.cccd ? sha256Hex(entry.cccd) : String(entry.cccdHash || ''),
      phoneMasked: entry.phone ? String(entry.phone).replace(/(\d{3})\d{4}(\d{3})/, '$1****$2') : '',
      phoneHash: entry.phone ? sha256Hex(entry.phone) : '',
      ip: String(entry.ip || ''),
      geo: typeof entry.geo === 'object' ? JSON.stringify(entry.geo) : String(entry.geo || ''),
      userAgent: String(entry.userAgent || '').slice(0, 255),
      responseTimeMs: String(entry.responseTimeMs || 0),
    };

    const res = await redis.xadd(STREAM_AUDIT_LOG, '*', payload);
    return res;
  } catch (err) {
    console.error('[Audit:logRequest] Error writing to stream:', err.message);
    return null;
  }
}

/**
 * Log administrative operations to Redis Stream 'audit:admin' (Fail-soft)
 * @param {Object} adminEntry
 * @returns {Promise<string|null>} Message ID in stream
 */
async function logAdminAction(adminEntry = {}) {
  try {
    const payload = {
      timestamp: adminEntry.timestamp || new Date().toISOString(),
      action: String(adminEntry.action || ''),
      adminUser: String(adminEntry.adminUser || 'system_admin'),
      ip: String(adminEntry.ip || ''),
      details: typeof adminEntry.details === 'object' ? JSON.stringify(adminEntry.details) : String(adminEntry.details || ''),
      previousState: String(adminEntry.previousState || ''),
      newState: String(adminEntry.newState || ''),
      status: String(adminEntry.status || 'SUCCESS'),
    };

    const res = await redis.xadd(STREAM_AUDIT_ADMIN, '*', payload);
    return res;
  } catch (err) {
    console.error('[Audit:logAdminAction] Error writing to stream:', err.message);
    return null;
  }
}

/**
 * Write immutable verification receipt to Redis Hash 'receipt:{leadId}'
 * @param {string} leadId
 * @param {Object} receiptData
 * @returns {Promise<Object>} The written receipt
 */
async function writeReceipt(leadId, receiptData = {}) {
  const receiptKey = `receipt:{${leadId}}`;
  const cleanReceipt = {
    receiptId: String(receiptData.receiptId || `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`),
    leadId: String(leadId),
    ticketNumber: String(receiptData.ticketNumber || ''),
    cccdHash: String(receiptData.cccdHash || (receiptData.cccd ? sha256Hex(receiptData.cccd) : '')),
    phoneHash: String(receiptData.phoneHash || (receiptData.phone ? sha256Hex(receiptData.phone) : '')),
    fullName: String(receiptData.fullName || ''),
    agency: String(receiptData.agency || ''),
    issuedAt: receiptData.issuedAt || new Date().toISOString(),
    clientIp: String(receiptData.clientIp || receiptData.ip || ''),
    userAgent: String(receiptData.userAgent || '').slice(0, 255),
    replayed: String(receiptData.replayed === true ? 'true' : 'false'),
    gateStatus: String(receiptData.gateStatus || 'open'),
    signature: sha256Hex(`${leadId}|${receiptData.ticketNumber}|${receiptData.issuedAt || ''}|${process.env.ADMIN_SECRET || 'norton_2026'}`),
  };

  try {
    await redis.hset(receiptKey, cleanReceipt);
  } catch (err) {
    console.error(`[Audit:writeReceipt] Error writing receipt for lead ${leadId}:`, err.message);
  }

  return cleanReceipt;
}

/**
 * Retrieve immutable verification receipt from Redis Hash 'receipt:{leadId}'
 * @param {string} leadId
 * @returns {Promise<Object|null>}
 */
async function getReceipt(leadId) {
  if (!leadId) return null;
  try {
    // Try primary key format 'receipt:{leadId}'
    let data = await redis.hgetall(`receipt:{${leadId}}`);
    if (!data || Object.keys(data).length === 0) {
      // Fallback format 'receipt:leadId'
      data = await redis.hgetall(`receipt:${leadId}`);
    }
    if (!data || Object.keys(data).length === 0) return null;

    return {
      ...data,
      replayed: data.replayed === 'true',
    };
  } catch (err) {
    console.error(`[Audit:getReceipt] Error fetching receipt for lead ${leadId}:`, err.message);
    return null;
  }
}

module.exports = {
  STREAM_AUDIT_LOG,
  STREAM_AUDIT_ADMIN,
  logRequest,
  logAdminAction,
  writeReceipt,
  getReceipt,
};
