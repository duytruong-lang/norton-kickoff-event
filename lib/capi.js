/**
 * 1990 Agency — Norton Park Sales Kick-off Event Backend
 * Meta Conversions API (CAPI) v22.0 Lead Event Dispatcher (Non-blocking)
 */

const { normalizePhoneVN, splitVietnameseName, removeDiacritics, sha256Hex } = require('./helpers');

const META_GRAPH_VERSION = 'v22.0';
const DEFAULT_SOURCE_URL = 'https://norton-kickoff-event.vercel.app';
const DEFAULT_VENUE = 'GEM Center';

/**
 * Send Meta CAPI Lead event asynchronously (fail-soft, non-blocking)
 * @param {Object} params
 * @param {string} params.leadId - Event ID for deduplication
 * @param {string} params.receiptId - Verification receipt ID
 * @param {string} params.ticketNumber - e.g. NP-2026-001 or NP-OVERFLOW-001
 * @param {string} params.fullName - Attendee name
 * @param {string} params.phone - Attendee phone
 * @param {string} [params.email] - Optional email
 * @param {string} [params.agency] - Real estate distributor / agency
 * @param {string} [params.clientIp] - Client IP address
 * @param {string} [params.userAgent] - Browser user agent
 * @param {string} [params.sourceUrl] - Event source URL
 * @param {string} [params.fbp] - Browser cookie _fbp
 * @param {string} [params.fbc] - Click cookie _fbc
 * @returns {Promise<Object>} Status of CAPI dispatch
 */
async function sendMetaLeadEvent(params = {}) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
  const sourceUrl = process.env.EVENT_SOURCE_URL || DEFAULT_SOURCE_URL;

  // Fail-soft if Meta credentials are not configured yet
  if (!pixelId || !accessToken) {
    return {
      success: false,
      skipped: true,
      reason: 'META_CAPI_CREDENTIALS_NOT_SET',
    };
  }

  try {
    // 1. Normalize and hash user data
    const phoneInfo = normalizePhoneVN(params.phone);
    const nameParts = splitVietnameseName(params.fullName);

    const cleanFn = removeDiacritics(nameParts.firstName).toLowerCase();
    const cleanLn = removeDiacritics(nameParts.lastName).toLowerCase();

    const userData = {
      client_ip_address: params.clientIp || undefined,
      client_user_agent: params.userAgent || undefined,
    };

    if (phoneInfo.e164Plain) {
      userData.ph = [sha256Hex(phoneInfo.e164Plain)];
    }

    if (cleanFn) {
      userData.fn = [sha256Hex(cleanFn)];
    }

    if (cleanLn) {
      userData.ln = [sha256Hex(cleanLn)];
    }

    if (params.email) {
      userData.em = [sha256Hex(params.email)];
    }

    if (params.fbp) userData.fbp = params.fbp;
    if (params.fbc) userData.fbc = params.fbc;

    // 2. Build CAPI payload with Norton Park GEM Center specifications
    const eventPayload = {
      data: [
        {
          event_name: 'Lead',
          event_time: Math.floor(Date.now() / 1000),
          event_id: params.receiptId || params.leadId, // Exact event_id matching browser pixel
          event_source_url: sourceUrl,
          action_source: 'website',
          user_data: userData,
          custom_data: {
            content_name: 'Sales Kick-off Norton Park Ticket',
            content_category: 'Real Estate Check-in',
            currency: 'VND',
            value: 0,
            event_venue: DEFAULT_VENUE,
            event_name: 'Sales Kick-off Norton Park',
            ticket_number: params.ticketNumber || '',
            agency: params.agency || '',
            project_name: 'Norton Park',
            developer: 'Gamuda Land',
            receipt_id: params.receiptId || '',
          },
        },
      ],
    };

    // 3. Post to Meta Graph API v22.0 with timeout
    const endpoint = `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events?access_token=${accessToken}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const result = await response.json();
    return {
      success: response.ok,
      status: response.status,
      result,
    };
  } catch (err) {
    console.error('[CAPI:sendMetaLeadEvent] Dispatch error (fail-soft):', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = {
  sendMetaLeadEvent,
  META_GRAPH_VERSION,
  DEFAULT_SOURCE_URL,
  DEFAULT_VENUE,
};
