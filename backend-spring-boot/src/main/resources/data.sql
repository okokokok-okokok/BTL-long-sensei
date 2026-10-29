-- Seed Initial PTIT Data for Neon PostgreSQL Database

INSERT INTO students (id, student_code, name, email, avatar_url, major, class_name, faculty, academic_year, cumulative_gpa, target_gpa, earned_credits, required_credits)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'B21DCCN001',
    'Nguyen Van A',
    'nguyenvana.b21dccn001@ptit.edu.vn',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD0kGcr1WLxeYGYaWGrPPIpT6bqTfuyjlqYSDAVfTDPYBVOOf5bBRxuAQVvInLKa6HyTTvIvP4llC7tOtblO0Wzp2lhKhaHhKnt7y6QWYI0h_gXxkPsfV7XvLbOv8A2StxR6S7ikzXXT37LUyO05qiWl26yzAnyzRt8lYch7EADRX3cRnwbLeOngBFHLANge8tbO6NoWl6mxTEBnfjc-O8gM-YOLS8j5YkGSRHYe2Ey1b26vgosxNVs',
    'Công nghệ thông tin',
    'D21CNTT01',
    'Khoa Công nghệ thông tin 1',
    '2021 - 2025',
    3.42,
    3.50,
    96,
    140
) ON CONFLICT (student_code) DO NOTHING;

INSERT INTO courses (id, code, name, credits, instructor, department, schedule, room, enrolled, capacity, status)
VALUES 
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'INT3306', 'Lập trình Web (Web Development)', 3, 'ThS. Nguyen Thi C', 'Khoa CNTT', 'Thứ 2 (10:00 - 11:40)', 'Lab 2-A3', 42, 45, 'registered'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'INT1306', 'Cấu trúc dữ liệu và giải thuật', 4, 'Dr. Tran Van B', 'Khoa CNTT', 'Thứ 2 (08:00 - 09:40)', 'Room 301-A2', 60, 60, 'registered'),
    ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'INT3401', 'Kỹ thuật phần mềm (Software Engineering)', 3, 'TS. Pham Hoang E', 'Khoa CNTT', 'Thứ 4 (13:00 - 15:40)', 'Room 202-A2', 35, 50, 'open')
ON CONFLICT (code) DO NOTHING;

INSERT INTO announcements (title, content, is_urgent, time_ago)
VALUES 
    ('Midterm Exam Schedule Released', 'The official schedule for Fall 2024 midterms is now available on the portal. Please verify your exam rooms.', true, '2 hours ago'),
    ('Tuition Fee Deadline Notification', 'Please ensure all outstanding tuition fees for Fall Semester 2024 are settled before November 1st.', false, '1 day ago');
