-- Schema Definition for Neon Serverless PostgreSQL Database

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
    cumulative_gpa NUMERIC(3,2) DEFAULT 0.0,
    target_gpa NUMERIC(3,2) DEFAULT 3.5,
    earned_credits INT DEFAULT 0,
    required_credits INT DEFAULT 140,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    attendance_grade NUMERIC(4,2) DEFAULT 0.0,
    midterm_grade NUMERIC(4,2) DEFAULT 0.0,
    exam_grade NUMERIC(4,2) DEFAULT 0.0,
    final_grade NUMERIC(4,2) DEFAULT 0.0,
    letter_grade VARCHAR(5) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'passed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_urgent BOOLEAN DEFAULT FALSE,
    time_ago VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
