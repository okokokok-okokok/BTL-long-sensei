# MEMORY — PTIT Student Management

## Bối cảnh phiên làm việc

- Dự án nằm tại `C:\Users\HUY\Downloads\PTIT-Quan-ly-sinh-vien-hoan-thien\BTL-ITNTERNET-HAD-main`.
- Người dùng muốn tiếp tục công việc ở một thư mục khác; hãy đọc file này trước khi tiếp tục.
- Trước đó đã yêu cầu làm phong phú dữ liệu demo, bổ sung giảng viên và các dữ liệu học vụ liên quan. Dữ liệu demo hiện có cần được giữ nguyên; không reset hoặc xóa database.
- Yêu cầu lớn hiện tại là hoàn thiện trang **Không gian Giáo vụ** thành trang tổng quan đào tạo, tận dụng dữ liệu/API/phân quyền hiện có; không commit, push hoặc deploy.

## Công việc đã triển khai

- Tạo `src/lib/portal/academic-dashboard.ts` để tổng hợp học kỳ, chỉ số, tình trạng đăng ký, tiến độ điểm, lịch trong ngày, báo cáo và hoạt động từ audit log thật.
  - Học kỳ hiện tại lấy từ `PORTAL_CURRENT_SEMESTER`; có mặc định tường minh `HK1 2026-2027`, không suy ra theo thứ tự tên học kỳ.
  - Ngày mặc định dùng múi giờ `Asia/Ho_Chi_Minh`; lịch lọc theo thứ và khoảng ngày hiệu lực.
  - Đếm lượt đăng ký có `status === 'registered'`; đăng ký hủy không cộng vào sĩ số. Trạng thái lớp, thời hạn đăng ký và chỗ còn lại được phân biệt.
  - Tiến độ điểm không tính lớp trống vào nhóm chờ điểm; điểm 0 hợp lệ; hoàn thành chỉ khi tất cả đăng ký còn hiệu lực có điểm đầy đủ đã công bố.
  - Báo cáo chỉ dùng kết quả đã công bố đầy đủ và dùng `gradeSummary`/quy tắc đạt hiện có.
- Tạo API `src/app/api/academic-dashboard/route.ts`; bắt buộc Admin hoặc Giáo vụ ở phía API. API dùng `withState(false)`, không tự chuyển sang demo nếu database PostgreSQL được cấu hình nhưng lỗi.
- Tạo giao diện tổng quan tại `src/components/AcademicAffairsDashboard.tsx`, dùng các thành phần/phần nghiệp vụ hiện có. Bao gồm bộ lọc học kỳ/ngày, thẻ số liệu có liên kết, công việc cần xử lý, bảng đăng ký/tìm kiếm/lọc/danh sách sinh viên, lịch trong ngày, tiến độ điểm, báo cáo, audit log, thao tác nhanh, loading/error/retry và trạng thái rỗng.
- `src/app/academic-affairs/page.tsx` hiển thị dashboard.
- `src/app/academic/page.tsx`, `src/app/schedule/page.tsx` và `src/components/AcademicWorkspace.tsx` nhận query để mở đúng tab, học kỳ, lớp, focus nghiệp vụ, biểu mẫu hoặc tuần lịch. Thêm danh sách giảng viên đọc cho Admin/Giáo vụ và thao tác nhanh dùng biểu mẫu có sẵn.
- `src/components/Sidebar.tsx` có mục Không gian Giáo vụ cho Admin/Giáo vụ.
- `.env.example` ghi cấu hình học kỳ hiện tại và thời gian nhập điểm tùy chọn (`PORTAL_CURRENT_SEMESTER`, `PORTAL_GRADE_ENTRY_START`, `PORTAL_GRADE_ENTRY_END`). Không đọc/ghi hoặc đưa giá trị bí mật trong `.env` vào báo cáo.
- Thêm `tests/academic-dashboard.test.ts` cho học kỳ cấu hình, đăng ký/hủy, sức chứa, phân loại điểm, điểm 0, tỷ lệ đạt, lịch, múi giờ và audit.
- Không đổi schema, không migration, không thêm/ghi dữ liệu mẫu vào database thật.

## Kiểm tra đã chạy

- `npm run typecheck` — đạt.
- `npm run lint` — đạt, không cảnh báo.
- `npm test` — 20 kiểm thử đạt, 0 lỗi.
- `npm run build` — build production thành công.
- Smoke test local trên demo: không đăng nhập trả 401; sinh viên trả 403; Admin trả 200; ngày sai trả 400. Bốn đường dẫn tổng quan/quản lý/kết quả/thời khóa biểu trả 200.
- Với demo state tại lúc kiểm tra: học kỳ `HK1 2026-2027`, 70 sinh viên hoạt động, 11 giảng viên, 8 lớp niên khóa, 17 lớp tín chỉ, 350 lượt đăng ký còn hiệu lực. Tổng sĩ số trong bảng khớp 350; không lớp nào vượt sức chứa; các nhóm tiến độ cộng đúng 17 lớp. Đây là số liệu đọc từ demo state lúc kiểm tra, không được hard-code.
- Smoke test đăng nhập production bị chặn do môi trường không cấu hình `AUTH_SECRET`; không thay đổi cấu hình bảo mật. Build vẫn thành công.

## Mở website

- Trang: <http://localhost:3000/academic-affairs>
- Server đã được bật bằng PowerShell với `PORTAL_STORAGE=demo` để kiểm tra an toàn; nếu tiến trình không còn chạy, mở PowerShell tại thư mục dự án và chạy:

  ```powershell
  $env:PORTAL_STORAGE='demo'; npx next dev -p 3000
  ```

- Đăng nhập bằng tài khoản Admin hoặc Giáo vụ hiện có. Không ghi mật khẩu demo vào file này.
- Lệnh trên ép tiến trình phát triển dùng demo. Ứng dụng/API vẫn phải tôn trọng nguồn lưu trữ được cấu hình khi chạy bình thường; nếu PostgreSQL lỗi thì hiển thị lỗi, không tự fallback sang demo.

## Tiếp tục công việc

- Nếu cần tiếp tục sửa, trước tiên kiểm tra file và trạng thái tiến trình hiện tại; không làm lại những phần đã hoàn thành.
- Giữ dữ liệu hiện có và không reset database. Không đọc/in giá trị bí mật từ `.env`.
- Chưa commit, push hoặc deploy.

## Cập nhật hoàn thiện bản desktop cho bài tập lớn

- Phạm vi người dùng đã chốt: chạy desktop để trình diễn đồ án; ưu tiên nghiệp vụ hoàn chỉnh và tinh gọn giao diện.
- Đăng ký/hủy có lý do rõ ràng; `registration.ts` dùng chung quy tắc. Lớp khóa điểm chặn thêm sinh viên, hủy và sửa điểm. Tổng quan Giáo vụ phản ánh cả tình trạng thiếu giảng viên/lịch hoặc đã khóa.
- Nhập điểm có cảnh báo khi chuyển bộ lọc/lớp, dùng menu, đăng xuất, tải lại và Back trên Chrome; công bố/khóa có xác nhận phạm vi. Có nút khóa ngay tại bảng điểm.
- `POST /api/auth/password` đổi mật khẩu hiện tại; Admin đặt lại bằng `user.password.reset`. Chỉ lưu hash và audit, không ghi mật khẩu vào nhật ký.
- Cài đặt chỉ giữ mật khẩu và sáng/tối; giao diện tiếng Việt. Bỏ tìm kiếm Header chưa hoạt động, tùy chọn email/SMS giả, mức tăng GPA cố định và thông báo mẫu ở login.
- Khung chương trình tham khảo giới hạn Viễn thông D23; trạng thái đạt lấy từ kết quả công bố của chính sinh viên qua `completedSubjectCodes`. Tổng tín chỉ dùng cùng quy tắc với trang chủ. Ngành/khóa khác hiển thị chưa có khung phù hợp.
- `/api/demo/accounts` chỉ cung cấp tài khoản mẫu đang tồn tại khi nguồn là demo; mật khẩu mẫu đã thay đổi sẽ không được điền lại. Nguồn PostgreSQL không bật tính năng này.
- Admin được thu gọn thành tài khoản, yêu cầu và trợ lý học tập. Cấu hình AI demo lưu bền vững vào file riêng, không còn chỉ ở RAM; PostgreSQL vẫn giữ bảng cấu hình cũ.
- `DEMO.md` hướng dẫn kịch bản các vai trò. Cài đặt cũng có kịch bản ngắn.
- Kiểm tra: 23/23 tests đạt, typecheck/lint/build đạt. `npm run test:desktop` kiểm tra Chrome trên server production cổng 3011 với dữ liệu tạm, gồm form login, tổng tín chỉ, phúc khảo/phản hồi, đổi mật khẩu, lưu giao diện, cảnh báo điểm chưa lưu và khóa điểm. Có thể cấu hình CHROME_PATH.
- Dừng server dev trước khi build để không tranh chấp `.next`. Sau build và kiểm thử giao diện, mở lại `npm run dev -- -p 3000`.
- Không reset dữ liệu, không sửa schema trong lượt này, không commit/push/deploy. Các thao tác kiểm thử ghi dữ liệu đều dùng file tạm riêng.

## Sửa luồng tạo lớp và đăng ký sau phản hồi người dùng

- Lớp người dùng vừa tạo `INT3306-02`, học kỳ `HK2 2026-2027`, có giảng viên và thời hạn đăng ký nhưng chưa có buổi học. Đó là lý do không đăng ký được; không tự tạo lịch giả vào dữ liệu của người dùng.
- API `section.save` chặn trạng thái Mở nếu thiếu lịch hoặc bảng điểm còn khóa. Chặn chuyển buổi cuối cùng khỏi lớp đang mở.
- Dòng lớp có nút Lập lịch học chọn đúng lớp, trạng thái Chưa thể đăng ký kèm lý do. Sau khi lưu lớp/lịch có checklist và thao tác mở đăng ký. Biểu mẫu phân biệt thời hạn đăng ký với ngày/tiết/phòng học.
- AcademicWorkspace làm mới khi focus/chuyển tab, có tín hiệu thay đổi từ tab khác và định kỳ khi không có điểm chưa lưu. Không ghi đè điểm đang nhập. Tín hiệu localStorage không chứa danh tính/token; mỗi tab vẫn dùng Bearer riêng.
- Kiểm tra mới: 25/25 tests đạt; build/typecheck/lint đạt; Chrome qua luồng tạo lớp → lập lịch → mở → đăng ký/hủy/đăng ký lại → lịch cá nhân/danh sách giảng viên, cùng trường hợp dữ liệu cũ Mở nhưng thiếu lịch. Các luồng điểm, phúc khảo, mật khẩu và cảnh báo dữ liệu chưa lưu tiếp tục qua.

## Cập nhật danh mục và biểu mẫu dùng chung (28/10/2026)

- Người dùng yêu cầu sửa trực tiếp toàn bộ biểu mẫu/bộ lọc danh mục, phụ thuộc khoa/ngành/khóa/lớp, dữ liệu ngừng hoạt động và cấp tài khoản theo hồ sơ có sẵn.
- Thêm `directories.ts`, `directory-mutations.ts`, `form-model.ts`, `options.ts`, `ChoiceSelect.tsx`; dữ liệu có `catalogs` và `lecturers`. Danh sách dài trên 8 mục có tìm kiếm. Biểu mẫu dùng “Chọn…”, bộ lọc dùng “Tất cả…”.
- Quản lý đào tạo có tab `catalogs` (Danh mục dùng chung), hồ sơ giảng viên tạo/sửa riêng. Tài khoản sinh viên/giảng viên chọn hồ sơ và lấy danh tính từ máy chủ; không nhập tay mã, không tự sinh hồ sơ thiếu thông tin. Chặn trùng liên kết cả với tài khoản đã khóa. Sửa hồ sơ cập nhật danh tính tài khoản tương ứng.
- API kiểm tra danh mục, quan hệ khoa/ngành/khóa/lớp, trạng thái và quyền Admin/Giáo vụ. Giá trị ngừng hoạt động chỉ được giữ khi sửa chính bản ghi đang dùng. Đổi tên giữ aliases, lọc/thống kê/GPA/đăng ký/trùng phòng hiểu cả tên cũ và mới.
- Migration bảo toàn dữ liệu `database/003_directories.sql`, chạy qua `npm run db:upgrade` khi dùng PostgreSQL; không reset/seed. Bộ kiểm thử PostgreSQL chạy migration lặp lại và rollback bằng PGlite.
- Nguồn thực tế đã xác minh là **demo**, không in thông tin `.env`. Đã nâng cấp tệp demo đang cấu hình: 68 mục danh mục, 11 hồ sơ giảng viên; đối chiếu tất cả tập dữ liệu cũ không thay đổi. Bản sao nguyên gốc có hậu tố `.before-directories.json` cạnh tệp demo, khớp các tập dữ liệu cũ. Không ghi dữ liệu kiểm thử vào tệp này.
- `npm test`: 34/34 đạt; typecheck/lint/build đạt. Kiểm thử Chrome chạy trên dữ liệu tạm, bao gồm tạo/sửa sinh viên, lớp niên khóa, hồ sơ giảng viên, tài khoản bốn vai trò, liên kết trùng, danh mục và phòng lịch sử ngừng hoạt động. Các luồng đăng ký/điểm/phúc khảo/mật khẩu trước đó tiếp tục được kiểm tra.
- Dừng server dev trước build; mở lại bằng `npm run dev -- -p 3000`. Trang danh mục `/academic?tab=catalogs`, tài khoản `/admin`. Không commit, push hay triển khai.
