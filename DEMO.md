# Kịch bản trình diễn bài tập lớn PTIT

Mở `http://localhost:3000/login`. Mục **Tài khoản trình diễn** chỉ xuất hiện khi ứng dụng dùng nguồn demo. Chọn vai trò để điền biểu mẫu rồi đăng nhập. Nếu mật khẩu đã được thay đổi, dùng mật khẩu mới; ứng dụng không tự khôi phục mật khẩu cũ.

1. **Giáo vụ – Quản lý đào tạo:** tạo lớp niên khóa, thêm hồ sơ sinh viên với mã và email chưa trùng.
2. **Admin – Tài khoản & phân quyền:** chọn hồ sơ sinh viên vừa tạo để cấp tài khoản. Mã, họ tên, email, khoa và lớp tự lấy từ hồ sơ. Với giảng viên, tạo hồ sơ tại **Quản lý đào tạo → Giảng viên** rồi chọn hồ sơ khi cấp tài khoản; mỗi hồ sơ chỉ liên kết một tài khoản. Ghi nhớ mật khẩu đã đặt.
3. **Giáo vụ:** tạo môn học, tạo lớp tín chỉ ở trạng thái Nháp, phân công giảng viên, lập lịch với phòng và tiết chưa trùng. Chọn khoảng ngày chứa thứ học thực tế.
4. **Giáo vụ:** chuyển lớp sang Mở đăng ký. Chọn thời gian bao gồm thời điểm trình diễn; hoặc để trống thời hạn để không giới hạn thời gian trong bản demo.

   Ngay tại dòng lớp tín chỉ có nút **Lập lịch học**, tự chọn đúng lớp. Sau khi lưu lớp/lịch, bảng hướng dẫn hiển thị các bước còn thiếu và nút **Mở đăng ký**. API chặn mở đăng ký nếu chưa phân công hoặc chưa có lịch. Với dữ liệu cũ đã ghi Mở nhưng thiếu lịch, bảng hiển thị **Chưa thể đăng ký** và lý do; bổ sung lịch để hoàn tất lớp. Ngày học và thời hạn đăng ký là hai thiết lập khác nhau.
5. **Sinh viên:** đăng ký lớp, xem danh sách lớp và thời khóa biểu cá nhân. Thử hủy rồi đăng ký lại khi chưa có điểm.
6. **Giảng viên phụ trách:** mở Kết quả học tập, chọn lớp, nhập đủ chuyên cần/giữa kỳ/cuối kỳ, lưu. Đánh dấu Công bố và lưu sau khi xác nhận. Thử chuyển lớp khi có điểm chưa lưu để xem cảnh báo.
7. **Sinh viên:** xem điểm đã công bố, GPA và tín chỉ. Tại Liên hệ hỗ trợ, chọn Phúc khảo, chọn đúng lớp vừa có điểm, ghi lý do rồi gửi.
8. **Giáo vụ – Tiếp nhận yêu cầu:** phản hồi và kết thúc yêu cầu với kết quả hoặc lý do từ chối. Sinh viên mở Yêu cầu của tôi để xem. Gửi và kết thúc phúc khảo không tự sửa điểm.
9. **Giáo vụ:** khóa bảng điểm. Kiểm tra hệ thống chặn sửa điểm, thêm sinh viên và hủy đăng ký. Muốn điều chỉnh, Giáo vụ phải mở khóa trước.
10. **Sinh viên – Cài đặt:** đổi mật khẩu, đăng xuất và đăng nhập lại bằng mật khẩu mới. **Admin** có thể đặt lại mật khẩu tại danh sách tài khoản khi người dùng quên mật khẩu.

Khung chương trình tham khảo hiện dành cho Viễn thông D23. Những ngành/khóa khác xem kết quả và tín chỉ bình thường, nhưng không dùng khung D23 để xác định tiến độ. Trạng thái hoàn thành môn được lấy từ kết quả đạt đã công bố, không dùng dấu tích mẫu.

Dữ liệu demo được lưu trong `.data/portal-demo.json` (hoặc đường dẫn cấu hình `PORTAL_DEMO_FILE`), không mất khi tải lại trang hoặc khởi động lại server. Các kiểm thử tự động sử dụng tệp tạm riêng.

## Danh mục và biểu mẫu

- **Quản lý đào tạo → Danh mục dùng chung:** thêm/sửa khoa, ngành, đơn vị công tác, khóa tuyển sinh, học kỳ và phòng học. Ngành bắt buộc thuộc một khoa. Khóa có năm tuyển sinh/kết thúc rõ ràng. Không cần nhập lại danh mục ở từng màn hình.
- Biểu mẫu chọn ngành theo khoa, lớp niên khóa theo khoa/ngành/khóa. Đổi lựa chọn cha sẽ bỏ lựa chọn con không còn hợp lệ. Danh sách trên 8 mục có ô tìm kiếm; danh sách ngắn dùng select thông thường.
- Ngừng hoạt động danh mục sẽ chặn sử dụng cho bản ghi mới. Khi sửa dữ liệu lịch sử, giá trị hiện có vẫn hiển thị và được giữ lại. Đổi tên giữ bí danh cũ để bộ lọc, thống kê và kiểm tra trùng lịch vẫn nhận diện cùng danh mục.
- Khi đọc demo cũ lần đầu, ứng dụng bổ sung danh mục và hồ sơ giảng viên đầy đủ từ dữ liệu hiện có; sao lưu nguyên bản vào tệp cùng đường dẫn với hậu tố `.before-directories.json`. Không tự tạo hồ sơ thiếu thông tin khi cấp tài khoản.
- Với PostgreSQL, chạy `npm run db:upgrade` trước khi mở phiên bản này. Migration `database/003_directories.sql` bổ sung bảng danh mục/hồ sơ giảng viên, giữ các bảng và dữ liệu cũ. Không chạy seed/reset để nâng cấp.

## Kiểm tra tự động

- `npm test`: kiểm tra API, phân quyền, đăng ký, điểm, phúc khảo, mật khẩu và migration trên dữ liệu tạm.
- Dừng server phát triển trước khi chạy `npm run build` để tránh cùng ghi thư mục `.next`.
- Sau khi build, chạy `npm run test:desktop`: mở Chrome headless và server kiểm thử riêng tại cổng 3011 với dữ liệu tạm, kiểm tra biểu mẫu, cảnh báo điểm chưa lưu, phúc khảo, đổi mật khẩu, giao diện và bảng điểm đã khóa. Có thể đặt `CHROME_PATH` nếu Chrome được cài ở vị trí khác.
- Kiểm thử trình duyệt cũng tạo lớp nháp, xác nhận chưa thể đăng ký khi thiếu lịch, lập lịch, mở đăng ký, chuyển tab sinh viên để kiểm tra làm mới dữ liệu, đăng ký/hủy/đăng ký lại và kiểm tra thời khóa biểu cá nhân/danh sách lớp của giảng viên.
- Kiểm thử danh mục bao gồm tạo/sửa hồ sơ và tài khoản, bốn vai trò, chặn liên kết trùng, tìm kiếm danh sách dài, xóa lựa chọn con không hợp lệ và giữ phòng ngừng hoạt động khi sửa lịch cũ. `npm test` hiện có 34 kiểm thử.
- Mở lại website bằng `npm run dev -- -p 3000`.
