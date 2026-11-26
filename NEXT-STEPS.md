# Tiếp tục tối ưu website thiệp cưới

Các việc cần tiếp tục ở phiên làm việc sau:

1. **Đã xử lý — tăng cỡ chữ:** rà soát giao diện, nâng các chữ nhỏ lên tối thiểu 13px; kiểm tra bố cục mobile sau khi chỉnh.
2. **Đã xử lý — đổi font nội dung dài:** thay Be Vietnam Pro bằng Noto Sans; giữ Caveat và Cormorant Garamond cho các kiểu chữ trang trí/tiêu đề.
3. **Trang quản trị ảnh và Vercel Blob:**
   - Quản lý 6 vị trí ảnh tại `/admin`; upload trực tiếp lên Blob qua token giới hạn do Vercel Function cấp sau khi xác thực mật khẩu admin.
   - Ảnh được nén thành WebP phía trình duyệt; website lấy URL mới nhất từ Blob qua endpoint công khai đã cache.
   - Blob store đã tạo và biến môi trường local đã cấu hình; trước khi dùng production, xác minh store là public và project Vercel có `BLOB_READ_WRITE_TOKEN` cùng `ADMIN_PASSWORD`.
   - Các import ESM của API vừa được sửa để thêm đuôi `.js`; cần xác nhận deployment mới không còn `FUNCTION_INVOCATION_FAILED`.

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

## Kế hoạch phiên tiếp theo — RSVP, lời chúc và nhạc nền

### 1. Kiểm thử RSVP với Google Sheets

- Gửi một vài RSVP thử có tên/nội dung dễ nhận biết là dữ liệu kiểm thử; xác nhận các dòng thực sự xuất hiện trong Google Sheet.
- Kiểm tra cả trường hợp tham dự và không tham dự, cùng lời nhắn của khách.
- Không xóa các dòng kiểm thử khỏi Sheet nếu chưa thống nhất cách dọn dữ liệu.

### 2. Hiển thị lời chúc của khách mời

- Thiết kế một section lời chúc phù hợp với phong cách thiệp sau khi xác nhận luồng ghi RSVP hoạt động.
- Kiểm tra Apps Script hiện tại có hỗ trợ đọc danh sách lời chúc không; nếu chưa, thiết kế endpoint chỉ trả dữ liệu được phép công khai.
- Cân nhắc consent/duyệt trước khi công khai tên và lời nhắn của khách.

### 3. Quản lý và phát nhạc nền

- Mở rộng `/admin` để quản lý nhiều track: upload audio lên Blob, nhập tên bài, bật/tắt từng bài trong playlist.
- Chỉ tải các track được bật; đặt giới hạn định dạng/kích thước và lưu ý băng thông Blob.
- Tạo nút nhạc nổi có play/pause và mở playlist; thiết kế responsive, cho phép khách chủ động tắt nhạc.
- Trình duyệt có thể chặn autoplay có âm thanh trước tương tác của khách; cần xử lý graceful fallback yêu cầu chạm/bấm để phát.
- Các bài “Hơn Cả Yêu”, “Ánh nắng của anh” và “A Thousand Years” là ví dụ mong muốn; chỉ dùng file do người dùng cung cấp có quyền sử dụng hoặc file đã được cấp phép.

### Thứ tự đề xuất

1. Xác nhận Blob API hoạt động trên deployment mới.
2. Test RSVP end-to-end và xác nhận dữ liệu trên Sheet.
3. Chốt consent/duyệt cho lời chúc, rồi làm demo section.
4. Làm demo quản lý playlist và player; sau đó tiếp tục gallery slideshow và hoạt cảnh chào đã ghi ở trên.
