# Norton Park — Sales Kick-off Check-in & Lucky Draw Demo

Ứng dụng web tương tác phục vụ sự kiện **Sales Kick-off Norton Park** (Gamuda Land), phát triển bởi **1990 Agency**.

---

## 🌟 Tổng Quan Dự Án

- **Dự án**: Norton Park (Gamuda Land)
- **Hạng mục**: Interactive Check-in & Lucky Draw Experience Web App
- **Đơn vị thực hiện**: 1990 Agency
- **Trọng tâm trải nghiệm**: Sang trọng, mượt mà, tối ưu hóa cho màn hình di động & tablet sự kiện, tạo vé tham dự độc bản có mã QR và xuất ảnh vé chuẩn Retina sắc nét.

---

## 🎨 Thông Số Brand Identity

| Thuộc tính | Giá trị & Đặc điểm |
|---|---|
| **Màu chủ đạo (Primary)** | Dark Pine (`#5D614F`) |
| **Màu điểm nhấn (Accent)** | Champagne Bronze (`#A78061`) |
| **Màu nền (Background)** | Kem ấm / Giấy mỹ thuật (`#F7F5F0`) & Xanh rêu trầm sang trọng |
| **Typography** | SVN-The Seasons (Serif cổ điển quý phái) & Inter / SF Pro (Sans-serif hiện đại, dễ đọc) |
| **Motif đồ họa** | Hoa dầu đặc trưng Norton Park, hoa văn viền vàng hoàng gia, tem crest dập nổi |

---

## ⚡ Tính Năng Demo Nổi Bật

1. **Check-in & Cá nhân hóa vé**:
   - Nhập thông tin khách mời / chiến binh kinh doanh (Họ tên, SĐT, Đại lý phân phối).
   - Tự động sinh mã vé cá nhân hóa kèm mã QR check-in & số may mắn (Lucky Draw).
2. **Nút "Điền nhanh" (Autofill Testing)**:
   - Hỗ trợ ban tổ chức / ban giám đốc test nhanh luồng check-in chỉ với 1 chạm.
3. **Reset trải nghiệm linh hoạt**:
   - Nhấn phím `Esc` trên bàn phím hoặc click trực tiếp vào biểu tượng crest / logo trên đầu trang để reset lại trạng thái ban đầu.
4. **Xuất ảnh vé Retina (Canvas Rendering)**:
   - Render vé điện tử với độ phân giải cao (2x-3x Retina scale), tải về điện thoại ngay lập tức để lưu trữ hoặc check-in tại cổng sự kiện.
5. **Hiệu ứng âm thanh & hình ảnh cao cấp**:
   - Confetti ăn mừng, ticket tear/stamp animation, micro-interactions mượt mà 60fps.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Local

Do dự án là ứng dụng web tĩnh hiện đại (Vanilla HTML5 / CSS3 / JS ES6+), không phụ thuộc build step phức tạp:

### Cách 1: Sử dụng Live Server hoặc HTTP Server
```bash
# Sử dụng bun x serve
bun x serve .

# Hoặc sử dụng npx serve
npx serve .

# Hoặc sử dụng Python built-in server
python3 -m http.server 3000
```
Truy cập: `http://localhost:3000`

### Cách 2: Mở trực tiếp
Mở file `index.html` trực tiếp trên bất kỳ trình duyệt web hiện đại nào (Chrome, Safari, Edge, Firefox).

---

## 🌐 Triển Khai (Deployment)

Dự án được triển khai trên nền tảng **Vercel** với:
- CDN toàn cầu, TTFB < 50ms.
- Clean URLs và Security Headers chuẩn.
- Cache bất biến (immutable cache) cho toàn bộ web font và graphic assets.

---

*© 2026 1990 Agency — Performance & Experience Solutions.*
