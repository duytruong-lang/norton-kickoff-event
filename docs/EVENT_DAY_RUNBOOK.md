# 🎪 SỔ TAY VẬN HÀNH BAN TỔ CHỨC (EVENT DAY RUNBOOK)
## The SYNC Show — Norton Park | Gamuda Land
> **Đơn vị tổ chức & triển khai kỹ thuật**: 1990 Agency  
> **Thời gian sự kiện**: 08.10.2026  
> **Địa điểm**: Rạp Xiếc Và Biểu Diễn Đa Năng Phú Thọ (Quận 11, TP.HCM)  
> **Quy mô**: 1.000 – 1.500 Chiến binh kinh doanh đại lý phân phối F1  
> **Hệ thống**: [Landing Page Check-in](https://norton-kickoff-event.vercel.app) | [Admin Cockpit](https://norton-kickoff-event.vercel.app/admin?secret=norton_admin_secret_2026) | [Google Sheet ERP](https://docs.google.com/spreadsheets/d/1IpfahCoOnvE5dc9JES9upMiBvW6l__Cx8X4aD2i3A28/edit)

---

## 1. TỔNG QUAN KIẾN TRÚC KỸ THUẬT

```
                       [ 1.000+ Sales Quét QR Tại Cổng ]
                                      │
                                      ▼
                        [ Vercel Edge Serverless ]
                        ├── /api/register (Atomic Gate & LPOP)
                        ├── /api/admin/config (Hot Button & Stats)
                        └── /api/admin/lookup (Dispute Verification)
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

- **Độ trễ xử lý**: Atomic LPOP cấp số chỉ mất **< 3.5ms** trên Redis Singapore. Tổng thời gian trả vé về điện thoại người dùng **< 150ms**.
- **Chống sập cổng**: Sử dụng Serverless mở rộng tức thì không giới hạn container.
- **Idempotency tuyệt đối**: Mỗi số điện thoại / CCCD chỉ được nhận đúng 1 số duy nhất trong suốt sự kiện. Quét lại (Replay) sẽ trả lại đúng mã vé cũ kèm cảnh báo.
- **Cơ chế Overflow tự động**: Khi vượt quá 1.000 vé trong kho, hệ thống tự động sinh dải vé dự phòng `NP-OVERFLOW-xxx` đảm bảo 100% không bao giờ bị nghẽn cổng tiếp nhận.

---

## 2. BẢNG THÔNG SỐ VẬN HÀNH & TRUY CẬP

| Hạng mục | Đường Dẫn / Thông Số | Ghi Chú |
|:---|:---|:---|
| **Landing Page Check-in** | `https://norton-kickoff-event.vercel.app` | Khách quét mã QR từ Standee tại cổng |
| **Admin Cockpit** | `https://norton-kickoff-event.vercel.app/admin?secret=norton_admin_secret_2026` | Dành riêng cho Ban Điều Hành BTC |
| **ADMIN_SECRET** | `norton_admin_secret_2026` | Mã khóa bảo mật quyền Admin |
| **Google Sheet ERP** | [Norton Park ERP Sheet](https://docs.google.com/spreadsheets/d/1IpfahCoOnvE5dc9JES9upMiBvW6l__Cx8X4aD2i3A28/edit) | 14 cột tinh gọn, cập nhật real-time |
| **Upstash Redis** | `sharp-jaguar-299380.upstash.io` | Cluster Singapore, SLA 99.99% |
| **Meta Pixel / Dataset** | `2534126040456364` | Chuẩn CAPI v22.0 EMQ 9.0+ |

---

## 3. CHECKLIST ĐIỀU HÀNH TRƯỚC GIỜ G (TIMELINE)

### T-120 phút (Tổng duyệt kỹ thuật)
- [ ] Mở **Admin Cockpit** trên điện thoại / iPad của Ban Điều Hành.
- [ ] Kiểm tra tình trạng kết nối: Đèn xanh `Live API` sáng ổn định.
- [ ] Kiểm tra số lượng vé trong pool: Đạt `1.500 vé` sẵn sàng (hoặc `1.000 vé`).
- [ ] Thực hiện 1 lượt check-in thử nghiệm trên máy test để xác nhận máy chủ chạy trơn tru.

### T-30 phút (Làm sạch dữ liệu trước giờ đón khách)
- [ ] Trên thanh công cụ Admin Cockpit, bấm nút **`Reset Số Đếm (0)`**.
- [ ] Xác nhận đưa `stats:total` về **0**. Kho vé may mắn được làm mới hoàn toàn.
- [ ] Mở Google Sheet ERP, kiểm tra dòng tiêu đề 14 cột đã thẳng hàng, sạch sẽ.

### T-15 phút (Mở cổng tiếp nhận khách)
- [ ] Bấm nút **`MỞ CỔNG CHECK-IN`** (Hot Button chuyển sang màu đỏ `ĐÓNG CỔNG`, đèn chuyển xanh `ĐANG MỞ CỔNG`).
- [ ] Thông báo cho đội lễ tân tại các Line check-in: Cổng tiếp nhận đã sẵn sàng.
- [ ] Quan sát đồng hồ counter `Tổng Đã Check-in` trên Admin Cockpit bắt đầu nhảy số khi khách quét mã.

### T+120 phút (Bắt đầu chương trình chính & Khóa sổ)
- [ ] Khi MC tuyên bố kết thúc phần đón khách, bấm **`ĐÓNG CỔNG`** trên Admin Cockpit.
- [ ] Hệ thống sẽ ngay lập tức khóa tiếp nhận (trả về 403 `GATE_CLOSED` cho mọi yêu cầu mới).
- [ ] Khóa sổ tổng số lượng chiến binh kinh doanh tham dự để báo cáo Ban Lãnh Đạo Gamuda Land.

---

## 4. HƯỚNG DẪN SỬ DỤNG MÀN HÌNH ADMIN COCKPIT

### 4.1. Nút Hot Button (Kiểm Soát Cổng Tiếp Nhận)
- **ĐANG ĐÓNG CỔNG (Màu Đỏ)**: Form trên Landing Page sẽ bị mờ và hiển thị thông báo *"Cổng check-in hiện đang đóng"*. Nút gửi bị vô hiệu hóa.
- **ĐANG MỞ CỔNG (Màu Xanh)**: Form mở hoàn toàn, tiếp nhận hàng trăm lượt scan/giây.
- *Lưu ý*: Khi bấm Đóng Cổng, hệ thống sẽ hiện hộp thoại xác nhận để tránh bấm nhầm.

### 4.2. Bộ Tứ Chỉ Số Vận Hành (KPI Matrix 2x2)
1. **Tổng Đã Check-in (`stats:total`)**: Số lượng khách thực tế đã quét QR và nhận vé.
2. **Còn Lại Trong Pool (`lucky:pool`)**: Số vé còn lại trong kho bốc thăm. Khi còn < 50 số sẽ tự động đổi màu cảnh báo đỏ.
3. **Quota Phát Hành**: Dung lượng vé ban đầu được nạp (1.000 hoặc 1.500 vé).
4. **Trạng Thái Cổng**: Trực quan hóa `LIVE (OPEN)` hoặc `CLOSED`.

### 4.3. Thanh Thao Tác Nhanh (Quick Actions)
- **Làm mới (3s)**: Chủ động đồng bộ số liệu từ Redis ngay lập tức không cần đợi chu kỳ polling.
- **Reset Số Đếm (0)**: Đưa số đếm check-in về 0 mà không làm ảnh hưởng đến các cấu hình khác (dùng trước giờ đón khách chính thức).
- **Làm Sạch DB (Nuclear Reset)**: Xóa toàn bộ dữ liệu đăng ký cũ, biên lai và khởi tạo lại kho vé mới toanh từ số #001 (Yêu cầu gõ chữ `XÓA HẾT` và tick chọn xác nhận để thực thi).

### 4.4. Tab 1: Tra Cứu & Đối Soát Tranh Chấp (Dispute Resolution)
Khi có tranh chấp vé hoặc kiểm tra đối soát nhận giải thưởng giá trị lớn:
1. Nhập **Số Điện Thoại**, **4 số cuối CCCD**, hoặc **Số Vé (#088)** vào ô tìm kiếm.
2. Bấm **Tra Cứu**:
   - **HỢP LỆ (Màu Xanh)**: Hiển thị đầy đủ Họ tên, SĐT, 4 số CCCD, Tên sàn F1, Mã biên lai (`Receipt ID`), Giờ cấp vé GMT+7, IP và chữ ký số HMAC-SHA256 chứng thực bởi Gamuda Land.
   - **CẢNH BÁO REPLAY (Màu Đỏ)**: Phát hiện khách quét lại nhiều lần. Hiển thị danh sách tất cả các lần quét và thời gian cụ thể.
   - **KHÔNG TÌM THẤY (Màu Cam)**: Thông tin chưa từng tồn tại trên hệ thống.

---

## 5. HƯỚNG DẪN QUẢN TRỊ BẢNG GOOGLE SHEET ERP 14 CỘT

Bảng tính Google Sheet được chia làm **2 phân khu trực quan**:

### Phân khu A: Vận Hành Sự Kiện (Cột A ➔ H)
*Hiển thị trọn vẹn trong 1 màn hình iPad / Laptop mà không cần cuộn ngang:*
- **Cột A (Thời Gian)**: Giờ check-in thực tế theo chuẩn giờ Việt Nam.
- **Cột B (Số Vé May Mắn)**: Mã số bốc thăm (#088, #105...) được **in đậm, font lớn, nền vàng nhạt** để MC dễ đọc khi quay số trúng thưởng.
- **Cột C (Họ Và Tên)**: Tên khách mời.
- **Cột D (Số Điện Thoại)**: Định dạng chuẩn `0908xxxxxx`.
- **Cột E (CCCD)**: Đã mask bảo mật `•••• •••• 8888` để đối chiếu thẻ căn cước công dân khi trao giải hiện vật giá trị lớn (xe hơi, xe máy, vàng).
- **Cột F (Đại Lý / Sàn F1)**: Tên đại lý để CĐT Gamuda Land kiểm quân và xếp hạng đại lý tham gia tích cực nhất.
- **Cột G (Email)**: Email của sales.
- **Cột H (Trạng Thái)**: `CONFIRMED` (Xanh lá) hoặc `REPLAYED` (Đỏ).

### Phân khu B: Kỹ Thuật & Audit Tracking (Cột I ➔ N)
- **Cột I (Nguồn Đăng Ký)**: Ghi nhận mã nguồn chiến dịch (`QR_STAND`, `ZALO`...).
- **Cột J (Lead ID)** & **Cột K (Receipt ID)**: Khóa đối soát bảo mật HMAC.
- **Cột L (Meta Event ID)**: Khóa deduplication CAPI v22.0.
- **Cột M (Client IP)** & **Cột N (Thiết Bị)**: Lưu vết thiết bị và địa chỉ IP.

---

## 6. QUY TRÌNH XỬ LÝ TÌNH HUỐNG KHẨN CẤP (CONTINGENCY SOP)

### Tình huống 1: Lượng khách vượt quá 1.000 vé dự kiến
- **Hiện tượng**: Số lượng khách đến đông hơn dự kiến, kho vé trong pool sắp cạn (<50 vé).
- **Xử lý**: 
  - **Tự động 100%**: Hệ thống tự động chuyển sang cơ chế Overflow, cấp dải số `NP-OVERFLOW-001`, `NP-OVERFLOW-002`... đảm bảo **không bao giờ có bất kỳ khách nào bị từ chối cấp vé**.
  - **Chủ động nâng quota**: Quản trị viên có thể vào Admin Cockpit ➔ Tab Cài Đặt & Pool ➔ Chọn preset `1,500 vé` hoặc `2,000 vé` ➔ Bấm Khởi tạo lại pool số (nếu muốn mở rộng dải số chính thức).

### Tình huống 2: Hai người nhận cùng 1 số vé may mắn (Tranh chấp giải thưởng)
- **Xử lý**:
  1. Ban tổ chức mời 2 người vào bàn điều hành, mở Admin Cockpit ➔ Tab **Tra Cứu Vé**.
  2. Nhập số vé hoặc số điện thoại của cả 2 bên.
  3. Bấm mở chi tiết **Biên lai số & Chữ ký HMAC**:
     - Xem trường **Thời gian cấp** (chính xác đến từng mili-giây).
     - Xem cờ **Replay**: Người check-in đầu tiên sẽ có cờ `isReplay: false` (chính chủ), người quét sau sẽ có cờ `isReplay: true` (trùng lặp).
     - Đối chiếu **4 số cuối CCCD** trên thẻ căn cước vật lý của khách với trường `CCCD` trên biên lai máy chủ.
  4. Đưa ra phán quyết minh bạch, có bằng chứng kỹ thuật không thể làm giả.

### Tình huống 3: Mất sóng 4G/Wifi cục bộ tại hội trường
- **Hiện tượng**: Khách quét mã nhưng mạng chập chờn, vòng xoay loading quay mãi.
- **Cơ chế an toàn**: Form trên landing page có cơ chế **Timeout nghiêm ngặt 8 giây (AbortController)**. Sau 8s nếu không kết nối được máy chủ, form sẽ giữ nguyên thông tin đã nhập và hiển thị nút *"Thử lại ngay ↻"*. Hệ thống tuyệt đối không cấp số giả phía client. Khách chỉ cần bấm thử lại là thành công khi mạng hồi phục.

---

*Tài liệu được biên soạn và bảo chứng kỹ thuật bởi Đội ngũ Giải pháp Kỹ thuật 1990 Agency.*
