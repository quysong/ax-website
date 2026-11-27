# Tiếp tục tối ưu website thiệp cưới

Các việc cần tiếp tục ở phiên làm việc sau:

1. **Đã xử lý — tăng cỡ chữ:** rà soát giao diện, nâng các chữ nhỏ lên tối thiểu 13px; kiểm tra bố cục mobile sau khi chỉnh.
2. **Đã xử lý — đổi font nội dung dài:** thay Be Vietnam Pro bằng Noto Sans; giữ Caveat và Cormorant Garamond cho các kiểu chữ trang trí/tiêu đề.
3. **Trang quản trị ảnh và Vercel Blob:**
   - Quản lý 6 vị trí ảnh tại `/admin`; upload trực tiếp lên Blob qua token giới hạn do Vercel Function cấp sau khi xác thực mật khẩu admin.
   - Ảnh được nén thành WebP phía trình duyệt; website lấy URL mới nhất từ Blob qua endpoint công khai đã cache.
   - Blob store đã tạo; giữ credentials trong env local/Vercel, không trong file ví dụ hoặc source.
   - Các import ESM của API vừa được sửa để thêm đuôi `.js`; cần xác nhận deployment mới không còn `FUNCTION_INVOCATION_FAILED`.

## Trạng thái hiện tại

- Dự án dùng React, TypeScript, Vite, prerender SSG và triển khai static trên Vercel.
- `.env` được Git ignore; không commit giá trị biến môi trường.

## Đã triển khai trong phiên mới nhất

- Gallery hiện là slideshow 3 ảnh có nút trước/sau, chấm chọn, phím mũi tên và vuốt trên mobile.
- Có hoạt cảnh CSS nhẹ: cửa nhà mở, chú rể vẫy tay và cô dâu chú rể bước ra; hỗ trợ `prefers-reduced-motion`.
- Admin `/admin` có thể upload MP3 (tối đa 30 MB, tối đa 30 track), đổi tên, bật/tắt, xóa; playlist metadata nằm trong Blob.
- Website chỉ lấy track đã bật, audio dùng `preload="none"` và player nổi có play/pause, chọn bài. Autoplay được thử sau khi mở thiệp; trình duyệt có thể yêu cầu khách bấm phát.
- RSVP chuyển qua `/api/rsvp` để nhận phản hồi thực từ Apps Script thay vì `no-cors`; form có checkbox đồng ý công khai tên/lời chúc.
- Có `/api/wishes` và section lời chúc; chỉ dữ liệu consent mới được trả ra công khai.
- Đã thay các giá trị Blob có vẻ thật trong `.env.example` bằng placeholder.

## Việc cần làm trước khi dùng production

1. **Bảo mật trước tiên:** read-write token Blob đã từng nằm trong file `.env.example` được Git track. File hiện chỉ còn placeholder; revoke token cũ trong Vercel, tạo token mới và cập nhật `.env.local` cùng Vercel env. Nếu đã push, token cũ vẫn có thể còn trong Git history.
2. Deploy source mới lên Vercel; cấu hình runtime env `GOOGLE_SCRIPT_APP`, `BLOB_READ_WRITE_TOKEN` mới và `ADMIN_PASSWORD` cho Production.
3. Hai RSVP smoke-test trực tiếp tới Apps Script trong phiên này đều nhận HTTP 401/non-JSON; chưa xác nhận được có dòng nào được ghi. Kiểm tra Google Apps Script deployment chạy as owner và quyền truy cập **Anyone**.
4. Cập nhật/redeploy Apps Script bằng `google-apps-script/Code.gs` để hỗ trợ `publishWish` và `doGet?action=wishes`; endpoint GET hiện tại chưa trả JSON lời chúc.
5. Sau khi deploy, test RSVP tham dự/từ chối qua form và kiểm tra Sheet; chỉ lời chúc đã được khách đồng ý mới hiện công khai. Không xóa dữ liệu test nếu chưa thống nhất.
6. Đăng nhập `/admin`, upload file MP3 bạn có quyền sử dụng, bật track muốn phát và thử player trên mobile/desktop. Chưa có file audio nào được upload trong phiên này.
7. Chạy `npm run build`; build tương đương (TypeScript, client, SSR, prerender) đã thành công khi tránh bước xóa file output cũ đang bị Windows khóa.
