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
