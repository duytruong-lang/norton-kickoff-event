/**
 * 1990 Agency — Norton Park Sales Kick-off Event Backend
 * Google Sheets ERP 26-Column Formatter & Webhook Synchronizer (Non-blocking)
 */

const { normalizePhoneVN, splitVietnameseName } = require('./helpers');

const SHEET_HEADERS_26 = [
  'Timestamp',          // Col 1
  'Lead ID',            // Col 2
  'Ticket Number',      // Col 3
  'Full Name',          // Col 4
  'Last Name',          // Col 5
  'First Name',         // Col 6
  'Phone Raw',          // Col 7
  'Phone E.164',        // Col 8
  'CCCD / CMND',        // Col 9
  'Agency / Sàn',       // Col 10
  'Email',              // Col 11
  'Role / Chức vụ',     // Col 12
  'Event Venue',        // Col 13 (GEM Center)
  'Event Name',         // Col 14 (Sales Kick-off Norton Park)
  'Project',            // Col 15 (Norton Park)
  'Developer',          // Col 16 (Gamuda Land)
  'Check-in Status',    // Col 17 (CONFIRMED / REPLAYED)
  'Is Replayed',        // Col 18 (TRUE / FALSE)
  'Client IP',          // Col 19
  'City',               // Col 20
  'Country',            // Col 21
  'User Agent',         // Col 22
  'UTM Source',         // Col 23
  'Meta Event ID',      // Col 24
  'receiptId',          // Col 25: Mandatory specification
  'responseTimeMs',     // Col 26: Mandatory specification
];

/**
 * Format registration data into strictly ordered 26 columns array for ERP
 * @param {Object} data
 * @returns {Array<string|number>} Array of 26 items
 */
function format26Columns(data = {}) {
  const phoneInfo = normalizePhoneVN(data.phone || data.phoneRaw || '');
  const nameParts = splitVietnameseName(data.fullName || '');

  // Format Vietnam Time (GMT+7)
  const now = data.timestamp ? new Date(data.timestamp) : new Date();
  const timeFormatted = now.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
  });

  const row = [
    timeFormatted,                                         // Col 1: Timestamp
    String(data.leadId || ''),                             // Col 2: Lead ID
    String(data.ticketNumber || ''),                       // Col 3: Ticket Number
    String(data.fullName || ''),                           // Col 4: Full Name
    nameParts.lastName,                                    // Col 5: Last Name
    nameParts.firstName,                                   // Col 6: First Name
    phoneInfo.raw,                                         // Col 7: Phone Raw
    phoneInfo.e164Plain || phoneInfo.local,                // Col 8: Phone E.164
    String(data.cccd || ''),                               // Col 9: CCCD / CMND
    String(data.agency || 'Khách mời tự do'),              // Col 10: Agency / Sàn
    String(data.email || ''),                              // Col 11: Email
    String(data.role || 'Chiến binh kinh doanh'),          // Col 12: Role
    'GEM Center',                                          // Col 13: Event Venue
    'Sales Kick-off Norton Park',                          // Col 14: Event Name
    'Norton Park',                                         // Col 15: Project
    'Gamuda Land',                                         // Col 16: Developer
    data.replayed ? 'REPLAYED' : 'CONFIRMED',              // Col 17: Check-in Status
    data.replayed ? 'TRUE' : 'FALSE',                      // Col 18: Is Replayed
    String(data.clientIp || data.ip || ''),                // Col 19: Client IP
    String(data.city || 'Ho Chi Minh City'),               // Col 20: City
    String(data.country || 'VN'),                          // Col 21: Country
    String(data.userAgent || '').slice(0, 255),            // Col 22: User Agent
    String(data.utmSource || data.source || 'LDP_ORGANIC'), // Col 23: UTM Source
    String(data.metaEventId || data.receiptId || data.leadId || ''), // Col 24: Meta Event ID
    String(data.receiptId || ''),                          // Col 25: receiptId
    Number(data.responseTimeMs || 0),                      // Col 26: responseTimeMs
  ];

  return row;
}

/**
 * Append lead row to Google Sheets via Webhook URL (Fail-soft, non-blocking)
 * @param {Object} data
 * @returns {Promise<Object>}
 */
async function appendLeadToSheet(data = {}) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      success: false,
      skipped: true,
      reason: 'GOOGLE_SHEETS_WEBHOOK_URL_NOT_SET',
    };
  }

  const rowData = format26Columns(data);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'appendRow',
        spreadsheet: 'Norton Park Kick-off 2026',
        sheet: 'Check-in Realtime',
        row: rowData,
        leadId: data.leadId,
        receiptId: data.receiptId,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    return {
      success: response.ok,
      status: response.status,
    };
  } catch (err) {
    console.error('[Sheets:appendLeadToSheet] Webhook dispatch error (fail-soft):', err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = {
  SHEET_HEADERS_26,
  format26Columns,
  appendLeadToSheet,
};
