# Norton Park — The SYNC Show | Sales Kick-off Check-in & Lucky Draw System

> **Khách hàng**: Gamuda Land  
> **Dự án**: The SYNC Show — Norton Park  
> **Đơn vị phát triển & bảo chứng kỹ thuật**: 1990 Agency  
> **Thời gian sự kiện**: 08.10.2026 tại Rạp Xiếc Và Biểu Diễn Đa Năng Phú Thọ, TP.HCM  
> **Production URL**: [https://norton-kickoff-event.vercel.app](https://norton-kickoff-event.vercel.app)  
> **Admin Cockpit**: [https://norton-kickoff-event.vercel.app/admin](https://norton-kickoff-event.vercel.app/admin?secret=norton_admin_secret_2026)  
> **Google Sheet ERP**: [Norton Park ERP Sheet](https://docs.google.com/spreadsheets/d/1IpfahCoOnvE5dc9JES9upMiBvW6l__Cx8X4aD2i3A28/edit)

---

## 🌟 Tổng Quan Hệ Thống

Hệ thống tiếp nhận check-in, cấp số may mắn bốc thăm (Lucky Draw) và đối soát tranh chấp thời gian thực chuẩn quốc tế dành cho sự kiện 1.000+ người:

1. **Hiệu năng cao**: Cấp phát số vé may mắn $O(1)$ chỉ mất **< 3.5ms** qua Redis Atomic LPOP. Trả vé về điện thoại người dùng dưới **150ms**.
2. **Idempotency 100%**: Mỗi số điện thoại / CCCD chỉ được cấp đúng 1 vé duy nhất. Quét lại (Replay) sẽ trả lại mã vé cũ cùng cảnh báo bảo mật.
3. **Dual-Tracking Tự Động**: Đồng bộ song song Meta Conversions API (CAPI v22.0) đạt điểm **EMQ 9.0+** và Google Sheets ERP 14 cột tinh gọn.
4. **Admin Mobile Cockpit**: Bảng điều hành dành cho Ban Tổ Chức trên điện thoại di động: Đóng/Mở cổng tiếp nhận (Hot Button), xem live stats, Reset số đếm, Seed pool vé và tra cứu đối soát vé tranh chấp.
5. **Cơ chế Overflow tự động**: Khi vượt quá 1.000 vé trong kho, hệ thống tự động sinh dải vé dự phòng `NP-OVERFLOW-xxx` đảm bảo 100% không bao giờ bị nghẽn cổng tiếp nhận.

---

## 🏗️ Kiến Trúc Hạ Tầng (Architecture)

```
                       [ 1.000+ Sales Quét QR Tại Cổng ]
                                      │
                                      ▼
                        [ Vercel Edge Serverless ]
                        ├── /api/register (Atomic Gate & LPOP)
                        ├── /api/admin/config (Hot Button & Stats)
                        ├── /api/admin/lookup (Dispute Verification)
                        └── /api/ip (Edge Geolocation Client IP)
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
   [ Upstash Redis SG ]       [ Meta CAPI v22.0 ]     [ Google Sheets ERP ]
   • lucky:pool (Atomic)      • Multi-hash Phone       • 14 Cột Tinh Gọn
   • reg:phone:* (Idempotent) • external_id Array      • Webhook LockService
   • stats:total (Counter)    • Geo Hashing (ct, vn)   • Highlight Vé May Mắn
   • receipt:* (HMAC SHA-256) • EMQ Score 9.0+         • Idempotency Col 11
   • audit:log (Dispute Stream)
```

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
├── api/
│   ├── register.js               # API tiếp nhận check-in & cấp số atomic
│   ├── ip.js                     # API lấy IP & Geo từ Vercel edge headers
│   └── admin/
│       ├── config.js             # API điều khiển cổng, stats, reset, seed pool
│       └── lookup.js             # API tra cứu hồ sơ & biên lai đối soát tranh chấp
├── lib/
│   ├── redis.js                  # Upstash Redis client + fallback file-based engine
│   ├── capi.js                   # Meta CAPI v22.0 Lead dispatcher (EMQ 9.0+)
│   ├── sheets.js                 # Google Sheets ERP 14-column formatter & webhook
│   ├── helpers.js                # Chuẩn hóa SĐT VN, tách họ tên, băm SHA-256
│   └── audit.js                  # Lưu biên lai máy chủ & chữ ký HMAC SHA-256
├── docs/
│   └── EVENT_DAY_RUNBOOK.md      # Sổ tay vận hành chi tiết cho Ban Tổ Chức ngày sự kiện
├── scripts/
│   ├── google-apps-script-webhook.js # Mã nguồn Google Apps Script Webhook v2.0
│   ├── test-scenarios.js         # Test suite tự động 7 kịch bản kiểm thử
│   ├── seed-pool.js              # Script khởi tạo kho vé
│   └── reconcile-sheets.js       # Script backfill dữ liệu Redis -> Google Sheets
├── tasks/
│   └── lessons.md                # Sổ tay bài học kinh nghiệm kỹ thuật (Self-Improvement)
├── index.html                    # Landing page check-in chính (Brand Biophilic Gamuda)
├── admin.html                    # Trung tâm điều hành BTC (Mobile First Cockpit)
├── vercel.json                   # Cấu hình Vercel Serverless & rewrite rules
└── package.json                  # Dependencies: @upstash/redis, crypto-js, dotenv
```

---

## 📊 Bảng 14 Cột Chuẩn Google Sheets ERP

Bảng tính Google Sheet được chia làm **2 phân khu trực quan**:

| Cột | Tên Tiêu Đề | Phân Khu | Mục Đích |
|:---:|:---|:---:|:---|
| **A** | `Thời Gian` | Vận Hành | Giờ check-in GMT+7 |
| **B** | `Số Vé May Mắn` | Vận Hành | Highlight đậm (#088, NP-2026-xxx) cho MC bốc thăm |
| **C** | `Họ Và Tên` | Vận Hành | Họ tên người tham dự để xướng tên trao giải |
| **D** | `Số Điện Thoại` | Vận Hành | Chuẩn hóa `0908xxxxxx` để liên hệ |
| **E** | `CCCD (4 số cuối)` | Vận Hành | Mask `•••• •••• 8888` đối chiếu căn cước |
| **F** | `Đại Lý / Sàn F1` | Vận Hành | Tên sàn F1 (ERA, CBRE, Southern Homes...) |
| **G** | `Email` | Vận Hành | Email liên hệ |
| **H** | `Trạng Thái` | Vận Hành | `CONFIRMED` (Xanh) hoặc `REPLAYED` (Đỏ) |
| **I** | `Nguồn Đăng Ký` | Kỹ Thuật | UTM Source (`QR_STAND`, `ZALO`...) |
| **J** | `Lead ID` | Kỹ Thuật | Khóa hồ sơ định danh |
| **K** | `Biên Lai (Receipt ID)` | Kỹ Thuật | Khóa tra cứu HMAC trên màn hình Admin |
| **L** | `Meta Event ID` | Kỹ Thuật | Khóa đối soát Deduplication CAPI |
| **M** | `Client IP` | Kỹ Thuật | IP máy khách phục vụ đối soát gian lận |
| **N** | `Thiết Bị` | Kỹ Thuật | Chuỗi User Agent rút gọn |

---

## 🔑 Biến Môi Trường (Environment Variables)

Các biến cấu hình trong `.env.local` và cài đặt trên Vercel:

```env
UPSTASH_REDIS_REST_URL="https://sharp-jaguar-299380.upstash.io"
UPSTASH_REDIS_REST_TOKEN="gQAAAAAABJF0AAIgcDEzNDY0YzcwMTM2NzY0NjVhOGQyNWRjYmI3NzI5YWQyMQ"
ADMIN_SECRET="norton_admin_secret_2026"
NODE_ENV="production"
META_PIXEL_ID="2534126040456364"
META_CAPI_ACCESS_TOKEN="EAALkiCQCZBt4BSsqdz..."
GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/AKfycby3F4TjC-ev8aXNjXKYtz8Pg1F_uGs-9AkaUHnTa6Drdx62ZzE-_sfSpeS-_TyfBfXH/exec"
EVENT_SOURCE_URL="https://norton-kickoff-event.vercel.app"
```

---

## 🛠️ Hướng Dẫn Vận Hành & Khởi Chạy

### Chạy Local Development
```bash
# 1. Cài đặt packages
npm install

# 2. Khởi chạy server local
npx vercel dev
# Hoặc: python3 -m http.server 3000
```

### Chạy Test Suite Tự Động (7 Scenarios)
```bash
node scripts/test-scenarios.js
```

### Chi Tiết Vận Hành Ngày Sự Kiện
Vui lòng tham khảo sổ tay vận hành hoàn chỉnh tại:  
👉 **[docs/EVENT_DAY_RUNBOOK.md](docs/EVENT_DAY_RUNBOOK.md)**

---

*© 2026 1990 Agency — Performance & Experience Solutions.*
