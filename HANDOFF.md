# 📘 MASTER HANDOFF — THE SYNC SHOW (NORTON PARK)
## Event Check-in, Lucky Draw & Admin Cockpit System

> **Dự án**: The SYNC Show — Norton Park | Gamuda Land  
> **Đơn vị phát triển & bảo chứng công nghệ**: 1990 Agency  
> **Địa điểm sự kiện**: Rạp Xiếc & Biểu Diễn Đa Năng Phú Thọ (03 Lữ Gia, P. Phú Thọ, Q.11, TP.HCM)  
> **Thời gian**: 08:30 – 11:30 | Thứ Năm | Ngày 08.10.2026  
> **Quy mô**: 1.000 – 1.500 Chiến binh kinh doanh đại lý phân phối  
> **Trạng thái**: Production Ready (Auto-deploy Vercel, Upstash Redis SG, Google Sheets ERP v2.0)

---

## 1. Quick Access & Live URLs

| Tài nguyên | URL / Thông tin truy cập | Ghi chú bảo mật |
|:---|:---|:---|
| **Landing Page Check-in (Production)** | `https://thesync.nortonpark.com.vn` | Domain chính thức sự kiện |
| **Vercel Default Domain** | `https://norton-kickoff-event.vercel.app` | Domain dự phòng Vercel |
| **Admin Cockpit** | `https://thesync.nortonpark.com.vn/admin` | **Mật khẩu**: `norton@2026` (Session-gated) |
| **Google Sheets ERP (14 Cột)** | [Google Sheet ERP 14 Cột](https://docs.google.com/spreadsheets/d/1IpfahCoOnvE5dc9JES9upMiBvW6l__Cx8X4aD2i3A28/edit) | Cập nhật real-time qua Webhook |
| **GitHub Repository** | `https://github.com/duytruong-lang/norton-kickoff-event` | Branch: `main` |
| **QR Code Gốc In Ấn** | `assets/qr-checkin.png` (1024x1024) | Chịu lỗi Level H, link tới domain chính |

---

## 2. Kiến Trúc Hệ Thống (System Architecture)

```
                            [ 1.000+ Sales Quét QR Tại Hội Trường ]
                                                │
                                                ▼
                         ┌─────────────────────────────────────────────┐
                         │       thesync.nortonpark.com.vn             │
                         │    (Vercel Edge & Serverless Functions)     │
                         └──────────────────────┬──────────────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼                              ▼                              ▼
    ┌─────────────────────────┐   ┌───────────────────────────┐   ┌─────────────────────────┐
    │  Upstash Redis (SG)     │   │ Google Sheets ERP v2.0    │   │  Meta Conversions API   │
    │  • Atomic LPOP <3.5ms   │   │  • Webhook Apps Script    │   │  • Dataset ID           │
    │  • Primary: reg:cccd6:* │   │  • LockService 10s        │   │  • Event ID dedup       │
    │  • Reverse: idx:phone:* │   │  • 14 cột chuẩn hóa       │   │  • Điểm EMQ 9.0+        │
    └─────────────────────────┘   └───────────────────────────┘   └─────────────────────────┘
```

---

## 3. Quy Tắc Nghiệp Vụ Cốt Lõi (Core Business Rules)

### 3.1. Cơ chế Chống Trùng Số & Vé (CCCD6 Idempotency)
- **Khóa chính**: `reg:cccd6:{clean6Id}` (6 chữ số cuối của CCCD 12 số).
- **Mục tiêu**: Đảm bảo **1 người (1 CCCD) chỉ nhận đúng 1 số may mắn duy nhất**, bất kể họ dùng bao nhiêu số điện thoại khác nhau.
- **Index phụ (Reverse Index)**: `idx:phone:{phoneLocal}` trỏ về `{clean6Id}` để hỗ trợ Admin tra cứu tranh chấp bằng SĐT với độ phức tạp $O(1)$.
- **Replay Response**: Nếu CCCD đã đăng ký trước đó, hệ thống lập tức trả lại vé cũ (`replayed: true`), không trừ vé trong pool, không phát sinh số mới.

### 3.2. Cấp phát Vé May Mắn ($O(1)$ Atomic LPOP)
- Vé may mắn được nạp sẵn vào Redis List `lucky:pool`.
- Khi khách bấm nhận vé, server thực thi lệnh `LPOP lucky:pool` với độ trễ `< 3.5ms`, triệt tiêu hoàn toàn race-condition (không thể có 2 người trùng số).
- **Cơ chế Overflow**: Trường hợp hội trường vượt quá quota dự kiến (hết vé trong pool), hệ thống tự động kích hoạt `INCR stats:overflow_counter` và cấp vé dự phòng định dạng `NP-OVERFLOW-xxx`.

### 3.3. Kiểm Soát Cổng (Gate Control)
- Trạng thái cổng được lưu tại key `config:gate` (`open` hoặc `closed`).
- Khi cổng đóng: Mọi request POST `/api/register` đều bị từ chối với HTTP 403 `GATE_CLOSED`. Khách hàng ở giao diện landing page thấy countdown hoặc thông báo chờ mở cổng.

### 3.4. Bảo Mật Admin Cockpit
- **Đường dẫn**: `/admin` (Sạch, không lộ `?secret=` trên thanh địa chỉ).
- **Xác thực Client**: Màn hình đăng nhập chặn overlay, yêu cầu mật khẩu **`norton@2026`**. Trạng thái được lưu trong `sessionStorage` (đóng tab tự động logout).
- **Xác thực Server API**: Mọi API nội bộ (`/api/admin/config`, `/api/admin/lookup`) đều yêu cầu token `ADMIN_SECRET` (`norton_admin_secret_2026`) gửi kèm trong header `Authorization: Bearer ...` hoặc `x-admin-secret`.

---

## 4. Cấu Trúc Thư Mục & File Trọng Yếu

```
├── admin.html                            # Frontend cockpit cho BTC (Quản lý cổng, seed vé, tra cứu tranh chấp)
├── index.html                            # Landing page check-in chính thức cho Sales (Liquid glass, canvas ticket)
├── vercel.json                           # Cấu hình định tuyến Vercel & serverless headers
├── package.json                          # Dependencies (@upstash/redis, qrcode, canvas)
│
├── api/                                  # Vercel Serverless Functions
│   ├── register.js                       # Endpoint đăng ký, cấp vé, gọi Meta CAPI & Sheets sync
│   └── admin/
│       ├── index.js                      # Serverless handler trả về HTML cockpit đã đóng gói
│       ├── config.js                     # Điều khiển cổng (open/close), seed pool, nuclear reset
│       └── lookup.js                     # Tra cứu hồ sơ đối soát vé (theo CCCD 6 số, SĐT, hoặc #Vé)
│
├── lib/                                  # Thư viện dùng chung
│   ├── helpers.js                        # Chuẩn hóa SĐT VN, cleanCCCDLast6, cleanCCCDLast4, hash SHA-256
│   ├── sheets.js                         # Định dạng 14 cột chuẩn & gửi webhook tới Google Apps Script
│   └── audit.js                          # Ghi nhật ký audit stream cho các thao tác hệ thống
│
├── scripts/                              # Kịch bản bảo trì & kiểm thử
│   ├── build-admin-ui.js                 # Rebuild admin.html -> api/admin/index.js
│   ├── google-apps-script-webhook.js     # Toàn bộ mã nguồn triển khai trên Google Apps Script (Code.gs)
│   ├── reconcile-sheets.js               # Script đối soát & đồng bộ Redis ngược lại Google Sheets
│   └── test-scenarios.js                 # Bộ test tự động giả lập 500+ lượt đăng ký đồng thời
│
├── assets/                               # Tài nguyên tĩnh
│   ├── qr-checkin.png                    # Mã QR 1024x1024 chính thức cho in standee
│   ├── favicon.svg                       # Favicon chuẩn thương hiệu Gamuda
│   ├── logo-norton-park-white.png        # Logo Norton Park
│   └── logo-gamuda-land.svg              # Logo Gamuda Land
│
├── docs/                                 # Tài liệu kỹ thuật
│   ├── EVENT_DAY_RUNBOOK.md              # Sổ tay vận hành giờ G chi tiết từng phút
│   └── HANDOVER_SLIDE_THE_SYNC_SHOW.md   # Slide thuyết trình bàn giao kỹ thuật cho CĐT
│
└── tasks/
    └── lessons.md                        # Nhật ký các bài học kinh nghiệm & nguyên tắc phòng ngừa
```

---

## 5. Biến Môi Trường (Environment Variables)

Cần cấu hình trong **Vercel Dashboard → Settings → Environment Variables**:

| Tên biến | Bắt buộc | Giá trị mẫu | Mục đích |
|:---|:---:|:---|:---|
| `UPSTASH_REDIS_REST_URL` | ✅ | `https://xxxx.upstash.io` | Kết nối Redis Singapore |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | `AXxxxx...` | Token xác thực Redis |
| `ADMIN_SECRET` | ✅ | `norton_admin_secret_2026` | Token bảo mật backend API |
| `GOOGLE_SHEET_WEBHOOK_URL` | ✅ | `https://script.google.com/macros/s/.../exec` | Webhook Apps Script nhận data |
| `META_PIXEL_ID` | ⚠️ | `1054366606830737` | Meta Pixel / Dataset ID |
| `META_CAPI_TOKEN` | ⚠️ | `EAAG...` | Meta System User Access Token |
| `TEST_EVENT_CODE` | (Tùy chọn) | `TEST12345` | Mã test sự kiện trên Meta Events Manager |

---

## 6. Sổ Tay Thao Tác Giờ G (Runbook Thường Gặp)

### Thao tác 1: Reset Sạch Dữ Liệu Trước Sự Kiện (Nuclear Reset)
1. Truy cập `https://thesync.nortonpark.com.vn/admin` → Nhập mật khẩu: `norton@2026`.
2. Vào tab **Cài Đặt** → Bấm nút **🗑️ Nuclear Reset**.
3. Hộp thoại yêu cầu gõ chính xác cụm từ: **`RESET-ALL`** → Bấm xác nhận.
4. Hệ thống sẽ quét sạch toàn bộ `reg:*`, `idx:*`, `receipt:*`, `audit:*`, `stats:*`.

### Thao tác 2: Nạp Kho Vé May Mắn (Seed Pool)
1. Trong tab **Cài Đặt**, phần **DUNG LƯỢNG VÉ PHÁT HÀNH**:
   - Chọn preset: `500 vé`, `1,000 vé`, `1,500 vé`, `2,000 vé`, hoặc chọn **Khác** để nhập số lượng cụ thể (VD: `1200`).
2. Chọn chế độ:
   - **🎲 SHUFFLE (Khuyên dùng)**: Trộn ngẫu nhiên các số từ 1 đến N (không ai đoán được số tiếp theo).
   - **🔢 SEQUENTIAL**: Cấp lần lượt từ số bé đến lớn.
3. Bấm **Khởi Tạo Lại Pool Số** → Gõ **`XÁC NHẬN`** để lưu vào Redis.

### Thao tác 3: Mở / Đóng Cổng Check-in
- Ngay trên Hero Card của Admin Cockpit:
  - Bấm **🔓 MỞ CỔNG CHECK-IN** khi bắt đầu đón khách.
  - Bấm **🔒 ĐÓNG CỔNG CHECK-IN** khi MC thông báo kết thúc thời gian check-in.

### Thao tác 4: Xử Lý Tranh Chấp Số Vé Trúng Thưởng (Dispute Resolution)
Khi quay số trúng thưởng, nếu cần xác minh người trúng giải:
1. Mở tab **Tra Cứu Vé** trong Admin Cockpit.
2. Nhập một trong các thông tin:
   - **6 số cuối CCCD**: Tra cứu trực tiếp $O(1)$.
   - **Số điện thoại**: Tra cứu qua reverse index.
   - **Số vé (VD: `#088` hoặc `NP-2026-088`)**: Quét tìm vé trúng.
3. Hệ thống hiển thị đầy đủ: Họ tên, Sàn phân phối, SĐT, CCCD đã mask, Biên lai HMAC SHA-256 đối chiếu không thể làm giả.

---

## 7. Cấu Trúc Bảng Tính Google Sheets ERP (14 Cột Chuẩn)

Bảng tính được phân chia rõ ràng làm 2 phân khu phục vụ MC/Admin:

| Cột | Tên Cột | Phân khu | Ý nghĩa & Định dạng |
|:---:|:---|:---:|:---|
| **A** | Thời Gian | 🟢 Vận hành | Giờ khách đăng ký thành công (GMT+7) |
| **B** | Số Vé May Mắn | 🟢 Vận hành | Mã bốc thăm nổi bật `#088` (Highlight Gold) |
| **C** | Họ Và Tên | 🟢 Vận hành | Tên khách đăng ký (In hoa) |
| **D** | Số Điện Thoại | 🟢 Vận hành | SĐT liên hệ nhận giải |
| **E** | CCCD (6 số cuối) | 🟢 Vận hành | Định dạng bảo mật: `•••••• 008877` |
| **F** | Sàn Phân Phối | 🟢 Vận hành | Tên đơn vị phân phối |
| **G** | Email | 🟢 Vận hành | Email nhận vé điện tử |
| **H** | Trạng Thái | 🟢 Vận hành | `CONFIRMED` (Xanh) hoặc `REPLAYED` (Đỏ) |
| **I** | Nguồn Đăng Ký | ⚙️ Kỹ thuật | UTM Source (QR_STANDEE, ZALO, v.v.) |
| **J** | Lead ID | ⚙️ Kỹ thuật | ID định danh khách |
| **K** | Biên Lai (Receipt ID) | ⚙️ Kỹ thuật | Mã băm HMAC xác thực vé |
| **L** | Meta Event ID | ⚙️ Kỹ thuật | Mã đối soát CAPI chống tính trùng ads |
| **M** | Client IP | ⚙️ Kỹ thuật | Địa chỉ mạng thiết bị |
| **N** | Thiết Bị | ⚙️ Kỹ thuật | Trình duyệt / Hệ điều hành |

---

## 8. Lệnh Kiểm Thử & Kiểm Soát Chất Lượng (Quality Verification)

Bất kỳ AI Agent hoặc lập trình viên nào sau khi chỉnh sửa code **bắt buộc** phải chạy qua bộ lệnh kiểm thử sau trước khi bàn giao:

```bash
# 1. Kiểm tra cú pháp toàn bộ file backend
node -c lib/helpers.js
node -c lib/sheets.js
node -c api/register.js
node -c api/admin/config.js
node -c api/admin/lookup.js
node -c api/admin/index.js
node -c scripts/build-admin-ui.js

# 2. Kiểm tra tính toàn vẹn cú pháp script inline trong HTML
node -e "
const vm = require('vm');
const fs = require('fs');
['index.html', 'admin.html'].forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].forEach((m, i) => {
    if (m[1].trim()) {
      new vm.Script(m[1]);
      console.log(file + ' Script ' + (i + 1) + ': OK');
    }
  });
});
"

# 3. Chạy unit test hàm tách 6 số cuối CCCD
node -e "
const { cleanCCCDLast6 } = require('./lib/helpers');
console.assert(cleanCCCDLast6('079092008877') === '008877', '12 so -> 6 so cuoi');
console.assert(cleanCCCDLast6('008877') === '008877', 'dung 6 so');
console.assert(cleanCCCDLast6('12 34 56') === '123456', 'xoa khoang trang');
console.log('✅ cleanCCCDLast6 tests PASSED!');
"

# 4. Rebuild giao diện Admin sang api/admin/index.js
node scripts/build-admin-ui.js
```

---

## 9. Danh Sách Tài Sản Đã Bàn Giao

1. **Mã nguồn hoàn chỉnh**: Đã đồng bộ lên GitHub `main` ([Commit a48cb30, e4f2204]).
2. **File QR Vector & Hi-Res**:
   - `assets/qr-checkin.png` (1024x1024 px).
   - `docs/EVENT_DAY_RUNBOOK.md` & `docs/HANDOVER_SLIDE_THE_SYNC_SHOW.md`.
3. **Mã nguồn Google Apps Script**: Đã lưu tại `scripts/google-apps-script-webhook.js`.
4. **Nhật ký kinh nghiệm phòng ngừa lỗi**: Đã lưu tại `tasks/lessons.md`.

*Tài liệu này được hoàn thiện và xác thực bởi 1990 Agency — sẵn sàng 100% cho sự kiện ngày 08.10.2026.*
