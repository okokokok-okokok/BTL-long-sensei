# PTIT — Website quản lý sinh viên và đào tạo

Bản cập nhật từ ZIP được cung cấp ngày 26/10/2026. Next.js 14, React, TypeScript, Prisma 5 và PostgreSQL Neon. API của ứng dụng đang chạy nằm trong `src/app/api`; không cần khởi động `backend-spring-boot` để dùng website này.

## 1. Cập nhật dự án đang chạy trên Windows

1. Trong Terminal đang chạy website, nhấn **Ctrl+C**.
2. Sao chép thư mục dự án hiện tại sang một thư mục dự phòng.
3. Giải nén bản cập nhật; sao chép các tệp mã nguồn vào thư mục dự án hiện tại và cho phép ghi đè mã nguồn. **Giữ nguyên `.env.local`, `.env`, thư mục `.data` và các bản sao lưu của bạn.** ZIP không chứa các tệp cấu hình bí mật hay dữ liệu cục bộ này.
4. Mở thư mục chứa `package.json` bằng VS Code. Trong Terminal chạy:

```powershell
npm install
```

5. Nếu đang dùng Neon: làm theo mục 3 trước khi mở website. Nếu muốn thử demo: làm theo mục 2.
6. Chạy:

```powershell
npm run dev
```

Mở http://localhost:3000/login. Đăng xuất rồi đăng nhập lại sau khi cập nhật để nhận vai trò và thông tin phiên mới.

Không cần clone lại hoặc push GitHub để thực hiện những bước này.

## 2. Chạy thử cục bộ, chưa kết nối Neon

Trong `.env.local`, thêm hoặc sửa:

```dotenv
PORTAL_STORAGE=demo
```

Có thể tạo `.env.local` mới bằng cách sao chép `.env.example` nếu chưa có; không sao chép đè cấu hình đang dùng.

Chạy `npm install`, sau đó `npm run dev`. Lần đầu ứng dụng tạo `.data/portal-demo.json`. Các thay đổi được lưu vào tệp này và tồn tại sau khi tắt/bật server; có khóa tệp để chống hai thao tác ghi đè nhau. Không xóa tệp này nếu muốn giữ dữ liệu demo.

| Vai trò | Tên đăng nhập demo | Mật khẩu demo |
| --- | --- | --- |
| Admin | `admin@ptit` | `ptitcstranphu@123` |
| Giáo vụ | `giaovu@ptit` | `giaovu@123` |
| Giảng viên | `hienntt` | `khoavt1@123` |
| Sinh viên | `B23DCVT022` | `ptit@123` |

Các sinh viên còn lại trong danh sách mẫu có tên đăng nhập là mã sinh viên, mật khẩu `ptit@123`. Đây là tài khoản **demo**; database thật dùng tài khoản đã nhập và tài khoản do Admin tạo. Dữ liệu demo không tự động được nhập sang Neon khi đổi chế độ.

## 3. Cập nhật database Neon và giữ dữ liệu cũ

Trước tiên kiểm tra URL đang trỏ đúng database của bạn. Khuyến nghị giữ thêm bản sao/branch của database trước khi thay đổi.

Trong `.env.local`:

```dotenv
PORTAL_STORAGE=postgresql
DATABASE_URL="postgresql://...chuoi-ket-noi-Neon-cua-ban...?sslmode=require"
AUTH_SECRET="chuoi-ngau-nhien-bi-mat-it-nhat-32-ky-tu"
```

Tạo AUTH_SECRET bằng:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Nếu chưa có Admin trong bảng `users` cũ, hoặc tài khoản Admin cũ dùng dạng băm chưa hỗ trợ, đặt thêm mật khẩu khởi tạo riêng, ít nhất 12 ký tự:

```dotenv
BOOTSTRAP_ADMIN_USERNAME=admin@ptit
BOOTSTRAP_ADMIN_EMAIL=admin@ptit.edu.vn
BOOTSTRAP_ADMIN_PASSWORD="mat-khau-rieng-cua-ban"
BOOTSTRAP_ACADEMIC_PASSWORD="mat-khau-giao-vu-rieng"
```

Không cần mật khẩu bootstrap nếu đã có Admin cũ hoạt động với mật khẩu nhập được. Nếu tên bootstrap trùng tài khoản cũ nhưng mật khẩu cũ chưa dùng được, đặt **tên và email bootstrap khác**; script không ghi đè tài khoản cũ. Giáo vụ cũng có thể được Admin tạo từ giao diện sau đó.

Chạy:

```powershell
npm run db:upgrade
npm run dev
```

Cơ chế nâng cấp:

- Đọc các bảng cũ đang tồn tại; ghi bản sao JSON vào `backups/<thoi-gian>/before-upgrade.json` **trước khi** tạo/nhập dữ liệu.
- Thêm các bảng `portal_*` theo `database/001_portal.sql`. Không `DROP`, `TRUNCATE`, không xóa hoặc sửa bản ghi trong bảng cũ.
- Chuyển hồ sơ cũ, lớp niên khóa, tài khoản, môn học và các điểm có liên kết đầy đủ sang cấu trúc mới, trong một transaction. Lỗi bất kỳ sẽ rollback toàn bộ cập nhật database.
- Lưu dấu mốc `legacy-import-v1`; chạy lại không nhân đôi dữ liệu đã nhập.
- Tạo `import-report.json` trong cùng thư mục backup. Lịch dạng văn bản cũ, tên giảng viên, phòng và sĩ số cũ được ghi rõ để đối chiếu; bảng gốc vẫn nguyên vẹn.
- Lớp cũ được nhập ở trạng thái **Nháp**. Giáo vụ xác nhận học kỳ, tài khoản giảng viên và lịch có thứ/tiết/ngày trước khi mở đăng ký. Không tự suy đoán ngày học từ một chuỗi lịch thiếu ngày.
- Đăng ký cũ chỉ khôi phục khi xác định được quan hệ sinh viên–môn từ bảng `grades`. Một con số `enrolled` riêng lẻ không đủ để khôi phục danh tính sinh viên. Những bảng đăng ký tùy biến ngoài cấu trúc ZIP cần được đối chiếu riêng; script không xóa chúng.
- GPA/tín chỉ tổng hợp cũ lưu ở `legacyGpa`/`legacyCredits`; không cộng dồn với kết quả học phần mới vì có thể trùng lịch sử. Điểm mới tính theo công thức thống nhất của ứng dụng; điểm tổng kết gốc vẫn ở bảng `grades` cũ và bản sao.
- Các mật khẩu dạng plaintext của bản cũ được chuyển sang scrypt. Các hash scrypt được giữ; hash bcrypt/Argon2/SHA-256 không được coi là mật khẩu plaintext, và tài khoản đó cần Admin đặt mật khẩu mới.

Sau lần nâng cấp đầu, không tiếp tục chỉnh dữ liệu trực tiếp qua các bảng cũ; website sử dụng các bảng `portal_*` cho nghiệp vụ đào tạo. Các bảng cũ phục vụ đối chiếu và các tính năng hỗ trợ/thông báo/cấu hình AI đã có.

**Không dùng** `prisma migrate reset`, `prisma db push --accept-data-loss`, các script seed cũ hoặc `/api/init-db` để cập nhật database có dữ liệu. `/api/init-db` đã ngừng cho phép khởi tạo qua HTTP.

Bản sao JSON là bản sao dữ liệu đọc được của các bảng nhận diện, không thay thế bản backup toàn bộ PostgreSQL gồm DDL, quyền và các bảng tùy biến. Không chia sẻ `backups/` vì chứa dữ liệu cá nhân và thông tin tài khoản cũ. Nếu cần quay lại giao diện cũ, dừng app và khôi phục mã nguồn dự phòng; các bảng cũ chưa bị thay đổi. Các thay đổi mới trong portal không tự đồng bộ ngược về bảng cũ.

## 4. Quyền và quy trình dùng thử

| Chức năng | Admin | Giáo vụ | Giảng viên | Sinh viên |
| --- | --- | --- | --- | --- |
| Tạo/khóa tài khoản, đổi vai trò, đặt mật khẩu | Có | Không | Không | Không |
| Quản lý hồ sơ sinh viên, xếp lớp niên khóa | Có | Có | Xem SV lớp phụ trách | Xem hồ sơ mình |
| Tạo/sửa lớp niên khóa và môn học | Có | Có | Xem | Xem |
| Tạo lớp tín chỉ, phân công giảng viên, lập lịch | Có | Có | Xem | Xem |
| Xem danh sách lớp (mã, tên, lớp niên khóa) | Có | Có | Có | Có |
| Đăng ký/hủy lớp | Quản lý | Quản lý | Không | Cho chính mình |
| Thời khóa biểu | Chung | Chung | Cá nhân | Cá nhân |
| Nhập/công bố điểm | Có | Có | Lớp được phân công | Không |
| Khóa/mở khóa bảng điểm | Có | Có | Không | Không |
| Kết quả toàn hệ thống | Có | Có | Lớp phụ trách | Điểm cá nhân đã công bố |

Quy trình trình diễn:

1. Admin vào **Quản lý đào tạo → Hồ sơ sinh viên**, thêm hồ sơ nếu cần; vào **Tài khoản & phân quyền** để tạo tài khoản Giáo vụ, Giảng viên và Sinh viên. Tài khoản Sinh viên phải gắn với mã hồ sơ đã tồn tại. Mật khẩu không được trả về trình duyệt.
2. Giáo vụ tạo **Lớp niên khóa**, xếp sinh viên vào lớp bằng **Sửa hồ sơ / Xếp lớp**.
3. Tạo **Danh mục môn học**, rồi tạo **Lớp tín chỉ** riêng cho từng nhóm/học kỳ; phân công tài khoản Giảng viên. Có thể để Nháp trong khi lập kế hoạch.
4. Vào **Thời khóa biểu → Lập lịch** để nhập thứ, khoảng tiết, khoảng ngày và phòng. Mỗi lớp có thể có nhiều buổi lặp hàng tuần.
5. Mở trạng thái đăng ký lớp, đặt thời hạn nếu cần. Sinh viên vào **Đăng ký môn học** để đăng ký hoặc hủy. Không được trùng môn trong một học kỳ, quá sĩ số, trùng lịch hoặc hủy lớp đã có điểm. Lớp chưa có giảng viên/lịch không nhận đăng ký.
6. Giảng viên vào **Sổ điểm & Lớp học phần**, chọn lớp được phân công. Nhập từng điểm, đánh dấu Công bố, lưu từng dòng hoặc **Lưu tất cả**. Ô trống là chưa có điểm; `0` là điểm 0. Lưu nhiều dòng là một transaction.
7. Giáo vụ/Admin khóa bảng điểm ở **Lớp tín chỉ** sau khi toàn lớp đã đủ điểm và đã công bố. Muốn sửa phải mở khóa trước.
8. Xem kết quả theo **cá nhân**, **lớp học phần** hoặc **toàn hệ thống**; lọc học kỳ/lớp niên khóa/tìm kiếm. Xuất CSV, in bảng điểm, in lịch tuần. Sinh viên chỉ thấy điểm đã công bố của mình.

Hai tab trình duyệt đăng nhập khác tài khoản dùng Bearer token riêng trong sessionStorage; các API ưu tiên token của tab và kiểm tra lại trạng thái/quyền tài khoản trong dữ liệu. Không dùng tên vai trò gửi từ trình duyệt để cấp quyền.

## 5. Database và API

Các mô hình Prisma mới: `PortalUser`, `PortalStudent`, `PortalCohort`, `PortalSubject`, `PortalSection`, `PortalMeeting`, `PortalEnrollment`, `PortalResult`, `PortalAudit`, `PortalMeta`.

Quan hệ: lớp niên khóa → hồ sơ; môn học → nhiều lớp tín chỉ; giảng viên → nhiều lớp được phân công; lớp tín chỉ → nhiều buổi học; sinh viên ↔ lớp tín chỉ qua đăng ký; một đăng ký → một bộ điểm. Có FK, unique và CHECK ở PostgreSQL. Hủy đăng ký đổi trạng thái, ngừng hồ sơ/tài khoản dùng cờ hoạt động; không xóa lịch sử.

Runtime dùng Prisma transaction và truy vấn có tham số; script nâng cấp dùng `pg` để sao lưu và áp dụng SQL. Các thao tác ghi được tuần tự hóa bằng transaction advisory lock để tránh hai sinh viên cùng chiếm chỗ cuối. Bản demo dùng khóa tệp và ghi tệp nguyên tử. Thiết kế đọc trạng thái vào bộ nhớ phù hợp quy mô đồ án; với lượng dữ liệu lớn cần chuyển sang truy vấn phân trang và khóa theo lớp.

| Endpoint | Công dụng |
| --- | --- |
| `POST /api/auth/login` | Xác thực, cookie HttpOnly và token của tab |
| `GET /api/auth/me` | Xác minh phiên, quyền hiện tại và trạng thái tài khoản |
| `GET /api/portal` | Dữ liệu theo quyền; loại hash, lọc hồ sơ/điểm |
| `GET /api/portal?roster=<sectionId>` | Danh sách lớp tín chỉ, chỉ trường danh bạ |
| `GET /api/portal?cohort=<cohortId>` | Danh sách lớp niên khóa |
| `POST /api/portal` | Thực hiện nghiệp vụ, kiểm tra quyền và transaction |

POST body gồm `action` và các trường tương ứng. Actions: `user.save`, `student.save`, `cohort.save`, `subject.save`, `section.save`, `meeting.save`, `enrollment.add`, `enrollment.cancel`, `result.save`, `result.batch`, `section.lock`. `id` có nghĩa là cập nhật; thiếu `id` tạo mới. Chi tiết trường ở `src/lib/portal/types.ts` và `domain.ts`.

Các API cũ `/api/student`, `/api/students`, `/api/courses`, `/api/grades`, `/api/grades/update`, `/api/admin/courses`, `/api/admin/stats` được nối vào cùng dữ liệu mới và kiểm tra quyền. API hỗ trợ, chatbot, cấu hình AI được giữ và đã thêm xác thực/quyền. Thông báo công khai vẫn đọc được trước đăng nhập.

HTTP: 400 dữ liệu không hợp lệ; 401 chưa đăng nhập/tài khoản bị khóa; 403 sai quyền; 404 không tồn tại; 409 xung đột; 429 thử đăng nhập quá nhiều; 503 cấu hình/kết nối database chưa sẵn sàng. Database thật lỗi không tự chuyển sang dữ liệu mẫu.

Công thức hiện tại: tổng kết `round(0.1*CC + 0.3*GK + 0.6*CK, 1)`. Thang điểm chữ/4: ≥9 A+/4; ≥8.5 A/4; ≥8 B+/3.5; ≥7 B/3; ≥6.5 C+/2.5; ≥5.5 C/2; ≥5 D+/1.5; ≥4 D/1; còn lại F/0. GPA theo tín chỉ, tính cả F, lấy lần học đã công bố có điểm cao nhất theo từng môn. Đây là cấu hình nghiệp vụ của đồ án, có thể cần điều chỉnh theo quy chế mà thầy yêu cầu.

## 6. Kiểm tra

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run db:validate` kiểm tra schema khi đã đặt DATABASE_URL; lệnh này không kết nối hoặc ghi database. Tests dùng PostgreSQL nhúng PGlite cho migration/constraint/rollback và gọi trực tiếp Next route handlers cho luồng API. Không cần database Neon thật để chạy tests.

`npm run build` chỉ biên dịch, không nhập dữ liệu và không publish. Nếu dùng `npm start`, đặt AUTH_SECRET ít nhất 32 ký tự và chọn rõ database hoặc `PORTAL_STORAGE=demo`.

Các thay đổi trong gói ZIP chưa được áp dụng vào Neon của bạn và chưa được push GitHub. Xem `CHANGELOG-PTIT.md` và `KIEM-THU.md` để biết phạm vi và kết quả xác minh.
