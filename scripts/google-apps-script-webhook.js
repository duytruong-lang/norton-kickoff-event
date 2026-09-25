/**
 * ==============================================================================
 * 1990 Agency — Norton Park Sales Kick-off Event ERP Synchronizer
 * Google Apps Script Webhook Handler (High-Concurrency & Idempotent)
 * 
 * SỰ KIỆN: The SYNC Show — Norton Park (Gamuda Land)
 * ĐỊA ĐIỂM: Rạp Xiếc Và Biểu Diễn Đa Năng Phú Thọ (08.10.2026)
 * ==============================================================================
 * 
 * PHIÊN BẢN v2.0 TINH GỌN (14 CỘT CHUẨN ERP):
 * - Loại bỏ 12 cột rác/trùng lặp/tĩnh (Venue, Project, Developer, Role, v.v.)
 * - Cột A -> H: Phân khu Vận Hành (Thời Gian, Số Vé May Mắn, Họ Tên, SĐT, CCCD, Đại Lý, Email, Trạng Thái)
 * - Cột I -> N: Phân khu Kỹ Thuật (Nguồn, Lead ID, Receipt ID, Meta Event ID, IP, Thiết Bị)
 * 
 * HƯỚNG DẪN CÀI ĐẶT (30 GIÂY):
 * 1. Mở Google Sheet: https://docs.google.com/spreadsheets/d/1IpfahCoOnvE5dc9JES9upMiBvW6l__Cx8X4aD2i3A28/edit
 * 2. Trên menu: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa toàn bộ code cũ trong file Code.gs, dán toàn bộ nội dung file này vào.
 * 4. Bấm biểu tượng 💾 "Lưu dự án" (Save).
 * 5. Trên thanh toolbar, chọn hàm `setupSheetStyle` và bấm "Chạy" (Run) -> Cấp quyền nếu hỏi -> Bảng tính sẽ tự động kẻ bảng, chỉnh độ rộng cột và tô màu Dark Pine & Gold sang trọng!
 * 6. Bấm "Triển khai" (Deploy) -> "Quản lý lượt triển khai" (Manage deployments) -> Bấm icon bút chì ✏️ -> Chọn "Phiên bản mới" (New version) -> Bấm "Triển khai" (Deploy) -> Hoàn tất!
 */

var SHEET_NAME = 'Sheet1';

var HEADERS_14 = [
  'Thời Gian',            // Col 1 (A)
  'Số Vé May Mắn',        // Col 2 (B) - Mã bốc thăm (#088, NP-2026-xxx)
  'Họ Và Tên',            // Col 3 (C)
  'Số Điện Thoại',        // Col 4 (D)
  'CCCD (4 số cuối)',     // Col 5 (E)
  'Đại Lý / Sàn F1',      // Col 6 (F)
  'Email',                // Col 7 (G)
  'Trạng Thái',           // Col 8 (H) - CONFIRMED / REPLAYED
  'Nguồn Đăng Ký',        // Col 9 (I) - UTM Source
  'Lead ID',              // Col 10 (J)
  'Biên Lai (Receipt ID)',// Col 11 (K) - Khóa đối soát HMAC
  'Meta Event ID',        // Col 12 (L) - Khóa dedup Meta CAPI
  'Client IP',            // Col 13 (M)
  'Thiết Bị'              // Col 14 (N)
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
    version: '2.0.0-streamlined-14col',
    service: '1990 Agency — Norton Park ERP Webhook',
    spreadsheet: ss.getName(),
    sheetName: sheet.getName(),
    totalRegistrations: totalRows,
    headers: HEADERS_14,
    timestamp: new Date().toISOString()
  };

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 2. Webhook Event Ingestion (POST)
 * Hỗ trợ đồng thời cao với LockService 10s (chống race-condition ghi đè dòng)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var successLock = lock.tryLock(10000);

  if (!successLock) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'SERVER_BUSY',
      message: 'Hệ thống đang xử lý tải cao, vui lòng thử lại sau vài giây.'
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

    // Đảm bảo dòng tiêu đề 14 cột chuẩn luôn tồn tại
    ensureHeaders(sheet);

    var rowData = payload.row;
    if (!rowData || !Array.isArray(rowData)) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'INVALID_ROW',
        message: 'row must be an array'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Tương thích ngược: Nếu backend cũ gửi 26 cột, trích xuất đúng 14 cột cần thiết
    if (rowData.length === 26) {
      rowData = [
        rowData[0],  // Timestamp
        rowData[2],  // Ticket Number
        rowData[3],  // Full Name
        rowData[6],  // Phone Raw
        rowData[8],  // CCCD
        rowData[9],  // Agency
        rowData[10], // Email
        rowData[16], // Status
        rowData[22], // UTM Source
        rowData[1],  // Lead ID
        rowData[24], // receiptId
        rowData[23], // Meta Event ID
        rowData[18], // Client IP
        rowData[21]  // User Agent
      ];
    }

    // Kiểm tra Idempotency chống duplicate theo receiptId (Cột 11 / K)
    var receiptId = String(payload.receiptId || rowData[10] || '');
    var lastRow = sheet.getLastRow();
    
    if (receiptId && lastRow > 1) {
      var receiptRange = sheet.getRange(2, 11, lastRow - 1, 1).getValues();
      for (var i = 0; i < receiptRange.length; i++) {
        if (receiptRange[i][0] === receiptId) {
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

    // Định dạng dòng mới
    var newRowRange = sheet.getRange(newRowIndex, 1, 1, 14);
    newRowRange.setFontFamily('Arial').setFontSize(9.5).setVerticalAlignment('middle');
    sheet.setRowHeight(newRowIndex, 28);

    // Căn giữa các cột mã số, ID, CCCD, Status
    sheet.getRange(newRowIndex, 1).setHorizontalAlignment('center'); // Thời Gian
    
    // Cột 2: Số Vé May Mắn — Highlight nổi bật
    var ticketCell = sheet.getRange(newRowIndex, 2);
    ticketCell
      .setHorizontalAlignment('center')
      .setFontWeight('bold')
      .setFontSize(11)
      .setFontColor('#0A140F')
      .setBackground('#FBF5E8');

    sheet.getRange(newRowIndex, 4).setHorizontalAlignment('center'); // SĐT
    sheet.getRange(newRowIndex, 5).setHorizontalAlignment('center'); // CCCD
    
    // Cột 8: Trạng Thái Check-in
    var statusCell = sheet.getRange(newRowIndex, 8);
    statusCell.setHorizontalAlignment('center').setFontWeight('bold');
    var statusVal = String(rowData[7] || '').toUpperCase();
    if (statusVal === 'CONFIRMED' || statusVal === 'HỢP LỆ') {
      statusCell.setFontColor('#059669').setBackground('#ECFDF5'); // Emerald
    } else {
      statusCell.setFontColor('#DC2626').setBackground('#FEF2F2'); // Rose
    }

    // Cột kỹ thuật: Font monospace nhỏ gọn
    var techRange = sheet.getRange(newRowIndex, 10, 1, 4);
    techRange.setFontFamily('Consolas').setFontSize(8).setHorizontalAlignment('center').setFontColor('#6B7280');

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      rowNumber: newRowIndex,
      leadId: payload.leadId,
      receiptId: receiptId,
      ticketNumber: rowData[1]
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
 * 3. Đảm bảo dòng Header 14 cột chuẩn tồn tại
 */
function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS_14);
    formatHeaderRow(sheet);
  }
}

/**
 * 4. Định dạng Header chuẩn Gamuda Pine & Bronze Gold
 */
function formatHeaderRow(sheet) {
  var headerRange = sheet.getRange(1, 1, 1, 14);
  headerRange
    .setBackground('#0A140F')
    .setFontColor('#DECAA7')
    .setFontWeight('bold')
    .setFontFamily('Arial')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 40);
  applyColumnWidths(sheet);
}

/**
 * 5. Căn chỉnh độ rộng từng cột chuẩn responsive dễ đọc
 */
function applyColumnWidths(sheet) {
  var widths = [
    160, // Col 1: Thời Gian
    130, // Col 2: Số Vé May Mắn
    180, // Col 3: Họ Và Tên
    130, // Col 4: Số Điện Thoại
    130, // Col 5: CCCD (4 số cuối)
    180, // Col 6: Đại Lý / Sàn F1
    190, // Col 7: Email
    120, // Col 8: Trạng Thái
    130, // Col 9: Nguồn Đăng Ký
    150, // Col 10: Lead ID
    160, // Col 11: Biên Lai (Receipt ID)
    160, // Col 12: Meta Event ID
    130, // Col 13: Client IP
    200  // Col 14: Thiết Bị
  ];

  for (var i = 0; i < widths.length; i++) {
    sheet.setColumnWidth(i + 1, widths[i]);
  }
}

/**
 * 6. HÀM CHẠY 1-CLICK TẠI APPS SCRIPT EDITOR:
 * Tự động reset lại tiêu đề 14 cột, xóa cột thừa O -> Z, căn chỉnh styling đẹp mỹ mãn
 */
function setupSheetStyle() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  
  // Cập nhật dòng 1 với 14 cột mới
  sheet.getRange(1, 1, 1, 14).setValues([HEADERS_14]);
  formatHeaderRow(sheet);

  // Xóa các cột thừa từ cột 15 (O) trở đi nếu có
  var maxCols = sheet.getMaxColumns();
  if (maxCols > 14) {
    sheet.deleteColumns(15, maxCols - 14);
  }

  Logger.log('✅ Đã cập nhật thành công Google Sheet sang 14 cột chuẩn!');
}
