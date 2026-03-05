-- ============================================================
-- AUTOMATED EXAMINATION DUTY ALLOCATION SYSTEM
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS exam_duty_db;
USE exam_duty_db;

-- USERS (Admin + Faculty login)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'faculty') NOT NULL DEFAULT 'faculty',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FACULTY PROFILES
CREATE TABLE faculty_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    experience_years INT DEFAULT 0,
    phone VARCHAR(15),
    max_duties_per_week INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- DUTY TYPES
CREATE TABLE duty_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    weight INT DEFAULT 1
);

-- EXAM SCHEDULES
CREATE TABLE exam_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(150) NOT NULL,
    subject_code VARCHAR(30),
    department VARCHAR(100) NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(100) NOT NULL,
    total_students INT DEFAULT 0,
    duties_required INT DEFAULT 2,
    status ENUM('scheduled','ongoing','completed','cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- FACULTY AVAILABILITY
CREATE TABLE availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    faculty_id INT NOT NULL,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available TINYINT(1) DEFAULT 1,
    reason VARCHAR(255),
    FOREIGN KEY (faculty_id) REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_slot (faculty_id, available_date, start_time)
);

-- DUTY ALLOCATIONS
CREATE TABLE duty_allocations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    faculty_id INT NOT NULL,
    duty_type_id INT NOT NULL,
    status ENUM('assigned','acknowledged','completed','absent') DEFAULT 'assigned',
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_id) REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (duty_type_id) REFERENCES duty_types(id),
    UNIQUE KEY unique_allocation (exam_id, faculty_id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('duty_assigned','duty_reminder','general') DEFAULT 'general',
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- ============================================================

INSERT INTO duty_types (name, description, weight) VALUES
('Invigilation', 'Monitor students during exam in the hall', 2),
('Supervision', 'Overall supervision of exam center', 3),
('Flying Squad', 'Move between halls to ensure discipline', 2),
('Evaluation', 'Evaluate answer scripts after exam', 1);

-- Admin user (password: admin123)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@exam.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Sample Faculty (password: faculty123)
INSERT INTO users (name, email, password, role) VALUES
('Dr. Priya Sharma', 'priya@exam.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty'),
('Prof. Rahul Gupta', 'rahul@exam.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty'),
('Dr. Anita Verma', 'anita@exam.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty'),
('Prof. Suresh Kumar', 'suresh@exam.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty'),
('Dr. Meena Joshi', 'meena@exam.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'faculty');

INSERT INTO faculty_profiles (user_id, employee_id, department, designation, experience_years, phone, max_duties_per_week) VALUES
(2, 'EMP001', 'Computer Science', 'Assistant Professor', 5, '9876543210', 5),
(3, 'EMP002', 'Mathematics', 'Associate Professor', 10, '9876543211', 5),
(4, 'EMP003', 'Physics', 'Assistant Professor', 3, '9876543212', 4),
(5, 'EMP004', 'Electronics', 'Professor', 15, '9876543213', 6),
(6, 'EMP005', 'Chemistry', 'Assistant Professor', 7, '9876543214', 5);

INSERT INTO exam_schedules (subject_name, subject_code, department, exam_date, start_time, end_time, venue, total_students, duties_required) VALUES
('Data Structures', 'CS301', 'Computer Science', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '09:00:00', '12:00:00', 'Hall A', 60, 2),
('Calculus', 'MA201', 'Mathematics', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '14:00:00', '17:00:00', 'Hall B', 50, 2),
('Quantum Physics', 'PH401', 'Physics', DATE_ADD(CURDATE(), INTERVAL 5 DAY), '09:00:00', '12:00:00', 'Hall C', 40, 2),
('Circuit Theory', 'EC201', 'Electronics', DATE_ADD(CURDATE(), INTERVAL 7 DAY), '10:00:00', '13:00:00', 'Hall A', 55, 3);
