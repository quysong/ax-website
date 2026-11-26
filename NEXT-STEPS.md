# Tiếp tục tối ưu website thiệp cưới

Các việc cần tiếp tục ở phiên làm việc sau:

1. **Đã xử lý — tăng cỡ chữ:** rà soát giao diện, nâng các chữ nhỏ lên tối thiểu 13px; kiểm tra bố cục mobile sau khi chỉnh.
2. **Đã xử lý — đổi font nội dung dài:** thay Be Vietnam Pro bằng Noto Sans; giữ Caveat và Cormorant Garamond cho các kiểu chữ trang trí/tiêu đề.
3. **Trang quản trị ảnh và Vercel Blob:**
   - Quản lý 6 vị trí ảnh tại `/admin`; upload trực tiếp lên Blob qua token giới hạn do Vercel Function cấp sau khi xác thực mật khẩu admin.
   - Ảnh được nén thành WebP phía trình duyệt; website lấy URL mới nhất từ Blob qua endpoint công khai đã cache.
   - Cần tạo public Blob store, kết nối với project và cấu hình `BLOB_READ_WRITE_TOKEN` cùng `ADMIN_PASSWORD` trong Vercel trước khi dùng production.

## Trạng thái hiện tại

- Dự án dùng React, TypeScript, Vite, prerender SSG và triển khai static trên Vercel.
- `.env` được Git ignore; không commit giá trị biến môi trường.

## Kế hoạch demo tiếp theo — gallery và hoạt cảnh chào

Trang hiện có section `#gallery` với 3 ảnh tĩnh (`gallery-1` đến `gallery-3`), tiếp theo là RSVP và footer. Ưu tiên nâng cấp section này thay vì thêm một gallery trùng lặp; như vậy có thể dùng lại ảnh, admin và Blob hiện tại.

### 1. Gallery dạng slideshow

- Dùng 3 ảnh gallery hiện có làm các slide đầu tiên, giữ phong cách scrapbook/pastel của thiệp.
- Thêm nút trước/sau và chỉ báo slide; hỗ trợ bàn phím, thao tác chạm trên mobile, nhãn truy cập cho screen reader.
- Giữ khung ảnh ổn định để tránh layout shift; ảnh tải lazy khi cần.
- Demo mặc định chuyển ảnh thủ công. Bàn thêm autoplay và số lượng ảnh trước khi mở rộng slot trong admin.

### 2. Hoạt cảnh cô dâu chú rể ở cuối trang

- Đặt cảnh gần cuối — sau RSVP, trước footer — như lời chào/tạm biệt khách.
- Demo cảnh ngôi nhà mở cửa, cô dâu chú rể bước ra rồi cúi chào hoặc vẫy tay; chốt cử chỉ và tạo hình trong buổi demo.
- Ưu tiên minh họa SVG/CSS nhẹ, không thêm thư viện animation hoặc tải asset lớn; có trạng thái tĩnh thân thiện với `prefers-reduced-motion`.
- Giữ hoạt cảnh trang trí, không che nội dung hay làm chậm thao tác RSVP.

### Tiêu chí kiểm tra demo

- Xem được trên desktop và mobile; slideshow điều khiển được bằng chuột, chạm và bàn phím.
- Tôn trọng cài đặt giảm chuyển động, không gây tràn ngang hoặc nhảy bố cục.
- Chạy `npm run build` để xác nhận vẫn prerender/SSG thành công.
