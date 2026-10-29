# Mở và cập nhật website PTIT

## Bạn đang có website chạy ở localhost:3000

1. Nhấn **Ctrl+C** ở Terminal đang chạy website.
2. Sao chép thư mục dự án hiện tại sang một bản dự phòng.
3. Giải nén ZIP mới. Sao chép mã nguồn trong thư mục `BTL-ITNTERNET-HAD-main` vào thư mục dự án hiện tại, cho phép ghi đè mã nguồn. **Giữ lại `.env.local`, `.env`, `.data` và các thư mục backup của bạn.**
4. Mở đúng thư mục có `package.json` trong VS Code. Chạy:

```powershell
npm install
```

## Chọn một cách chạy

**A. Thử các chức năng trước, không kết nối Neon:** thêm `PORTAL_STORAGE=demo` vào `.env.local`, rồi chạy:

```powershell
npm run dev
```

Mở http://localhost:3000/login.

| Vai trò demo | Tài khoản | Mật khẩu |
| --- | --- | --- |
| Admin | admin@ptit | ptitcstranphu@123 |
| Giáo vụ | giaovu@ptit | giaovu@123 |
| Giảng viên | hienntt | khoavt1@123 |
| Sinh viên | B23DCVT022 | ptit@123 |

Dữ liệu demo lưu trên máy trong `.data/portal-demo.json`, tách biệt với Neon.

**B. Dùng dữ liệu Neon thật:** giữ DATABASE_URL thật trong `.env.local`, đặt `PORTAL_STORAGE=postgresql`, rồi làm theo **mục 3 của README.md** để cấu hình tài khoản Admin/secret và chạy:

```powershell
npm run db:upgrade
npm run dev
```

Lệnh nâng cấp sao lưu trước, thêm bảng, nhập dữ liệu cũ một lần; không xóa bảng cũ. Nếu có lỗi, đọc thông báo và hướng dẫn trong README, không chạy reset database.

## Nên thử theo thứ tự

Admin tạo tài khoản → Giáo vụ tạo hồ sơ/lớp niên khóa/môn/lớp tín chỉ → phân công giảng viên → lập lịch → mở đăng ký → Sinh viên đăng ký → Giảng viên nhập/công bố điểm → Giáo vụ khóa điểm → Sinh viên xem kết quả.

Các menu mới nằm ở **Quản lý đào tạo**. Trang môn học, lịch học, bảng điểm và sổ điểm giảng viên đã nối cùng dữ liệu. Phần hỗ trợ, thông báo, chatbot và cài đặt cũ được giữ.

Bản ZIP là mã nguồn đã chỉnh; chưa tự thay đổi thư mục trên máy bạn, chưa chạy nâng cấp trên Neon của bạn và chưa push GitHub.
