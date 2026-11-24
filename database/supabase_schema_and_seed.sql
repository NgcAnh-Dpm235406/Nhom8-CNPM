-- =============================================================================
-- TRƯỜNG ĐẠI HỌC AN GIANG - ĐẠI HỌC QUỐC GIA TP. HỒ CHÍ MINH (AGU - VNU-HCM)
-- HỆ THỐNG QUẢN LÝ ĐÀO TẠO SAU ĐẠI HỌC - BẬC THẠC SĨ (AGU MASTER SYSTEM)
-- Hệ quản trị CSDL: PostgreSQL 14+ / Supabase (Codespaces Compatible)
-- Nhóm thực hiện: Nhóm 8 - CNPM (Khoa Công nghệ Thông tin - AGU)
-- =============================================================================

-- Tùy chọn drop schema để tạo mới sạch sẽ
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
SET search_path TO public;

-- =============================================================================
-- PHẦN 1: HỆ THỐNG, TÀI KHOẢN & PHÂN QUYỀN (RBAC)
-- =============================================================================

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_code VARCHAR(50) NOT NULL UNIQUE, -- 'STUDENT', 'LECTURER', 'ADMIN', 'ACCOUNTANT'
    role_name VARCHAR(100) NOT NULL
);

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role_id INT NOT NULL REFERENCES roles(role_id),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Locked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id BIGINT,
    old_data TEXT,
    new_data TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role_id INT REFERENCES roles(role_id) ON DELETE SET NULL,
    target_user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PHẦN 2: TUYỂN SINH THẠC SĨ AGU
-- =============================================================================

CREATE TABLE admission_leads (
    lead_id BIGSERIAL PRIMARY KEY,
    info_requested VARCHAR(255) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Nam', 'Nữ', 'Khác')),
    interested_major VARCHAR(100),
    undergrad_major VARCHAR(150),
    grad_year INT,
    note VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admission_campaigns (
    campaign_id SERIAL PRIMARY KEY,
    campaign_name VARCHAR(150) NOT NULL,
    academic_year INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

CREATE TABLE majors (
    major_id SERIAL PRIMARY KEY,
    major_code VARCHAR(20) NOT NULL UNIQUE,
    major_name VARCHAR(150) NOT NULL
);

CREATE TABLE admission_profiles (
    profile_id BIGSERIAL PRIMARY KEY,
    campaign_id INT NOT NULL REFERENCES admission_campaigns(campaign_id) ON DELETE CASCADE,
    major_id INT REFERENCES majors(major_id),
    full_name VARCHAR(150) NOT NULL,
    dob DATE NOT NULL,
    id_card_number VARCHAR(20) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL,
    address TEXT,
    undergrad_degree_file VARCHAR(255),
    status VARCHAR(30) DEFAULT 'Chờ xét duyệt' CHECK (status IN ('Chờ xét duyệt', 'Đạt yêu cầu', 'Không đạt', 'Cần bổ sung')),
    admission_status VARCHAR(30) DEFAULT 'Chưa trúng tuyển' CHECK (admission_status IN ('Chưa trúng tuyển', 'Trúng tuyển', 'Đã nhập học')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_profile_campaign UNIQUE (id_card_number, campaign_id)
);

-- =============================================================================
-- PHẦN 3: CHƯƠNG TRÌNH ĐÀO TẠO THẠC SĨ AGU & GIẢNG VIÊN HƯỚNG DẪN
-- =============================================================================

CREATE TABLE curriculums (
    curriculum_id SERIAL PRIMARY KEY,
    major_id INT NOT NULL REFERENCES majors(major_id),
    cohort VARCHAR(20) NOT NULL,
    orientation VARCHAR(20) NOT NULL CHECK (orientation IN ('Ứng dụng', 'Nghiên cứu')),
    total_credits INT NOT NULL DEFAULT 60,
    version VARCHAR(20) NOT NULL
);

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(150) NOT NULL,
    credits INT NOT NULL,
    prerequisite_course_id INT REFERENCES courses(course_id)
);

CREATE TABLE curriculum_courses (
    curriculum_course_id SERIAL PRIMARY KEY,
    curriculum_id INT NOT NULL REFERENCES curriculums(curriculum_id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(course_id),
    course_type VARCHAR(20) NOT NULL CHECK (course_type IN ('Bắt buộc', 'Tự chọn')),
    recommended_semester INT NOT NULL
);

CREATE TABLE lecturers (
    lecturer_id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    lecturer_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    degree VARCHAR(30) NOT NULL CHECK (degree IN ('Tiến sĩ', 'Phó Giáo sư', 'Giáo sư')),
    max_slots INT NOT NULL DEFAULT 4,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(15)
);

CREATE TABLE semesters (
    semester_id SERIAL PRIMARY KEY,
    semester_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_grade_locked BOOLEAN DEFAULT FALSE
);

CREATE TABLE course_classes (
    class_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(course_id),
    semester_id INT NOT NULL REFERENCES semesters(semester_id),
    class_name VARCHAR(100) NOT NULL,
    max_students INT NOT NULL DEFAULT 35,
    status VARCHAR(20) DEFAULT 'Mở đăng ký' CHECK (status IN ('Mở đăng ký', 'Đã chốt', 'Đã hủy'))
);

CREATE TABLE schedules (
    schedule_id BIGSERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES course_classes(class_id) ON DELETE CASCADE,
    lecturer_id INT NOT NULL REFERENCES lecturers(lecturer_id),
    room_name VARCHAR(50) NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 2 AND 8),
    start_shift INT NOT NULL,
    end_shift INT NOT NULL
);

-- =============================================================================
-- PHÂN HỆ 4: HỌC VIÊN THẠC SĨ AGU & TÀI CHÍNH
-- =============================================================================

CREATE TABLE students (
    student_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    student_code VARCHAR(20) NOT NULL UNIQUE,
    profile_id BIGINT NOT NULL UNIQUE REFERENCES admission_profiles(profile_id),
    curriculum_id INT NOT NULL REFERENCES curriculums(curriculum_id),
    academic_status VARCHAR(30) DEFAULT 'Đang học' CHECK (academic_status IN ('Đang học', 'Bảo lưu', 'Tốt nghiệp', 'Đã tốt nghiệp', 'Thôi học', 'Buộc thôi học', 'Đình chỉ')),
    enrollment_date DATE NOT NULL
);

CREATE TABLE tuition_fees (
    tuition_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    semester_id INT NOT NULL REFERENCES semesters(semester_id),
    base_amount NUMERIC(12,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_amount NUMERIC(12,2) DEFAULT 0.00,
    late_penalty_fee NUMERIC(12,2) DEFAULT 0.00,
    outstanding_balance NUMERIC(12,2) GENERATED ALWAYS AS (base_amount + late_penalty_fee - paid_amount) STORED,
    status VARCHAR(30) DEFAULT 'Chưa thanh toán' CHECK (status IN ('Chưa thanh toán', 'Đã thanh toán một phần', 'Hoàn thành')),
    payment_slip_file VARCHAR(255),
    payment_slip_status VARCHAR(30) CHECK (payment_slip_status IS NULL OR payment_slip_status IN ('Chờ xác nhận', 'Đã xác nhận', 'Từ chối')),
    payment_slip_submitted_at TIMESTAMP,
    payment_slip_note VARCHAR(500)
);

CREATE TABLE course_registrations (
    registration_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    class_id INT NOT NULL REFERENCES course_classes(class_id) ON DELETE CASCADE,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_class UNIQUE (student_id, class_id)
);

CREATE TABLE student_grades (
    grade_id BIGSERIAL PRIMARY KEY,
    registration_id BIGINT NOT NULL UNIQUE REFERENCES course_registrations(registration_id) ON DELETE CASCADE,
    process_grade NUMERIC(4,2) CHECK (process_grade BETWEEN 0 AND 10),
    exam_grade NUMERIC(4,2) CHECK (exam_grade BETWEEN 0 AND 10),
    final_grade NUMERIC(4,2) CHECK (final_grade BETWEEN 0 AND 10),
    is_locked BOOLEAN DEFAULT FALSE
);

-- =============================================================================
-- PHÂN HỆ 5: LUẬN VĂN THẠC SĨ AGU, TIẾN ĐỘ 5 BƯỚC & CHUẨN ĐẦU RA
-- =============================================================================

CREATE TABLE advisor_assignments (
    advisor_assignment_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    lecturer_id INT NOT NULL REFERENCES lecturers(lecturer_id),
    role VARCHAR(30) NOT NULL DEFAULT 'Hướng dẫn chính' CHECK (role IN ('Hướng dẫn chính', 'Đồng hướng dẫn')),
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) DEFAULT 'Chờ GVHD duyệt' CHECK (status IN ('Chờ GVHD duyệt', 'Đang hướng dẫn', 'Đã hoàn thành', 'Từ chối', 'Đã hủy'))
);

CREATE TABLE thesis_progress (
    thesis_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL UNIQUE REFERENCES students(student_id) ON DELETE CASCADE,
    thesis_title VARCHAR(500) NOT NULL,
    current_stage VARCHAR(50) DEFAULT 'Bảo vệ đề cương' CHECK (current_stage IN (
        'Đăng ký đề tài', 
        'Bảo vệ đề cương', 
        'Báo cáo tiến độ lần 1', 
        'Báo cáo tiến độ lần 2', 
        'Nộp bản thảo', 
        'Bảo vệ chính thức',
        'Hoàn thành'
    )),
    progress_percent INT DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
    status VARCHAR(30) DEFAULT 'Chờ GVHD duyệt' CHECK (status IN ('Chờ GVHD duyệt', 'Đã duyệt', 'Từ chối', 'Đang thực hiện', 'Hoàn thành')),
    rejection_reason TEXT
);

CREATE TABLE thesis_submissions (
    submission_id BIGSERIAL PRIMARY KEY,
    thesis_id BIGINT NOT NULL REFERENCES thesis_progress(thesis_id) ON DELETE CASCADE,
    stage_name VARCHAR(50) NOT NULL,
    report_file_url VARCHAR(255) NOT NULL,
    deadline DATE NOT NULL,
    submitted_at TIMESTAMP,
    lecturer_feedback TEXT,
    color_warning VARCHAR(10) DEFAULT 'green' CHECK (color_warning IN ('green', 'yellow', 'red')),
    status VARCHAR(30) DEFAULT 'Chờ đánh giá' CHECK (status IN ('Chờ đánh giá', 'Đạt', 'Cần sửa đổi'))
);

CREATE TABLE turnitin_checks (
    check_id BIGSERIAL PRIMARY KEY,
    thesis_id BIGINT NOT NULL REFERENCES thesis_progress(thesis_id) ON DELETE CASCADE,
    file_url VARCHAR(255) NOT NULL,
    similarity_score NUMERIC(5,2) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Đạt', 'Cảnh báo', 'Không đạt')),
    explanation_file VARCHAR(255),
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scientific_publications (
    publication_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    paper_title VARCHAR(500) NOT NULL,
    journal_name VARCHAR(255) NOT NULL,
    issn_isbn VARCHAR(50),
    paper_url VARCHAR(500),
    ranking VARCHAR(30) NOT NULL CHECK (ranking IN ('Tạp chí KH ĐH An Giang', 'HĐGSNN', 'Scopus/WoS', 'Hội nghị SĐH')),
    points NUMERIC(4,2) NOT NULL DEFAULT 0.00,
    evidence_file VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'Chờ thẩm định' CHECK (status IN ('Chờ thẩm định', 'Đạt', 'Không đạt')),
    admin_note VARCHAR(500)
);

CREATE TABLE language_certificates (
    cert_id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    cert_type VARCHAR(50) NOT NULL,
    score_achieved VARCHAR(20) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    certificate_file_url VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'Chờ xét duyệt' CHECK (status IN ('Chờ xét duyệt', 'Đạt yêu cầu', 'Không hợp lệ')),
    admin_note VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PHÂN HỆ 6: HỘI ĐỒNG BẢO VỆ LUẬN VĂN THẠC SĨ TẠI AGU (5 THÀNH VIÊN)
-- =============================================================================

CREATE TABLE defense_committees (
    committee_id SERIAL PRIMARY KEY,
    committee_name VARCHAR(150) NOT NULL,
    defense_date DATE NOT NULL,
    defense_room VARCHAR(100) NOT NULL,
    president_id INT NOT NULL REFERENCES lecturers(lecturer_id),
    reviewer_1_id INT NOT NULL REFERENCES lecturers(lecturer_id),
    reviewer_2_id INT NOT NULL REFERENCES lecturers(lecturer_id),
    secretary_id INT NOT NULL REFERENCES lecturers(lecturer_id),
    member_id INT NOT NULL REFERENCES lecturers(lecturer_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE thesis_defense_schedules (
    defense_schedule_id BIGSERIAL PRIMARY KEY,
    thesis_id BIGINT NOT NULL UNIQUE REFERENCES thesis_progress(thesis_id) ON DELETE CASCADE,
    committee_id INT NOT NULL REFERENCES defense_committees(committee_id),
    defense_order INT NOT NULL DEFAULT 1,
    start_time TIME NOT NULL,
    average_score NUMERIC(4,2) CHECK (average_score BETWEEN 0 AND 10),
    result VARCHAR(20) DEFAULT 'Chưa bảo vệ' CHECK (result IN ('Chưa bảo vệ', 'Đạt', 'Không đạt'))
);

CREATE TABLE defense_evaluations (
    evaluation_id BIGSERIAL PRIMARY KEY,
    defense_schedule_id BIGINT NOT NULL REFERENCES thesis_defense_schedules(defense_schedule_id) ON DELETE CASCADE,
    lecturer_id INT NOT NULL REFERENCES lecturers(lecturer_id),
    role_in_committee VARCHAR(50) NOT NULL CHECK (role_in_committee IN ('Chủ tịch', 'Phản biện 1', 'Phản biện 2', 'Thư ký', 'Ủy viên')),
    content_score NUMERIC(4,2) NOT NULL CHECK (content_score BETWEEN 0 AND 5.0),
    presentation_score NUMERIC(4,2) NOT NULL CHECK (presentation_score BETWEEN 0 AND 2.5),
    qa_score NUMERIC(4,2) NOT NULL CHECK (qa_score BETWEEN 0 AND 2.5),
    total_score NUMERIC(4,2) GENERATED ALWAYS AS (content_score + presentation_score + qa_score) STORED,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_eval_schedule_lec UNIQUE (defense_schedule_id, lecturer_id)
);

-- =============================================================================
-- PHÂN HỆ 7: KHẢO SÁT CHẤT LƯỢNG ĐÀO TẠO THẠC SĨ (QA AGU)
-- =============================================================================

CREATE TABLE qa_survey_templates (
    template_id SERIAL PRIMARY KEY,
    template_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    survey_type VARCHAR(20) NOT NULL CHECK (survey_type IN ('Học phần', 'Luận văn', 'Tốt nghiệp')),
    is_published BOOLEAN DEFAULT FALSE
);

CREATE TABLE qa_survey_questions (
    question_id SERIAL PRIMARY KEY,
    template_id INT NOT NULL REFERENCES qa_survey_templates(template_id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    scale_type VARCHAR(50) DEFAULT 'Likert 5'
);

CREATE TABLE qa_survey_campaigns (
    campaign_id SERIAL PRIMARY KEY,
    template_id INT NOT NULL REFERENCES qa_survey_templates(template_id) ON DELETE CASCADE,
    class_id INT REFERENCES course_classes(class_id) ON DELETE SET NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL
);

CREATE TABLE qa_survey_responses (
    response_id BIGSERIAL PRIMARY KEY,
    campaign_id INT NOT NULL REFERENCES qa_survey_campaigns(campaign_id) ON DELETE CASCADE,
    anonymous_token VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE qa_survey_details (
    detail_id BIGSERIAL PRIMARY KEY,
    response_id BIGINT NOT NULL REFERENCES qa_survey_responses(response_id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES qa_survey_questions(question_id),
    rating_score INT NOT NULL CHECK (rating_score BETWEEN 1 AND 5)
);

-- =============================================================================
-- PHẦN 8: TRIGGERS & FUNCTIONS ĐẶC THÙ AGU (PL/pgSQL)
-- =============================================================================

-- 1. Trigger kiểm tra học vị giảng viên (Tiến sĩ trở lên)
CREATE OR REPLACE FUNCTION fn_check_lecturer_degree_before_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_degree VARCHAR(30);
BEGIN
    SELECT degree INTO v_degree FROM lecturers WHERE lecturer_id = NEW.lecturer_id;
    IF v_degree NOT IN ('Tiến sĩ', 'Phó Giáo sư', 'Giáo sư') THEN
        RAISE EXCEPTION 'Quy chế Sau Đại học AGU: Giảng viên tham gia giảng dạy/hướng dẫn Thạc sĩ bắt buộc có học vị Tiến sĩ trở lên!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_lecturer_degree_before_assignment ON schedules;
CREATE TRIGGER trg_check_lecturer_degree_before_assignment
BEFORE INSERT OR UPDATE ON schedules
FOR EACH ROW EXECUTE FUNCTION fn_check_lecturer_degree_before_assignment();

-- 2. Hàm tính điểm trung bình bảo vệ luận văn & cập nhật kết quả
CREATE OR REPLACE FUNCTION sp_calculate_defense_final_grade(p_defense_schedule_id BIGINT)
RETURNS VOID AS $$
DECLARE
    v_avg_score NUMERIC(4,2);
    v_submitted_count INT;
    v_thesis_id BIGINT;
    v_result VARCHAR(20);
BEGIN
    SELECT COUNT(*), ROUND(AVG(total_score), 2)
    INTO v_submitted_count, v_avg_score
    FROM defense_evaluations
    WHERE defense_schedule_id = p_defense_schedule_id;

    IF v_submitted_count >= 3 THEN
        IF v_avg_score >= 5.50 THEN
            v_result := 'Đạt';
        ELSE
            v_result := 'Không đạt';
        END IF;

        UPDATE thesis_defense_schedules
        SET average_score = v_avg_score,
            result = v_result
        WHERE defense_schedule_id = p_defense_schedule_id
        RETURNING thesis_id INTO v_thesis_id;

        IF v_result = 'Đạt' THEN
            UPDATE thesis_progress
            SET current_stage = 'Hoàn thành',
                progress_percent = 100,
                status = 'Hoàn thành'
            WHERE thesis_id = v_thesis_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Hàm kiểm tra điều kiện bảo vệ (Gatekeeper)
CREATE OR REPLACE FUNCTION fn_check_thesis_defense_gatekeeper(p_student_id BIGINT)
RETURNS TABLE (
    is_eligible BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_unpaid_tuition NUMERIC(12,2);
    v_turnitin_score NUMERIC(5,2);
    v_approved_papers INT;
    v_approved_lang_cert INT;
    v_msg TEXT := '';
    v_ok BOOLEAN := TRUE;
BEGIN
    -- 1. Kiểm tra nợ học phí
    SELECT COALESCE(SUM(outstanding_balance), 0)
    INTO v_unpaid_tuition
    FROM tuition_fees
    WHERE student_id = p_student_id;

    IF v_unpaid_tuition > 0 THEN
        v_ok := FALSE;
        v_msg := v_msg || '[Chặn] Học viên còn nợ học phí: ' || TO_CHAR(v_unpaid_tuition, 'FM999,999,999') || ' VNĐ. ';
    END IF;

    -- 2. Kiểm tra Turnitin (<= 20%)
    SELECT tc.similarity_score
    INTO v_turnitin_score
    FROM turnitin_checks tc
    JOIN thesis_progress tp ON tc.thesis_id = tp.thesis_id
    WHERE tp.student_id = p_student_id
    ORDER BY tc.checked_at DESC
    LIMIT 1;

    IF v_turnitin_score IS NULL OR v_turnitin_score > 20.00 THEN
        v_ok := FALSE;
        v_msg := v_msg || '[Chặn] Tỷ lệ trùng lặp Turnitin vượt quá quy chế <= 20% (Hiện tại: ' || COALESCE(v_turnitin_score::TEXT, 'Chưa nộp') || '%). ';
    END IF;

    -- 3. Kiểm tra Bài báo NCKH (>= 1 bài Đạt)
    SELECT COUNT(*)
    INTO v_approved_papers
    FROM scientific_publications
    WHERE student_id = p_student_id AND status = 'Đạt';

    IF v_approved_papers < 1 THEN
        v_ok := FALSE;
        v_msg := v_msg || '[Chặn] Chưa có bài báo khoa học được nghiệm thu (Yêu cầu: 1 bài). ';
    END IF;

    -- 4. Kiểm tra Chứng chỉ Tiếng Anh Chuẩn đầu ra
    SELECT COUNT(*)
    INTO v_approved_lang_cert
    FROM language_certificates
    WHERE student_id = p_student_id AND status = 'Đạt yêu cầu';

    IF v_approved_lang_cert < 1 THEN
        v_ok := FALSE;
        v_msg := v_msg || '[Chặn] Chưa có Chứng chỉ tiếng Anh Chuẩn đầu ra Thạc sĩ (VSTEP Bậc 4). ';
    END IF;

    IF v_ok THEN
        v_msg := 'Đủ điều kiện tiêu chuẩn bảo vệ luận văn Thạc sĩ tại ĐH An Giang.';
    END IF;

    RETURN QUERY SELECT v_ok, v_msg;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PHẦN 9: BỘ DỮ LIỆU MẪU CHUẨN (SEED DATA)
-- =============================================================================

-- 1. Vai trò (Roles)
INSERT INTO roles (role_code, role_name) VALUES 
('ADMIN', 'Phòng Đào tạo Sau Đại học (Admin)'),
('LECTURER', 'Giảng viên Hướng dẫn / Hội đồng'),
('STUDENT', 'Học viên Cao học Thạc sĩ'),
('ACCOUNTANT', 'Phòng Kế hoạch - Tài chính (Kế toán)');

-- 2. Ngành Đào tạo Thạc sĩ thực tế tại AGU
INSERT INTO majors (major_code, major_name) VALUES
('8480205', 'Kỹ thuật phần mềm (Software Engineering)'),
('8480101', 'Khoa học máy tính (Computer Science)'),
('8340101', 'Quản trị kinh doanh (Business Administration)'),
('8620110', 'Khoa học cây trồng (Crop Science)'),
('8140111', 'Lý luận và PPDH bộ môn Toán (Mathematics Education)');

-- 3. Chương trình đào tạo (Curriculums)
INSERT INTO curriculums (major_id, cohort, orientation, total_credits, version) VALUES
(1, 'K2024-2026', 'Ứng dụng', 60, 'AGU-KTPM-2024'),
(2, 'K2024-2026', 'Nghiên cứu', 60, 'AGU-KHMT-2024');

-- 4. Tài khoản người dùng (Users) - Mật khẩu thật: '123456'
-- Bcrypt hash thật: $2b$10$zHFXCDK4p7kzE19dOT3j7.7/TCqLtt9rHDh3VCdNxVm9KotEksEGm
INSERT INTO users (username, password_hash, email, role_id) VALUES
('admin_sdh', '$2b$10$zHFXCDK4p7kzE19dOT3j7.7/TCqLtt9rHDh3VCdNxVm9KotEksEGm', 'sdh@agu.edu.vn', 1),
('gv_doanthanhnghi', '$2b$10$zHFXCDK4p7kzE19dOT3j7.7/TCqLtt9rHDh3VCdNxVm9KotEksEGm', 'dtnghi@agu.edu.vn', 2),
('gv_nguyencongtru', '$2b$10$zHFXCDK4p7kzE19dOT3j7.7/TCqLtt9rHDh3VCdNxVm9KotEksEGm', 'nctru@agu.edu.vn', 2),
('gv_huynhphuochai', '$2b$10$zHFXCDK4p7kzE19dOT3j7.7/TCqLtt9rHDh3VCdNxVm9KotEksEGm', 'hphai@agu.edu.vn', 2),
('gv_tranvanb', '$2b$10$zHFXCDK4p7kzE19dOT3j7.7/TCqLtt9rHDh3VCdNxVm9KotEksEGm', 'tvb@agu.edu.vn', 2),
('gv_lethid', '$2b$10$zHFXCDK4p7kzE19dOT3j7.7/TCqLtt9rHDh3VCdNxVm9KotEksEGm', 'ltd@agu.edu.vn', 2),
('hv_ngan_hue', '$2b$10$zHFXCDK4p7kzE19dOT3j7.7/TCqLtt9rHDh3VCdNxVm9KotEksEGm', 'dpm235422@agu.edu.vn', 3),
('hv_huynh_hieu', '$2b$10$zHFXCDK4p7kzE19dOT3j7.7/TCqLtt9rHDh3VCdNxVm9KotEksEGm', 'dpm235419@agu.edu.vn', 3);

-- 5. Giảng viên AGU (Lecturers)
INSERT INTO lecturers (user_id, lecturer_code, full_name, degree, max_slots, email, phone) VALUES
(2, 'GV_AGU001', 'PGS.TS. Đoàn Thanh Nghị', 'Phó Giáo sư', 5, 'dtnghi@agu.edu.vn', '0912345671'),
(3, 'GV_AGU002', 'TS. Nguyễn Công Trứ', 'Tiến sĩ', 4, 'nctru@agu.edu.vn', '0912345672'),
(4, 'GV_AGU003', 'TS. Huỳnh Phước Hải', 'Tiến sĩ', 4, 'hphai@agu.edu.vn', '0912345673'),
(5, 'GV_AGU004', 'TS. Trần Văn B', 'Tiến sĩ', 4, 'tvb@agu.edu.vn', '0912345674'),
(6, 'GV_AGU005', 'TS. Lê Thị D', 'Tiến sĩ', 3, 'ltd@agu.edu.vn', '0912345675');

-- 6. Đợt tuyển sinh & Hồ sơ tuyển sinh
INSERT INTO admission_campaigns (campaign_name, academic_year, start_date, end_date) VALUES
('Tuyển sinh Cao học Đợt 1 - Năm 2024', 2024, '2024-03-01', '2024-05-30');

INSERT INTO admission_profiles (campaign_id, major_id, full_name, dob, id_card_number, phone, email, undergrad_degree_file, status, admission_status) VALUES
(1, 1, 'Nguyễn Thị Ngân Huệ', '2001-05-12', '089201004123', '0987654321', 'dpm235422@agu.edu.vn', '/uploads/Ho So Minh Chung Dao Tao Thac Si AGU.pdf', 'Đạt yêu cầu', 'Đã nhập học'),
(1, 2, 'Huỳnh Hiếu', '2001-08-20', '089201004124', '0987654322', 'dpm235419@agu.edu.vn', '/uploads/Ho So Minh Chung Dao Tao Thac Si AGU.pdf', 'Đạt yêu cầu', 'Đã nhập học');

-- 7. Học viên Thạc sĩ (Students)
INSERT INTO students (user_id, student_code, profile_id, curriculum_id, academic_status, enrollment_date) VALUES
(7, '24M848020501', 1, 1, 'Đang học', '2024-09-01'),
(8, '24M848010101', 2, 2, 'Đang học', '2024-09-01');

-- 8. Học kỳ & Học phí Thạc sĩ AGU
INSERT INTO semesters (semester_name, start_date, end_date) VALUES 
('Học kỳ 1 (2024-2025)', '2024-09-01', '2025-01-15');

INSERT INTO tuition_fees (student_id, semester_id, base_amount, due_date, paid_amount, status) VALUES
(1, 1, 14500000.00, '2024-10-15', 14500000.00, 'Hoàn thành'),
(2, 1, 14500000.00, '2024-10-15', 14500000.00, 'Hoàn thành');

-- 9. Môn học, Khung CTĐT, Lớp học phần, Lịch học & Bảng điểm
INSERT INTO courses (course_code, course_name, credits, prerequisite_course_id) VALUES
('SDH001', 'Triết học (Cao học)', 4, NULL),
('KTPM801', 'Kiến trúc phần mềm nâng cao', 3, NULL),
('KTPM802', 'Phát triển hệ thống thông tin hiện đại', 3, 2),
('KTPM803', 'Phương pháp nghiên cứu khoa học CNTT', 3, NULL),
('KTPM804', 'Bảo mật ứng dụng và Dữ liệu lớn', 3, NULL),
('KHMT801', 'Học máy nâng cao và Học sâu', 3, NULL);

INSERT INTO curriculum_courses (curriculum_id, course_id, course_type, recommended_semester) VALUES
(1, 1, 'Bắt buộc', 1),
(1, 2, 'Bắt buộc', 1),
(1, 3, 'Bắt buộc', 2),
(1, 4, 'Bắt buộc', 1),
(1, 5, 'Tự chọn', 2),
(2, 1, 'Bắt buộc', 1),
(2, 4, 'Bắt buộc', 1),
(2, 6, 'Bắt buộc', 1);

INSERT INTO course_classes (course_id, semester_id, class_name, max_students, status) VALUES
(1, 1, 'Lớp Triết học Cao học - K24', 35, 'Mở đăng ký'),
(2, 1, 'Lớp Kiến trúc phần mềm nâng cao - K24', 30, 'Mở đăng ký'),
(4, 1, 'Lớp Phương pháp NCKH CNTT - K24', 30, 'Mở đăng ký');

INSERT INTO schedules (class_id, lecturer_id, room_name, day_of_week, start_shift, end_shift) VALUES
(1, 1, 'Phòng A201 - Khu Trung tâm AGU', 7, 1, 4),
(2, 2, 'Phòng Lab Sau Đại học - Khoa CNTT', 7, 6, 9),
(3, 3, 'Phòng B105 - Khoa CNTT', 8, 1, 4);

INSERT INTO course_registrations (student_id, class_id) VALUES (1, 1), (1, 2);

INSERT INTO student_grades (registration_id, process_grade, exam_grade, final_grade, is_locked) VALUES
(1, 8.50, 8.00, 8.20, TRUE),
(2, 9.00, 8.50, 8.70, FALSE);

-- 10. Đề tài Luận văn Thạc sĩ & Phân công GVHD
INSERT INTO thesis_progress (student_id, thesis_title, current_stage, progress_percent, status) VALUES
(1, 'Ứng dụng Microservices và AI trong Quản trị Đào tạo Sau Đại học tại Trường Đại học An Giang', 'Báo cáo tiến độ lần 2', 65, 'Đang thực hiện'),
(2, 'Xây dựng Hệ thống Kiểm soát Trùng lặp Đề tài và Đánh giá NCKH Dựa trên Xử lý Ngôn ngữ Tự nhiên', 'Bảo vệ đề cương', 25, 'Đang thực hiện');

INSERT INTO advisor_assignments (student_id, lecturer_id, role, assigned_date, status) VALUES
(1, 4, 'Hướng dẫn chính', '2024-11-01', 'Đang hướng dẫn'),
(2, 1, 'Hướng dẫn chính', '2024-11-01', 'Đang hướng dẫn');

-- 11. Tiến độ nộp bài & Cảnh báo màu Xanh/Vàng/Đỏ
INSERT INTO thesis_submissions (thesis_id, stage_name, report_file_url, deadline, submitted_at, lecturer_feedback, color_warning, status) VALUES
(1, 'Bảo vệ đề cương', '/uploads/Ho So Minh Chung Dao Tao Thac Si AGU.pdf', '2025-01-15', '2025-01-10 09:00:00', 'Đề cương rõ ràng, hướng nghiên cứu thiết thực cho AGU.', 'green', 'Đạt'),
(1, 'Báo cáo tiến độ lần 1', '/uploads/Ho So Minh Chung Dao Tao Thac Si AGU.pdf', '2025-04-20', '2025-04-18 14:30:00', 'Đã hoàn thành khảo sát cơ sở dữ liệu và kiến trúc.', 'green', 'Đạt'),
(1, 'Báo cáo tiến độ lần 2', '/uploads/Ho So Minh Chung Dao Tao Thac Si AGU.pdf', '2025-08-30', NULL, NULL, 'yellow', 'Chờ đánh giá');

-- 12. Kiểm tra Turnitin & Chuẩn đầu ra NCKH, Ngoại ngữ
INSERT INTO turnitin_checks (thesis_id, file_url, similarity_score, status) VALUES
(1, '/uploads/Ho So Minh Chung Dao Tao Thac Si AGU.pdf', 12.50, 'Đạt');

INSERT INTO scientific_publications (student_id, paper_title, journal_name, issn_isbn, paper_url, ranking, points, evidence_file, status) VALUES
(1, 'Nghiên cứu ứng dụng kiến trúc Microservices trong quản lý dữ liệu đào tạo đại học', 'Tạp chí Khoa học Trường Đại học An Giang', '0866-8086', 'https://sj.agu.edu.vn/article/view/1234', 'Tạp chí KH ĐH An Giang', 0.50, '/uploads/Ho So Minh Chung Dao Tao Thac Si AGU.pdf', 'Đạt');

INSERT INTO language_certificates (student_id, cert_type, score_achieved, issue_date, certificate_file_url, status) VALUES
(1, 'VSTEP Bậc 4 (B2 ĐHQG-HCM)', 'Bậc 4 (6.5/10)', '2024-12-10', '/uploads/Ho So Minh Chung Dao Tao Thac Si AGU.pdf', 'Đạt yêu cầu');

-- 13. Hội đồng Bảo vệ Luận văn Thạc sĩ tại AGU (Chuẩn 5 Thầy Cô)
INSERT INTO defense_committees (committee_name, defense_date, defense_room, president_id, reviewer_1_id, reviewer_2_id, secretary_id, member_id) VALUES
('Hội đồng Đánh giá Luận văn Thạc sĩ Ngành KTPM - Đợt 1', '2025-11-20', 'Phòng Hội thảo 1 - Khu Hiệu bộ AGU (18 Ung Văn Khiêm)', 1, 2, 3, 4, 5);

INSERT INTO thesis_defense_schedules (thesis_id, committee_id, defense_order, start_time, result) VALUES
(1, 1, 1, '08:30:00', 'Chưa bảo vệ');

-- 14. Thông báo hệ thống & Khảo sát chất lượng (QA Survey)
INSERT INTO notifications (title, content, target_role_id, target_user_id) VALUES
('Thông báo nộp báo cáo tiến độ luận văn đợt 2', 'Đề nghị các học viên khóa K2024-2026 hoàn tất nộp file PDF báo cáo tiến độ lần 2 đúng hạn trên hệ thống.', 3, NULL),
('Nhắc nhở kiểm tra tỷ lệ trùng lặp Turnitin', 'Quy chế đào tạo Thạc sĩ AGU yêu cầu tỷ lệ trùng lặp Turnitin <= 20% trước khi xét duyệt ra Hội đồng.', 3, 7);

INSERT INTO qa_survey_templates (template_code, title, survey_type, is_published) VALUES
('QA_HP_2026', 'Khảo sát chất lượng giảng dạy học phần Cao học', 'Học phần', TRUE);

INSERT INTO qa_survey_questions (template_id, question_text, scale_type) VALUES
(1, 'Nội dung học phần cập nhật, sát với định hướng nghiên cứu/ứng dụng Thạc sĩ.', 'Likert 5'),
(1, 'Giảng viên truyền đạt rõ ràng, hỗ trợ tốt phương pháp nghiên cứu khoa học.', 'Likert 5'),
(1, 'Tài liệu tham khảo và cơ sở vật chất phục vụ học tập đầy đủ.', 'Likert 5');

INSERT INTO qa_survey_campaigns (template_id, class_id, start_date, end_date) VALUES
(1, 1, '2024-09-01 00:00:00', '2027-12-31 23:59:59');

-- Đồng bộ giá trị sequence sau khi chèn ID cụ thể
SELECT setval('roles_role_id_seq', (SELECT MAX(role_id) FROM roles));
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
SELECT setval('majors_major_id_seq', (SELECT MAX(major_id) FROM majors));
SELECT setval('curriculums_curriculum_id_seq', (SELECT MAX(curriculum_id) FROM curriculums));
SELECT setval('courses_course_id_seq', (SELECT MAX(course_id) FROM courses));
SELECT setval('curriculum_courses_curriculum_course_id_seq', (SELECT MAX(curriculum_course_id) FROM curriculum_courses));
SELECT setval('lecturers_lecturer_id_seq', (SELECT MAX(lecturer_id) FROM lecturers));
SELECT setval('admission_campaigns_campaign_id_seq', (SELECT MAX(campaign_id) FROM admission_campaigns));
SELECT setval('admission_profiles_profile_id_seq', (SELECT MAX(profile_id) FROM admission_profiles));
SELECT setval('students_student_id_seq', (SELECT MAX(student_id) FROM students));
SELECT setval('semesters_semester_id_seq', (SELECT MAX(semester_id) FROM semesters));
SELECT setval('course_classes_class_id_seq', (SELECT MAX(class_id) FROM course_classes));
SELECT setval('schedules_schedule_id_seq', (SELECT MAX(schedule_id) FROM schedules));
SELECT setval('tuition_fees_tuition_id_seq', (SELECT MAX(tuition_id) FROM tuition_fees));
SELECT setval('course_registrations_registration_id_seq', (SELECT MAX(registration_id) FROM course_registrations));
SELECT setval('student_grades_grade_id_seq', (SELECT MAX(grade_id) FROM student_grades));
SELECT setval('thesis_progress_thesis_id_seq', (SELECT MAX(thesis_id) FROM thesis_progress));
SELECT setval('advisor_assignments_advisor_assignment_id_seq', (SELECT MAX(advisor_assignment_id) FROM advisor_assignments));
SELECT setval('thesis_submissions_submission_id_seq', (SELECT MAX(submission_id) FROM thesis_submissions));
SELECT setval('turnitin_checks_check_id_seq', (SELECT MAX(check_id) FROM turnitin_checks));
SELECT setval('scientific_publications_publication_id_seq', (SELECT MAX(publication_id) FROM scientific_publications));
SELECT setval('language_certificates_cert_id_seq', (SELECT MAX(cert_id) FROM language_certificates));
SELECT setval('defense_committees_committee_id_seq', (SELECT MAX(committee_id) FROM defense_committees));
SELECT setval('thesis_defense_schedules_defense_schedule_id_seq', (SELECT MAX(defense_schedule_id) FROM thesis_defense_schedules));
SELECT setval('qa_survey_templates_template_id_seq', (SELECT MAX(template_id) FROM qa_survey_templates));
SELECT setval('qa_survey_questions_question_id_seq', (SELECT MAX(question_id) FROM qa_survey_questions));
SELECT setval('qa_survey_campaigns_campaign_id_seq', (SELECT MAX(campaign_id) FROM qa_survey_campaigns));
