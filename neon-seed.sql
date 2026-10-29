-- =======================================================
-- NEON POSTGRESQL SEED DATA: 46 AUTHENTIC PTIT STUDENTS (COHORT D23 VT) & FACULTY
-- =======================================================

-- 1. Insert 46 Authentic PTIT Students from Academic Affairs Roster
INSERT INTO students (student_code, name, email, avatar_url, major, class_name, faculty, academic_year, cumulative_gpa, target_gpa, earned_credits, required_credits)
VALUES
('B23DCVT022', 'Nguyễn Đức Anh', 'b23dcvt022@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.68, 3.83, 45, 140),
('B23DCVT025', 'Nguyễn Nhật Anh', 'b23dcvt025@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT01-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.52, 3.67, 44, 140),
('B23DCVT030', 'Nguyễn Văn Anh', 'b23dcvt030@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT06-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.41, 3.56, 45, 140),
('B23DCVT036', 'Vũ Hải Anh', 'b23dcvt036@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT06-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.75, 3.9, 48, 140),
('B23DCVT065', 'Nguyễn Hùng Cương', 'b23dcvt065@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT05-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.35, 3.5, 42, 140),
('B23DCVT070', 'Nguyễn Như Đại', 'b23dcvt070@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.6, 3.75, 45, 140),
('B23DCVT100', 'Vũ Anh Đức', 'b23dcvt100@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.28, 3.43, 42, 140),
('B23DCVT124', 'Lưu Hoàng Giang', 'b23dcvt124@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.58, 3.73, 45, 140),
('B23DCVT129', 'Trần Quang Hà', 'b23dcvt129@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT03-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.82, 3.97, 48, 140),
('B23DCVT130', 'Đoàn Phúc Hải', 'b23dcvt130@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.45, 3.6, 44, 140),
('B23DCVT139', 'Trương Công Hải', 'b23dcvt139@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT01-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.65, 3.8, 46, 140),
('B23DCVT149', 'Vũ Quang Hiệp', 'b23dcvt149@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT05-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.2, 3.35, 42, 140),
('B23DCVT162', 'Quách Trung Hiếu', 'b23dcvt162@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT06-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.7, 3.85, 46, 140),
('B23DCVT166', 'Đỗ Minh Hoàng', 'b23dcvt166@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.5, 3.65, 45, 140),
('B23DCVT169', 'Hà Việt Hoàng', 'b23dcvt169@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT01-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.88, 4, 48, 140),
('B23DCVT211', 'Nguyễn Ngọc Huy', 'b23dcvt211@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT01-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.32, 3.47, 43, 140),
('B23DCVT214', 'Trương Quang Huy', 'b23dcvt214@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.72, 3.87, 47, 140),
('B23DCVT194', 'Nguyễn Mạnh Hưng', 'b23dcvt194@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT02-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.48, 3.63, 45, 140),
('B23DCVT199', 'Thái Bá Hưng', 'b23dcvt199@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT01-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.62, 3.77, 46, 140),
('B23DCVT202', 'Trịnh Ngọc Hường', 'b23dcvt202@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.8, 3.95, 48, 140),
('B23DCVT246', 'Trần Trung Kiên', 'b23dcvt246@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT06-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.25, 3.4, 42, 140),
('B23DCVT268', 'Đặng Công Minh', 'b23dcvt268@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.55, 3.7, 45, 140),
('B23DCVT272', 'Hoàng Quang Minh', 'b23dcvt272@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT02-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.4, 3.55, 44, 140),
('B23DCVT284', 'Phan Huy Minh', 'b23dcvt284@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT02-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.67, 3.82, 46, 140),
('B23DCVT288', 'Vũ Quang Minh', 'b23dcvt288@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT06-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.78, 3.93, 47, 140),
('B23DCVT297', 'Nguyễn Phương Nam', 'b23dcvt297@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT03-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.3, 3.45, 42, 140),
('B23DCVT312', 'Hoàng Ngọc Trung Nguyên', 'b23dcvt312@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT06-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.85, 4, 48, 140),
('B23DCVT327', 'Lê Hoàng Phong', 'b23dcvt327@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT03-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.46, 3.61, 44, 140),
('B23DCVT334', 'Trần Xuân Phú', 'b23dcvt334@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.54, 3.69, 45, 140),
('B23DCVT338', 'Mai Xuân Phúc', 'b23dcvt338@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT02-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.9, 4, 48, 140),
('B23DCVT347', 'Đinh Tiến Quân', 'b23dcvt347@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT05-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.22, 3.37, 42, 140),
('B23DCVT350', 'Lê Minh Quân', 'b23dcvt350@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT02-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.6, 3.75, 45, 140),
('B23DCVT352', 'Trần Hùng Quân', 'b23dcvt352@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT06-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.38, 3.53, 43, 140),
('B23DCVT369', 'Nguyễn Tiến Sang', 'b23dcvt369@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT03-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.73, 3.88, 47, 140),
('B23DCVT385', 'Nguyễn Danh Tây', 'b23dcvt385@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT01-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.56, 3.71, 45, 140),
('B23DCVT386', 'Đỗ Đại Thái', 'b23dcvt386@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT02-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.44, 3.59, 44, 140),
('B23DCVT388', 'Nguyễn Minh Thái', 'b23dcvt388@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.82, 3.97, 48, 140),
('B23DCVT398', 'Nguyễn Duy Thành', 'b23dcvt398@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT02-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.3, 3.45, 43, 140),
('B23DCVT400', 'Vũ Tiến Thành', 'b23dcvt400@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.64, 3.79, 46, 140),
('B23DCVT401', 'Vũ Tuấn Thành', 'b23dcvt401@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT05-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.5, 3.65, 45, 140),
('B23DCVT406', 'Nguyễn Quốc Thịnh', 'b23dcvt406@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.76, 3.91, 47, 140),
('B23DCVT409', 'Đinh Quốc Thuận', 'b23dcvt409@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT01-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.36, 3.51, 43, 140),
('B23DCVT439', 'Ngô Quang Tuấn', 'b23dcvt439@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT01-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.66, 3.81, 46, 140),
('B23DCVT446', 'Cao Thanh Tùng', 'b23dcvt446@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT02-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.84, 3.99, 48, 140),
('B23DCVT459', 'Đỗ Quang Vinh', 'b23dcvt459@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT03-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.42, 3.57, 44, 140),
('B23DCVT472', 'Phan Thị Bảo Yến', 'b23dcvt472@stu.ptit.edu.vn', '/default-avatar.png', 'Kỹ thuật Điện tử Viễn thông', 'D23CQVT04-B', 'Khoa Viễn thông 1', '2023 - 2027', 3.92, 4, 48, 140)
ON CONFLICT (student_code) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  major = EXCLUDED.major,
  class_name = EXCLUDED.class_name,
  faculty = EXCLUDED.faculty,
  cumulative_gpa = EXCLUDED.cumulative_gpa,
  earned_credits = EXCLUDED.earned_credits;

-- 2. Insert Courses with Authentic PTIT Faculty Members & Campus Rooms
INSERT INTO courses (code, name, credits, instructor, department, schedule, room, enrolled, capacity, status)
VALUES
('INT1402', 'Cơ sở dữ liệu', 3, 'TS. Nguyễn Thị Thu Hiền', 'Khoa Viễn thông 1', 'Thứ 3 (13:00 - 15:40)', '405-A2', 46, 50, 'open'),
('INT3306', 'Lập trình Web', 3, 'TS. Nghiêm Thị Phương', 'Khoa CNTT 1', 'Thứ 2 (10:00 - 11:40)', 'Lab 2-A3', 42, 45, 'registered'),
('INT1306', 'Cấu trúc dữ liệu và giải thuật', 4, 'PGS. TS. Ngô Xuân Bách', 'Khoa CNTT 1', 'Thứ 2 (08:00 - 09:40)', '301-A2', 60, 60, 'registered'),
('INT3401', 'Kỹ thuật phần mềm', 3, 'TS. Phạm Văn Hậu', 'Khoa CNTT 1', 'Thứ 4 (13:00 - 15:40)', '202-A2', 35, 50, 'open'),
('INT3502', 'Trí tuệ nhân tạo', 3, 'PGS. TS. Từ Minh Phương', 'Khoa CNTT 1', 'Thứ 5 (08:00 - 10:40)', '105-A3', 48, 50, 'open'),
('BAS1224', 'Xác suất thống kê', 3, 'TS. Đặng Văn Cường', 'Khoa Cơ bản 1', 'Thứ 6 (08:00 - 10:40)', 'PM.03-A2', 45, 60, 'open'),
('INT1339', 'Mạng máy tính', 3, 'PGS. TS. Hoàng Xuân Dậu', 'Khoa An toàn thông tin', 'Thứ 7 (13:00 - 15:40)', 'Lab Mạng-A3', 40, 45, 'open')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  instructor = EXCLUDED.instructor,
  department = EXCLUDED.department,
  room = EXCLUDED.room,
  schedule = EXCLUDED.schedule,
  credits = EXCLUDED.credits,
  enrolled = EXCLUDED.enrolled,
  capacity = EXCLUDED.capacity,
  status = EXCLUDED.status;

-- 3. Insert Announcements
DELETE FROM announcements;

INSERT INTO announcements (title, content, is_urgent, time_ago)
VALUES
('Lịch thi kết thúc học phần Học kỳ 1 (2024 - 2025)', 'Phòng Giáo vụ thông báo lịch thi chính thức các học phần Cơ sở dữ liệu, Lập trình Web tại Giảng đường A2 và Nhà B. Vui lòng kiểm tra phòng thi trên hệ thống.', TRUE, '2 giờ trước'),
('Thông báo hạn nộp học phí Học kỳ 1 (2024 - 2025)', 'Sinh viên hoàn thành nghĩa vụ nộp học phí qua cổng thanh toán VNPay / ngân hàng trước ngày 01/11/2024.', FALSE, '1 ngày trước'),
('Kế hoạch đăng ký học phần tín chỉ Học kỳ 2 (2024 - 2025)', 'Phòng Đào tạo mở cổng đăng ký học phần trên qldt.ptit.edu.vn cho sinh viên khóa D23 bắt đầu từ 08:00 ngày 05/11/2024.', FALSE, '4 ngày trước');

-- 4. Seed Grades for Authentic Students in INT1402 (Cơ sở dữ liệu) and related courses
INSERT INTO grades (student_id, course_id, attendance_grade, midterm_grade, exam_grade, final_grade, letter_grade, semester, status)
SELECT 
    s.id AS student_id,
    c.id AS course_id,
    CASE 
        WHEN c.code = 'INT1402' THEN 9.5
        WHEN c.code = 'INT1306' THEN 8.5
        WHEN c.code = 'INT3306' THEN 9.0
        ELSE 8.5
    END AS attendance_grade,
    CASE 
        WHEN c.code = 'INT1402' THEN 8.5
        WHEN c.code = 'INT1306' THEN 8.0
        WHEN c.code = 'INT3306' THEN 8.5
        ELSE 8.0
    END AS midterm_grade,
    CASE 
        WHEN c.code = 'INT1402' THEN 9.0
        WHEN c.code = 'INT1306' THEN 8.5
        WHEN c.code = 'INT3306' THEN 8.5
        ELSE 8.0
    END AS exam_grade,
    CASE 
        WHEN c.code = 'INT1402' THEN 8.9
        WHEN c.code = 'INT1306' THEN 8.4
        WHEN c.code = 'INT3306' THEN 8.7
        ELSE 8.2
    END AS final_grade,
    CASE 
        WHEN c.code = 'INT1402' THEN 'A'
        WHEN c.code = 'INT1306' THEN 'B+'
        WHEN c.code = 'INT3306' THEN 'A'
        ELSE 'B'
    END AS letter_grade,
    'Fall 2024' AS semester,
    'passed' AS status
FROM students s
CROSS JOIN courses c
WHERE s.student_code LIKE 'B23DCVT%'
  AND c.code IN ('INT1402', 'INT1306', 'INT3306')
ON CONFLICT (student_id, course_id, semester) DO NOTHING;

-- 5. Insert Users (Admin, Lecturer, and all 46 Official Students with password 'ptit@123')
DELETE FROM users;

INSERT INTO users (username, password_hash, name, email, role, avatar_url, student_code, lecturer_code, department, class_name, faculty)
VALUES
-- Quản trị viên & Giảng viên
('admin@ptit', 'ptitcstranphu@123', 'Quản trị viên PTIT', 'admin@ptit.edu.vn', 'admin', '/default-avatar.png', NULL, NULL, 'Trung tâm Quản trị Mạng - Cơ sở Trần Phú', NULL, NULL),
('hienntt', 'khoavt1@123', 'TS. Nguyễn Thị Thu Hiền', 'Hienntt@ptit.edu.vn', 'lecturer', '/default-avatar.png', NULL, 'GV2001', 'Khoa Viễn thông 1', NULL, 'Khoa Viễn thông 1'),
-- 46 Sinh viên chính thức (Đăng nhập: Mã SV / Mật khẩu: ptit@123)
('B23DCVT022', 'ptit@123', 'Nguyễn Đức Anh', 'b23dcvt022@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT022', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1'),
('B23DCVT025', 'ptit@123', 'Nguyễn Nhật Anh', 'b23dcvt025@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT025', NULL, 'D23CQVT01-B', 'D23CQVT01-B', 'Khoa Viễn thông 1'),
('B23DCVT030', 'ptit@123', 'Nguyễn Văn Anh', 'b23dcvt030@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT030', NULL, 'D23CQVT06-B', 'D23CQVT06-B', 'Khoa Viễn thông 1'),
('B23DCVT036', 'ptit@123', 'Vũ Hải Anh', 'b23dcvt036@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT036', NULL, 'D23CQVT06-B', 'D23CQVT06-B', 'Khoa Viễn thông 1'),
('B23DCVT065', 'ptit@123', 'Nguyễn Hùng Cương', 'b23dcvt065@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT065', NULL, 'D23CQVT05-B', 'D23CQVT05-B', 'Khoa Viễn thông 1'),
('B23DCVT070', 'ptit@123', 'Nguyễn Như Đại', 'b23dcvt070@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT070', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1'),
('B23DCVT100', 'ptit@123', 'Vũ Anh Đức', 'b23dcvt100@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT100', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1'),
('B23DCVT124', 'ptit@123', 'Lưu Hoàng Giang', 'b23dcvt124@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT124', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1'),
('B23DCVT129', 'ptit@123', 'Trần Quang Hà', 'b23dcvt129@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT129', NULL, 'D23CQVT03-B', 'D23CQVT03-B', 'Khoa Viễn thông 1'),
('B23DCVT130', 'ptit@123', 'Đoàn Phúc Hải', 'b23dcvt130@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT130', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1'),
('B23DCVT139', 'ptit@123', 'Trương Công Hải', 'b23dcvt139@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT139', NULL, 'D23CQVT01-B', 'D23CQVT01-B', 'Khoa Viễn thông 1'),
('B23DCVT149', 'ptit@123', 'Vũ Quang Hiệp', 'b23dcvt149@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT149', NULL, 'D23CQVT05-B', 'D23CQVT05-B', 'Khoa Viễn thông 1'),
('B23DCVT162', 'ptit@123', 'Quách Trung Hiếu', 'b23dcvt162@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT162', NULL, 'D23CQVT06-B', 'D23CQVT06-B', 'Khoa Viễn thông 1'),
('B23DCVT166', 'ptit@123', 'Đỗ Minh Hoàng', 'b23dcvt166@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT166', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1'),
('B23DCVT169', 'ptit@123', 'Hà Việt Hoàng', 'b23dcvt169@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT169', NULL, 'D23CQVT01-B', 'D23CQVT01-B', 'Khoa Viễn thông 1'),
('B23DCVT211', 'ptit@123', 'Nguyễn Ngọc Huy', 'b23dcvt211@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT211', NULL, 'D23CQVT01-B', 'D23CQVT01-B', 'Khoa Viễn thông 1'),
('B23DCVT214', 'ptit@123', 'Trương Quang Huy', 'b23dcvt214@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT214', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1'),
('B23DCVT194', 'ptit@123', 'Nguyễn Mạnh Hưng', 'b23dcvt194@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT194', NULL, 'D23CQVT02-B', 'D23CQVT02-B', 'Khoa Viễn thông 1'),
('B23DCVT199', 'ptit@123', 'Thái Bá Hưng', 'b23dcvt199@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT199', NULL, 'D23CQVT01-B', 'D23CQVT01-B', 'Khoa Viễn thông 1'),
('B23DCVT202', 'ptit@123', 'Trịnh Ngọc Hường', 'b23dcvt202@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT202', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1'),
('B23DCVT246', 'ptit@123', 'Trần Trung Kiên', 'b23dcvt246@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT246', NULL, 'D23CQVT06-B', 'D23CQVT06-B', 'Khoa Viễn thông 1'),
('B23DCVT268', 'ptit@123', 'Đặng Công Minh', 'b23dcvt268@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT268', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1'),
('B23DCVT272', 'ptit@123', 'Hoàng Quang Minh', 'b23dcvt272@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT272', NULL, 'D23CQVT02-B', 'D23CQVT02-B', 'Khoa Viễn thông 1'),
('B23DCVT284', 'ptit@123', 'Phan Huy Minh', 'b23dcvt284@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT284', NULL, 'D23CQVT02-B', 'D23CQVT02-B', 'Khoa Viễn thông 1'),
('B23DCVT288', 'ptit@123', 'Vũ Quang Minh', 'b23dcvt288@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT288', NULL, 'D23CQVT06-B', 'D23CQVT06-B', 'Khoa Viễn thông 1'),
('B23DCVT297', 'ptit@123', 'Nguyễn Phương Nam', 'b23dcvt297@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT297', NULL, 'D23CQVT03-B', 'D23CQVT03-B', 'Khoa Viễn thông 1'),
('B23DCVT312', 'ptit@123', 'Hoàng Ngọc Trung Nguyên', 'b23dcvt312@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT312', NULL, 'D23CQVT06-B', 'D23CQVT06-B', 'Khoa Viễn thông 1'),
('B23DCVT327', 'ptit@123', 'Lê Hoàng Phong', 'b23dcvt327@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT327', NULL, 'D23CQVT03-B', 'D23CQVT03-B', 'Khoa Viễn thông 1'),
('B23DCVT334', 'ptit@123', 'Trần Xuân Phú', 'b23dcvt334@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT334', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1'),
('B23DCVT338', 'ptit@123', 'Mai Xuân Phúc', 'b23dcvt338@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT338', NULL, 'D23CQVT02-B', 'D23CQVT02-B', 'Khoa Viễn thông 1'),
('B23DCVT347', 'ptit@123', 'Đinh Tiến Quân', 'b23dcvt347@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT347', NULL, 'D23CQVT05-B', 'D23CQVT05-B', 'Khoa Viễn thông 1'),
('B23DCVT350', 'ptit@123', 'Lê Minh Quân', 'b23dcvt350@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT350', NULL, 'D23CQVT02-B', 'D23CQVT02-B', 'Khoa Viễn thông 1'),
('B23DCVT352', 'ptit@123', 'Trần Hùng Quân', 'b23dcvt352@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT352', NULL, 'D23CQVT06-B', 'D23CQVT06-B', 'Khoa Viễn thông 1'),
('B23DCVT369', 'ptit@123', 'Nguyễn Tiến Sang', 'b23dcvt369@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT369', NULL, 'D23CQVT03-B', 'D23CQVT03-B', 'Khoa Viễn thông 1'),
('B23DCVT385', 'ptit@123', 'Nguyễn Danh Tây', 'b23dcvt385@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT385', NULL, 'D23CQVT01-B', 'D23CQVT01-B', 'Khoa Viễn thông 1'),
('B23DCVT386', 'ptit@123', 'Đỗ Đại Thái', 'b23dcvt386@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT386', NULL, 'D23CQVT02-B', 'D23CQVT02-B', 'Khoa Viễn thông 1'),
('B23DCVT388', 'ptit@123', 'Nguyễn Minh Thái', 'b23dcvt388@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT388', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1'),
('B23DCVT398', 'ptit@123', 'Nguyễn Duy Thành', 'b23dcvt398@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT398', NULL, 'D23CQVT02-B', 'D23CQVT02-B', 'Khoa Viễn thông 1'),
('B23DCVT400', 'ptit@123', 'Vũ Tiến Thành', 'b23dcvt400@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT400', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1'),
('B23DCVT401', 'ptit@123', 'Vũ Tuấn Thành', 'b23dcvt401@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT401', NULL, 'D23CQVT05-B', 'D23CQVT05-B', 'Khoa Viễn thông 1'),
('B23DCVT406', 'ptit@123', 'Nguyễn Quốc Thịnh', 'b23dcvt406@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT406', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1'),
('B23DCVT409', 'ptit@123', 'Đinh Quốc Thuận', 'b23dcvt409@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT409', NULL, 'D23CQVT01-B', 'D23CQVT01-B', 'Khoa Viễn thông 1'),
('B23DCVT439', 'ptit@123', 'Ngô Quang Tuấn', 'b23dcvt439@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT439', NULL, 'D23CQVT01-B', 'D23CQVT01-B', 'Khoa Viễn thông 1'),
('B23DCVT446', 'ptit@123', 'Cao Thanh Tùng', 'b23dcvt446@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT446', NULL, 'D23CQVT02-B', 'D23CQVT02-B', 'Khoa Viễn thông 1'),
('B23DCVT459', 'ptit@123', 'Đỗ Quang Vinh', 'b23dcvt459@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT459', NULL, 'D23CQVT03-B', 'D23CQVT03-B', 'Khoa Viễn thông 1'),
('B23DCVT472', 'ptit@123', 'Phan Thị Bảo Yến', 'b23dcvt472@stu.ptit.edu.vn', 'student', '/default-avatar.png', 'B23DCVT472', NULL, 'D23CQVT04-B', 'D23CQVT04-B', 'Khoa Viễn thông 1')
ON CONFLICT (username) DO NOTHING;
