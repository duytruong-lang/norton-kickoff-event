/**
 * ==============================================================================
 * 1990 Agency — Norton Park Sales Kick-off Event ERP Synchronizer
 * Google Apps Script Webhook Handler (High-Concurrency & Idempotent)
 * 
 * SỰ KIỆN: The SYNC Show — Norton Park (Gamuda Land)
 * ĐỊA ĐIỂM: Rạp Xiếc Và Biểu Diễn Đa Năng Phú Thọ (08.10.2026)
 * ==============================================================================
 * 
 * HƯỚNG DẪN CÀI ĐẶT:
 * 1. Mở Google Sheet: https://docs.google.com/spreadsheets/d/1IpfahCoOnvE5dc9JES9upMiBvW6l__Cx8X4aD2i3A28/edit
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa hết code mặc định trong file Code.gs, copy toàn bộ nội dung file này dán vào.
 * 4. Bấm "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment).
 *    - Loại: Ứng dụng web (Web app).
 *    - Mô tả: "Norton Park ERP Webhook v1".
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me).
 *    - Người có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone) - BẮT BUỘC để Vercel gọi được.
 * 5. Bấm "Triển khai" (Deploy), cấp quyền truy cập tài khoản Google nếu có yêu cầu.
 * 6. Copy URL Webhook nhận được (dạng https://script.google.com/macros/s/.../exec) và gửi lại cho em!
 */

const SHEET_NAME = 'Sheet1';

const HEADERS_26 = [
  'Timestamp',
  'Lead ID',
  'Ticket Number',
  'Full Name',
  'Last Name',
  'First Name',
  'Phone Raw',
  'Phone E.164',
  'CCCD / CMND',
  'Agency / Sàn',
  'Email',
  'Role / Chức vụ',
  'Event Venue',
  'Event Name',
  'Project',
  'Developer',
  'Check-in Status',
  'Is Replayed',
  'Client IP',
  'City',
  'Country',
  'User Agent',
  'UTM Source',
  'Meta Event ID',
  'receiptId',
  'responseTimeMs'
];

/**
 * 1. Healthcheck Endpoint (GET)
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  var totalRows = Math.max(0, sheet.getLastRow() - 1);

  var result = {
    status: 'ONLINE',
    service: '1990 Agency — Norton Park ERP Webhook',
    spreadsheet: ss.getName(),
    sheetName: sheet.getName(),
    totalRegistrations: totalRows,
    timestamp: new Date().toISOString()
  };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 2. Webhook Event Ingestion (POST)
 * Hỗ trợ đồng thời hàng trăm request với LockService (tránh ghi đè dòng)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  // Chờ tối đa 10 giây để lấy lock an toàn trong giờ cao điểm
  var successLock = lock.tryLock(10000);

  if (!successLock) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'SERVER_BUSY',
      message: 'Hệ thống đang xử lý tải cao, vui lòng thử lại.'
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'EMPTY_BODY',
        message: 'No payload received'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(payload.sheet) || ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];

    // Đảm bảo dòng tiêu đề Header luôn tồn tại
    ensureHeaders(sheet);

    var rowData = payload.row;
    if (!rowData || !Array.isArray(rowData)) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'INVALID_ROW',
        message: 'row must be an array of 26 items'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Kiểm tra Idempotency chống duplicate theo receiptId (Cột 25 / Y) hoặc leadId (Cột 2 / B)
    var receiptId = String(payload.receiptId || rowData[24] || '');
    var lastRow = sheet.getLastRow();
    
    if (receiptId && lastRow > 1) {
      var receiptRange = sheet.getRange(2, 25, lastRow - 1, 1).getValues();
      for (var i = 0; i < receiptRange.length; i++) {
        if (receiptRange[i][0] === receiptId) {
          // Đã tồn tại, bỏ qua ghi đè để bảo toàn dữ liệu
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            replayed: true,
            rowNumber: i + 2,
            receiptId: receiptId,
            message: 'Duplicate entry detected; preserved initial record'
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Ghi dòng mới vào cuối bảng
    sheet.appendRow(rowData);
    var newRowIndex = sheet.getLastRow();

    // Định dạng nhẹ cho dòng mới (font Plus Jakarta Sans / Arial, vertical center)
    var newRowRange = sheet.getRange(newRowIndex, 1, 1, 26);
    newRowRange.setFontFamily('Arial').setFontSize(9).setVerticalAlignment('middle');

    // Căn giữa các cột mã số, ID, CCCD, Status
    // Col 1 (Timestamp), 2 (Lead ID), 3 (Ticket Number), 7 (Phone), 8 (E164), 9 (CCCD), 17 (Status), 18 (Replayed), 25 (receiptId)
    sheet.getRange(newRowIndex, 1).setHorizontalAlignment('center');
    sheet.getRange(newRowIndex, 2).setHorizontalAlignment('center');
    sheet.getRange(newRowIndex, 3).setHorizontalAlignment('center').setFontWeight('bold');
    sheet.getRange(newRowIndex, 7).setHorizontalAlignment('center');
    sheet.getRange(newRowIndex, 8).setHorizontalAlignment('center');
    sheet.getRange(newRowIndex, 9).setHorizontalAlignment('center');
    sheet.getRange(newRowIndex, 17).setHorizontalAlignment('center');
    sheet.getRange(newRowIndex, 18).setHorizontalAlignment('center');

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      rowNumber: newRowIndex,
      leadId: payload.leadId,
      receiptId: receiptId,
      ticketNumber: rowData[2]
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'INTERNAL_ERROR',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

/**
 * 3. Tiện ích tự động tạo Header chuẩn Dark Pine nếu bảng trống
 */
function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS_26);
    var headerRange = sheet.getRange(1, 1, 1, 26);
    headerRange
      .setBackground('#1B211C')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setFontFamily('Arial')
      .setFontSize(10)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
    
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 38);
  }
}

/**
 * 4. Hàm chạy thủ công để format đẹp toàn bộ bảng (Setup 1 lần)
 */
function setupSheetStyle() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  
  if (sheet.getLastRow() > 0) {
    var headerRange = sheet.getRange(1, 1, 1, 26);
    headerRange
      .setBackground('#1B211C')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setFontFamily('Arial')
      .setFontSize(10)
      .setHorizontalAlignment('center')
      .setVerticalAlignment('middle');
      
    sheet.setFrozenRows(1);
    sheet.setRowHeight(1, 38);
  }
}
