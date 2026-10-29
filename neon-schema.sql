-- =======================================================
-- NEON SERVERLESS POSTGRESQL DATABASE SCHEMA
-- Project: PTIT Student & Grade Management System
-- =======================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Students Table (Bảng Sinh viên)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    avatar_url TEXT,
    major VARCHAR(100) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    cumulative_gpa NUMERIC(3,2) DEFAULT 0.00,
    target_gpa NUMERIC(3,2) DEFAULT 3.50,
    earned_credits INT DEFAULT 0,
    required_credits INT DEFAULT 140,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by student code
CREATE INDEX IF NOT EXISTS idx_students_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_name);

-- 2. Courses Table (Bảng Học phần)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    credits INT NOT NULL,
    instructor VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    schedule VARCHAR(100) NOT NULL,
    room VARCHAR(50) NOT NULL,
    enrolled INT DEFAULT 0,
    capacity INT DEFAULT 50,
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);

-- 3. Grades Table (Bảng Điểm học phần)
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    attendance_grade NUMERIC(4,2) DEFAULT 0.00,
    midterm_grade NUMERIC(4,2) DEFAULT 0.00,
    exam_grade NUMERIC(4,2) DEFAULT 0.00,
    final_grade NUMERIC(4,2) DEFAULT 0.00,
    letter_grade VARCHAR(5) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'passed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_course_semester UNIQUE(student_id, course_id, semester)
);

CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_course ON grades(course_id);

-- 4. Announcements Table (Bảng Thông báo)
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_urgent BOOLEAN DEFAULT FALSE,
    time_ago VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Users Table (Bảng Tài khoản & Phân quyền Hệ thống)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'lecturer', 'admin')),
    avatar_url TEXT,
    student_code VARCHAR(20),
    lecturer_code VARCHAR(20),
    department VARCHAR(100),
    class_name VARCHAR(50),
    faculty VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

