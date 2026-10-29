# Báo cáo kiểm thử bản cập nhật PTIT

Ngày kiểm tra: 26/10/2026. Môi trường: Node.js 24, Next.js 14.2.35, Prisma 5.22.0.

## Kiểm thử tự động

`npm test`: **13/13 bài kiểm thử đạt**, không bài bỏ qua. Mỗi bài có nhiều bước/assertion.

| Nhóm | Nội dung đã xác minh |
| --- | --- |
| Quyền | Đủ 4 vai trò; Sinh viên/Giảng viên không sửa đào tạo, Giáo vụ không tạo tài khoản |
| Đăng ký | Chỉ thao tác cho mình; chặn trùng môn/học kỳ, ngoài thời hạn, hồ sơ ngừng, lớp thiếu lịch, quá sĩ số |
| Đồng thời | Hai yêu cầu API tranh chỗ cuối: chỉ một thành công, yêu cầu còn lại HTTP 409; dữ liệu lưu không vượt sĩ số |
| Lịch học | Ngày/tiết không giao nhau được chấp nhận; chặn trùng phòng, giảng viên và sinh viên; đổi giảng viên cũng kiểm tra xung đột |
| Điểm | Chặn nhập ngoài 0–10, công bố thiếu điểm, nhập lớp không phụ trách; điểm 0 không bị coi là ô trống |
| Giao dịch điểm | Lưu nhiều dòng có một dòng lỗi: toàn bộ lần lưu rollback |
| Khóa bảng điểm | Giáo vụ khóa/mở khóa; giảng viên không sửa được bảng đã khóa; lớp có điểm không hủy đăng ký được |
| GPA | Theo trọng số tín chỉ; tính cả F; chọn lần học tốt nhất; chỉ điểm đã công bố; không cộng trùng thống kê cũ |
| Danh tính | Token riêng của tab ưu tiên so với cookie; khóa tài khoản có tác dụng với token đã cấp; chặn đọc hồ sơ/điểm của người khác |
| Dữ liệu trả về | Không có passwordHash; không lộ hồ sơ không liên quan hoặc điểm chưa công bố cho sinh viên |
| Mật khẩu | scrypt, salt khác nhau; sai mật khẩu bị từ chối; ngăn tự khóa/hạ quyền Admin đang dùng |
| SQL | Tạo bảng bổ sung hai lần không lỗi; FK/unique/CHECK hoạt động; rollback không giữ cập nhật dở |
| Dữ liệu cũ | Nhập hồ sơ, môn, lớp, tài khoản và điểm liên kết; dữ liệu bảng gốc trước/sau tương đương; không nhân đôi đăng ký khi lưu lại |
| Lưu trữ | Thay đổi API tồn tại trên tệp sau khi đọc lại; không chỉ nằm trong bộ nhớ React |

Mã kiểm thử nằm ở `tests/portal.test.ts`, `tests/api.test.ts`, `tests/database.test.ts`.

## Kiểm tra kỹ thuật

- TypeScript: **Đạt**, `npm run typecheck` và kiểm tra kiểu trong production build.
- ESLint: **Đạt**, không có warning/error.
- Prisma schema: **Hợp lệ**, `prisma validate` với URL kiểm tra cú pháp; không kết nối database thật.
- Production build: **Đạt**, `npm run build`; các trang và API được build thành công.

## Thao tác giao diện trên Chromium

Đã thực hiện bằng Playwright/Chromium với dữ liệu thử riêng:

1. Admin đăng nhập và tạo tài khoản Giảng viên.
2. Giáo vụ đăng nhập, tạo lớp niên khóa và hồ sơ sinh viên, gắn hồ sơ vào lớp.
3. Tạo môn học, lớp tín chỉ, phân công giảng viên, lập lịch và mở đăng ký.
4. Admin tạo tài khoản Sinh viên gắn với hồ sơ vừa tạo.
5. Sinh viên đăng nhập và đăng ký lớp qua giao diện.
6. Giảng viên đăng nhập, nhập CC=10, GK=8, CK=9 và công bố; tổng kết hiển thị **8.8**.
7. Sinh viên đăng nhập lại, mở bảng điểm và xem đúng **8.8**.
8. Giáo vụ khóa bảng điểm thành công; nút chuyển sang “Mở khóa điểm”.

Dữ liệu thử được giữ qua lần khởi động lại server. Không ghi dữ liệu thử vào database thật hoặc đưa tệp dữ liệu thử vào ZIP. Các bước cuối được xác minh trên production build chạy bằng `next start`.

## Giới hạn môi trường xác minh

Kiểm thử SQL chạy trên PostgreSQL nhúng PGlite; kiểm thử API gọi trực tiếp các Next route handlers với phiên ký thật và dữ liệu thử riêng. Gói nguồn không có thông tin kết nối Neon của người dùng nên chưa chạy nâng cấp trên database Neon thực tế. Việc tạo schema/nhập dữ liệu trên Neon cần thực hiện theo README trong môi trường của chủ dự án.

Không có thao tác push GitHub, publish hoặc sửa dữ liệu trên máy của người dùng.
