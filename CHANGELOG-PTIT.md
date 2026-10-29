# Thay đổi bản hoàn thiện PTIT — 26/10/2026

## Nghiệp vụ và giao diện

- Thêm Giáo vụ (`academic`) bên cạnh Admin, Giảng viên, Sinh viên; bổ sung điều hướng và màn hình theo vai trò.
- Admin tạo, sửa, phân quyền, khóa tài khoản; đặt mật khẩu và liên kết tài khoản với hồ sơ/mã giảng viên. Không hiển thị danh sách mật khẩu trong giao diện Admin.
- Quản lý hồ sơ với lớp niên khóa, ngành, khoa, niên khóa, liên hệ, ngày sinh, tín chỉ tốt nghiệp và trạng thái. Mã sinh viên đã tạo được giữ cố định để bảo toàn liên kết tài khoản.
- Tách môn học khỏi lớp tín chỉ; tạo nhiều lớp/môn/học kỳ, phân công giảng viên, quản lý sĩ số và thời hạn đăng ký.
- Lập nhiều buổi học hàng tuần theo ngày, khoảng tiết và phòng; kiểm tra trùng phòng, giảng viên, sinh viên khi sửa lịch, đổi giảng viên hoặc đăng ký lớp.
- Đăng ký/hủy lớp có kiểm tra danh tính, hoạt động, thời hạn, sĩ số, trùng môn/học kỳ và bảng điểm. Hủy đăng ký lưu trạng thái lịch sử.
- Thời khóa biểu chung có bộ lọc học kỳ, lớp, giảng viên, phòng; lịch cá nhân lấy từ đăng ký hoặc phân công. Chọn tuần và in lịch.
- Quản lý điểm theo cá nhân, lớp học phần và toàn hệ thống; lọc học kỳ, lớp niên khóa, tìm kiếm. Nhập từng dòng/lưu tất cả, công bố, khóa/mở khóa; CSV và in bảng điểm.
- Tính điểm tổng kết, điểm chữ, điểm thang 4, GPA có trọng số tín chỉ và xử lý lần học lại; điểm chưa công bố không hiển thị cho sinh viên.
- Trang chủ lấy lịch học thực của sinh viên. Khi lỗi tải hồ sơ, hiển thị lỗi thay vì giả dữ liệu của sinh viên mẫu.
- Giữ giao diện thông báo, chatbot, hỗ trợ, cấu hình AI, chương trình đào tạo, hồ sơ và tùy chọn giao diện hiện có.

## Database và API

- Thêm 10 mô hình Prisma/bảng `portal_*`, với khóa ngoại, ràng buộc duy nhất và CHECK.
- Runtime Prisma transaction; thao tác ghi dùng advisory lock để tránh vượt sĩ số khi đăng ký đồng thời. Demo lưu tệp có khóa và ghi nguyên tử, tồn tại sau restart.
- Script `npm run db:upgrade`: sao lưu các bảng cũ nhận diện được, tạo bảng bổ sung, nhập có transaction, ghi báo cáo, chạy lại không nhập lặp. Không sửa/xóa bảng cũ.
- API `/api/portal` dùng kiểm tra dữ liệu, quyền và phạm vi đối tượng ở máy chủ. Các endpoint đào tạo cũ chuyển sang cùng dữ liệu mới.
- Chặn thao tác quản trị/điểm trái quyền, thay mã sinh viên để xem người khác, khai báo vai trò giả trong body/query và thay đổi từ origin khác.
- Token theo tab được gửi nhất quán; Bearer được ưu tiên so với cookie của tab khác. Quyền và trạng thái tài khoản được kiểm tra lại mỗi lần gọi API.
- Mật khẩu mới dùng scrypt có salt. Nâng cấp tài khoản cũ giữ quyền cũ và không tự thêm tài khoản demo vào database thật.
- `/api/init-db` không còn khởi tạo database qua URL; dùng script cập nhật có sao lưu.
- Bổ sung kiểm thử miền nghiệp vụ, API, giao dịch đồng thời, SQL migration, constraint và rollback.

## Tệp chính

| Vị trí | Vai trò |
| --- | --- |
| `src/lib/portal/types.ts` | Cấu trúc dữ liệu dùng chung |
| `src/lib/portal/domain.ts` | Kiểm tra nghiệp vụ/quyền |
| `src/lib/portal/analytics.ts` | Công thức điểm và GPA |
| `src/lib/portal/store.ts` | Lưu trữ Prisma và demo |
| `src/lib/portal/import-legacy.ts` | Chuyển dữ liệu cũ |
| `src/lib/portal/session.ts` | Xác thực, quyền và lỗi API |
| `src/lib/portal/compat.ts` | Nối endpoint cũ sang dữ liệu mới |
| `src/components/AcademicWorkspace.tsx` | Giao diện quản lý đào tạo |
| `src/components/PersonalTodaySchedule.tsx` | Lịch học hôm nay theo đăng ký |
| `src/app/api/portal/route.ts` | API nghiệp vụ mới |
| `database/001_portal.sql` | SQL bổ sung bảng |
| `scripts/portal-migrate.ts` | Nâng cấp, sao lưu, báo cáo |
| `tests/` | Kiểm thử tự động |

Không có thao tác push, commit hoặc publish nào được thực hiện. Bản ZIP không chứa mật khẩu Neon, `.env.local`, dữ liệu demo đã thay đổi hoặc bản sao lưu database của người dùng.
