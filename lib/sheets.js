/**
 * 1990 Agency — Norton Park Sales Kick-off Event Backend
 * Google Sheets ERP 14-Column Streamlined Formatter & Webhook Synchronizer (Non-blocking)
 * 
 * BẢNG 14 CỘT TINH GỌN (LOẠI BỎ 12 CỘT RÁC & TRÙNG LẶP):
 * Phân khu A (Vận hành sự kiện): Thời Gian, Số Vé, Họ Tên, SĐT, CCCD, Đại Lý, Email, Trạng Thái
 * Phân khu B (Kỹ thuật & Đối soát): Nguồn ĐK, Lead ID, Receipt ID, Meta Event ID, Client IP, Thiết Bị
 */

const { normalizePhoneVN } = require('./helpers');

const SHEET_HEADERS_14 = [
  'Thời Gian',            // Col 1 (A)
  'Số Vé May Mắn',        // Col 2 (B) - Mã số quay thưởng bốc thăm
  'Họ Và Tên',            // Col 3 (C)
  'Số Điện Thoại',        // Col 4 (D) - Chuẩn hóa 0908xxxxxx
  'CCCD (4 số cuối)',     // Col 5 (E) - Masked đối chiếu nhận giải
  'Đại Lý / Sàn F1',      // Col 6 (F)
  'Email',                // Col 7 (G)
  'Trạng Thái',           // Col 8 (H) - CONFIRMED / REPLAYED
  'Nguồn Đăng Ký',        // Col 9 (I) - UTM Source
  'Lead ID',              // Col 10 (J)
  'Biên Lai (Receipt ID)',// Col 11 (K) - Khóa đối soát HMAC
  'Meta Event ID',        // Col 12 (L) - Khóa dedup Meta CAPI
  'Client IP',            // Col 13 (M)
  'Thiết Bị',             // Col 14 (N)
];

/**
 * Format registration data into strictly ordered 14 columns array for ERP
 * @param {Object} data
 * @returns {Array<string|number>} Array of 14 items
 */
function format14Columns(data = {}) {
  const phoneInfo = normalizePhoneVN(data.phone || data.phoneRaw || '');

  // Format Vietnam Time (GMT+7)
  const now = data.timestamp ? new Date(data.timestamp) : new Date();
  const timeFormatted = now.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
  });

  const rawTicket = String(data.ticketNumber || '');
  let luckyNumber = rawTicket;
  if (rawTicket.startsWith('NP-2026-')) {
    luckyNumber = '#' + rawTicket.replace('NP-2026-', '');
  } else if (rawTicket.startsWith('NP-OVERFLOW-')) {
    luckyNumber = '#OVERFLOW-' + rawTicket.replace('NP-OVERFLOW-', '');
  }

  const row = [
    timeFormatted,                                                   // Col 1: Thời Gian
    luckyNumber || rawTicket,                                        // Col 2: Số Vé May Mắn
    String(data.fullName || ''),                                     // Col 3: Họ Và Tên
    phoneInfo.local || phoneInfo.raw || String(data.phone || ''),    // Col 4: Số Điện Thoại
    '•••• •••• ' + (data.cccdLast4 || data.cccd || ''),              // Col 5: CCCD (4 số cuối)
    String(data.agency || 'Khách mời tự do'),                        // Col 6: Đại Lý / Sàn F1
    String(data.email || ''),                                        // Col 7: Email
    data.replayed ? 'REPLAYED' : 'CONFIRMED',                        // Col 8: Trạng Thái
    String(data.utmSource || data.source || 'LDP_ORGANIC'),           // Col 9: Nguồn Đăng Ký
    String(data.leadId || ''),                                       // Col 10: Lead ID
    String(data.receiptId || ''),                                    // Col 11: Biên Lai (Receipt ID)
    String(data.metaEventId || data.receiptId || data.leadId || ''), // Col 12: Meta Event ID
    String(data.clientIp || data.ip || ''),                          // Col 13: Client IP
    String(data.userAgent || '').slice(0, 150),                      // Col 14: Thiết Bị
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

  const rowData = format14Columns(data);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'appendRow',
        spreadsheet: 'Norton Park - The Sync - Sale Kickoff - ERP',
        sheet: 'Sheet1',
        row: rowData,
        leadId: data.leadId,
        receiptId: data.receiptId,
        ticketNumber: data.ticketNumber,
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
  SHEET_HEADERS_14,
  SHEET_HEADERS_26: SHEET_HEADERS_14, // Backward compatibility alias
  format14Columns,
  format26Columns: format14Columns,   // Backward compatibility alias
  appendLeadToSheet,
};
