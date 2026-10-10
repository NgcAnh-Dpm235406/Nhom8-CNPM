-- =============================================================================
-- TRƯỜNG ĐẠI HỌC AN GIANG - ĐẠI HỌC QUỐC GIA TP. HỒ CHÍ MINH (AGU - VNU-HCM)
-- HỆ THỐNG QUẢN LÝ ĐÀO TẠO SAU ĐẠI HỌC - BẬC THẠC SĨ (AGU MASTER SYSTEM)
-- Hệ quản trị: Microsoft SQL Server (T-SQL) - Tự động xóa & tạo mới sạch sẽ
-- Nhóm thực hiện: Nhóm 8 - CNPM (Khoa Công nghệ Thông tin - AGU)
-- =============================================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = N'agu_postgrad_db')
BEGIN
    ALTER DATABASE agu_postgrad_db SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE agu_postgrad_db;
END
GO

CREATE DATABASE agu_postgrad_db;
GO

USE agu_postgrad_db;
GO

-- =============================================================================
-- PHẦN 1: HỆ THỐNG, TÀI KHOẢN & PHÂN QUYỀN (RBAC)
-- =============================================================================

CREATE TABLE [roles] (
    [role_id] INT IDENTITY(1,1) PRIMARY KEY,
    [role_code] VARCHAR(50) NOT NULL UNIQUE, -- 'STUDENT', 'LECTURER', 'ADMIN'
    [role_name] NVARCHAR(100) NOT NULL
);

CREATE TABLE [users] (
    [user_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [username] VARCHAR(100) NOT NULL UNIQUE,
    [password_hash] VARCHAR(255) NOT NULL,
    [email] VARCHAR(100) NOT NULL UNIQUE,
    [role_id] INT NOT NULL,
    [status] NVARCHAR(20) DEFAULT 'Active' CHECK ([status] IN ('Active', 'Inactive', 'Locked')),
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [FK_users_roles] FOREIGN KEY ([role_id]) REFERENCES [roles]([role_id])
);

CREATE TABLE [audit_logs] (
    [log_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [user_id] BIGINT NULL,
    [action] NVARCHAR(100) NOT NULL,
    [table_name] VARCHAR(50) NOT NULL,
    [record_id] BIGINT NULL,
    [old_data] NVARCHAR(MAX) NULL,
    [new_data] NVARCHAR(MAX) NULL,
    [ip_address] VARCHAR(45) NULL,
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [FK_audit_users] FOREIGN KEY ([user_id]) REFERENCES [users]([user_id]) ON DELETE SET NULL
);

CREATE TABLE [notifications] (
    [notification_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [title] NVARCHAR(255) NOT NULL,
    [content] NVARCHAR(MAX) NOT NULL,
    [target_role_id] INT NULL,
    [target_user_id] BIGINT NULL,
    [is_read] BIT DEFAULT 0,
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [FK_notif_roles] FOREIGN KEY ([target_role_id]) REFERENCES [roles]([role_id]) ON DELETE SET NULL,
    CONSTRAINT [FK_notif_users] FOREIGN KEY ([target_user_id]) REFERENCES [users]([user_id]) ON DELETE CASCADE
);

-- =============================================================================
-- PHẦN 2: TUYỂN SINH THẠC SĨ AGU
-- =============================================================================

CREATE TABLE [admission_leads] (
    [lead_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [info_requested] NVARCHAR(255) NOT NULL,
    [last_name] NVARCHAR(100) NOT NULL,
    [first_name] NVARCHAR(50) NOT NULL,
    [email] VARCHAR(100) NOT NULL,
    [phone] VARCHAR(15) NOT NULL,
    [gender] NVARCHAR(10) NULL CHECK ([gender] IN (N'Nam', N'Nữ', N'Khác')),
    [interested_major] NVARCHAR(100) NULL,
    [undergrad_major] NVARCHAR(150) NULL,
    [grad_year] INT NULL,
    [note] NVARCHAR(500) NULL,
    [created_at] DATETIME DEFAULT GETDATE()
);

CREATE TABLE [admission_campaigns] (
    [campaign_id] INT IDENTITY(1,1) PRIMARY KEY,
    [campaign_name] NVARCHAR(150) NOT NULL,
    [academic_year] INT NOT NULL,
    [start_date] DATE NOT NULL,
    [end_date] DATE NOT NULL
);

CREATE TABLE [admission_profiles] (
    [profile_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [campaign_id] INT NOT NULL,
    [full_name] NVARCHAR(150) NOT NULL,
    [dob] DATE NOT NULL,
    [id_card_number] VARCHAR(20) NOT NULL UNIQUE,
    [phone] VARCHAR(15) NOT NULL,
    [email] VARCHAR(100) NOT NULL,
    [address] NVARCHAR(MAX) NULL,
    [undergrad_degree_file] NVARCHAR(255) NULL,
    [status] NVARCHAR(30) DEFAULT N'Chờ xét duyệt' CHECK ([status] IN (N'Chờ xét duyệt', N'Đạt yêu cầu', N'Không đạt', N'Cần bổ sung')),
    [admission_status] NVARCHAR(30) DEFAULT N'Chưa trúng tuyển' CHECK ([admission_status] IN (N'Chưa trúng tuyển', N'Trúng tuyển', N'Đã nhập học')),
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [FK_profiles_campaigns] FOREIGN KEY ([campaign_id]) REFERENCES [admission_campaigns]([campaign_id]) ON DELETE CASCADE
);

-- =============================================================================
-- PHẦN 3: CHƯƠNG TRÌNH ĐÀO TẠO THẠC SĨ AGU & GIẢNG VIÊN HƯỚNG DẪN
-- =============================================================================

CREATE TABLE [majors] (
    [major_id] INT IDENTITY(1,1) PRIMARY KEY,
    [major_code] VARCHAR(20) NOT NULL UNIQUE, -- Mã ngành Bộ GD&ĐT (VD: 8480205)
    [major_name] NVARCHAR(150) NOT NULL
);

CREATE TABLE [curriculums] (
    [curriculum_id] INT IDENTITY(1,1) PRIMARY KEY,
    [major_id] INT NOT NULL,
    [cohort] VARCHAR(20) NOT NULL,                    -- Ví dụ: 'Khóa 2024 - 2026'
    [orientation] NVARCHAR(20) NOT NULL CHECK ([orientation] IN (N'Ứng dụng', N'Nghiên cứu')),
    [total_credits] INT NOT NULL DEFAULT 60,         -- Thạc sĩ chuẩn 60 tín chỉ
    [version] VARCHAR(20) NOT NULL,
    CONSTRAINT [FK_curriculums_majors] FOREIGN KEY ([major_id]) REFERENCES [majors]([major_id])
);

CREATE TABLE [courses] (
    [course_id] INT IDENTITY(1,1) PRIMARY KEY,
    [course_code] VARCHAR(20) NOT NULL UNIQUE,
    [course_name] NVARCHAR(150) NOT NULL,
    [credits] INT NOT NULL,
    [prerequisite_course_id] INT NULL,
    CONSTRAINT [FK_courses_prereq] FOREIGN KEY ([prerequisite_course_id]) REFERENCES [courses]([course_id])
);

CREATE TABLE [curriculum_courses] (
    [curriculum_course_id] INT IDENTITY(1,1) PRIMARY KEY,
    [curriculum_id] INT NOT NULL,
    [course_id] INT NOT NULL,
    [course_type] NVARCHAR(20) NOT NULL CHECK ([course_type] IN (N'Bắt buộc', N'Tự chọn')),
    [recommended_semester] INT NOT NULL,
    CONSTRAINT [FK_cc_curriculum] FOREIGN KEY ([curriculum_id]) REFERENCES [curriculums]([curriculum_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_cc_courses] FOREIGN KEY ([course_id]) REFERENCES [courses]([course_id])
);

-- Giảng viên AGU: Chuẩn hướng dẫn Thạc sĩ bắt buộc học vị Tiến sĩ trở lên
CREATE TABLE [lecturers] (
    [lecturer_id] INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] BIGINT NOT NULL UNIQUE,
    [lecturer_code] VARCHAR(20) NOT NULL UNIQUE,
    [full_name] NVARCHAR(150) NOT NULL,
    [degree] NVARCHAR(30) NOT NULL CHECK ([degree] IN (N'Tiến sĩ', N'Phó Giáo sư', N'Giáo sư')),
    [max_slots] INT NOT NULL DEFAULT 4,             -- Giới hạn: Tối đa 3 - 5 học viên Thạc sĩ/đợt
    [email] VARCHAR(100) NOT NULL,
    [phone] VARCHAR(15) NULL,
    CONSTRAINT [FK_lecturers_users] FOREIGN KEY ([user_id]) REFERENCES [users]([user_id]) ON DELETE CASCADE
);

CREATE TABLE [semesters] (
    [semester_id] INT IDENTITY(1,1) PRIMARY KEY,
    [semester_name] NVARCHAR(50) NOT NULL,
    [start_date] DATE NOT NULL,
    [end_date] DATE NOT NULL,
    [is_grade_locked] BIT DEFAULT 0
);

CREATE TABLE [course_classes] (
    [class_id] INT IDENTITY(1,1) PRIMARY KEY,
    [course_id] INT NOT NULL,
    [semester_id] INT NOT NULL,
    [class_name] NVARCHAR(100) NOT NULL,
    [max_students] INT NOT NULL DEFAULT 35,
    [status] NVARCHAR(20) DEFAULT N'Mở đăng ký' CHECK ([status] IN (N'Mở đăng ký', N'Đã chốt', N'Đã hủy')),
    CONSTRAINT [FK_classes_courses] FOREIGN KEY ([course_id]) REFERENCES [courses]([course_id]),
    CONSTRAINT [FK_classes_semesters] FOREIGN KEY ([semester_id]) REFERENCES [semesters]([semester_id])
);

CREATE TABLE [schedules] (
    [schedule_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [class_id] INT NOT NULL,
    [lecturer_id] INT NOT NULL,
    [room_name] NVARCHAR(50) NOT NULL,
    [day_of_week] INT NOT NULL CHECK ([day_of_week] BETWEEN 2 AND 8),
    [start_shift] INT NOT NULL,
    [end_shift] INT NOT NULL,
    CONSTRAINT [FK_schedules_classes] FOREIGN KEY ([class_id]) REFERENCES [course_classes]([class_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_schedules_lecturers] FOREIGN KEY ([lecturer_id]) REFERENCES [lecturers]([lecturer_id])
);

-- =============================================================================
-- PHÂN HỆ 4: HỌC VIÊN THẠC SĨ AGU & TÀI CHÍNH
-- =============================================================================

CREATE TABLE [students] (
    [student_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [user_id] BIGINT NOT NULL UNIQUE,
    [student_code] VARCHAR(20) NOT NULL UNIQUE,      -- MSHV chuẩn AGU (VD: 24M848020501)
    [profile_id] BIGINT NOT NULL UNIQUE,
    [curriculum_id] INT NOT NULL,
    [academic_status] NVARCHAR(30) DEFAULT N'Đang học' CHECK ([academic_status] IN (N'Đang học', N'Bảo lưu', N'Tốt nghiệp', N'Thôi học')),
    [enrollment_date] DATE NOT NULL,
    CONSTRAINT [FK_students_users] FOREIGN KEY ([user_id]) REFERENCES [users]([user_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_students_profiles] FOREIGN KEY ([profile_id]) REFERENCES [admission_profiles]([profile_id]),
    CONSTRAINT [FK_students_curriculums] FOREIGN KEY ([curriculum_id]) REFERENCES [curriculums]([curriculum_id])
);

CREATE TABLE [tuition_fees] (
    [tuition_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [student_id] BIGINT NOT NULL,
    [semester_id] INT NOT NULL,
    [base_amount] DECIMAL(12,2) NOT NULL,
    [due_date] DATE NOT NULL,
    [paid_amount] DECIMAL(12,2) DEFAULT 0.00,
    [late_penalty_fee] DECIMAL(12,2) DEFAULT 0.00,
    [outstanding_balance] AS ([base_amount] + [late_penalty_fee] - [paid_amount]) PERSISTED,
    [status] NVARCHAR(30) DEFAULT N'Chưa thanh toán' CHECK ([status] IN (N'Chưa thanh toán', N'Đã thanh toán một phần', N'Hoàn thành')),
    CONSTRAINT [FK_tuition_students] FOREIGN KEY ([student_id]) REFERENCES [students]([student_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_tuition_semesters] FOREIGN KEY ([semester_id]) REFERENCES [semesters]([semester_id])
);

CREATE TABLE [course_registrations] (
    [registration_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [student_id] BIGINT NOT NULL,
    [class_id] INT NOT NULL,
    [registered_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [UQ_student_class] UNIQUE ([student_id], [class_id]),
    CONSTRAINT [FK_reg_students] FOREIGN KEY ([student_id]) REFERENCES [students]([student_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_reg_classes] FOREIGN KEY ([class_id]) REFERENCES [course_classes]([class_id]) ON DELETE CASCADE
);

CREATE TABLE [student_grades] (
    [grade_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [registration_id] BIGINT NOT NULL UNIQUE,
    [process_grade] DECIMAL(4,2) NULL CHECK ([process_grade] BETWEEN 0 AND 10),
    [exam_grade] DECIMAL(4,2) NULL CHECK ([exam_grade] BETWEEN 0 AND 10),
    [final_grade] DECIMAL(4,2) NULL CHECK ([final_grade] BETWEEN 0 AND 10),
    [is_locked] BIT DEFAULT 0,
    CONSTRAINT [FK_grades_registration] FOREIGN KEY ([registration_id]) REFERENCES [course_registrations]([registration_id]) ON DELETE CASCADE
);

-- =============================================================================
-- PHÂN HỆ 5: LUẬN VĂN THẠC SĨ AGU, TIẾN ĐỘ 5 BƯỚC & CHUẨN ĐẦU RA
-- =============================================================================

-- Phân công Giảng viên Hướng dẫn
CREATE TABLE [advisor_assignments] (
    [advisor_assignment_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [student_id] BIGINT NOT NULL,
    [lecturer_id] INT NOT NULL,
    [role] NVARCHAR(30) NOT NULL DEFAULT N'Hướng dẫn chính' CHECK ([role] IN (N'Hướng dẫn chính', N'Đồng hướng dẫn')),
    [assigned_date] DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    [status] NVARCHAR(30) DEFAULT N'Chờ GVHD duyệt' CHECK ([status] IN (N'Chờ GVHD duyệt', N'Đang hướng dẫn', N'Đã hoàn thành', N'Từ chối', N'Đã hủy')),
    CONSTRAINT [FK_advisor_students] FOREIGN KEY ([student_id]) REFERENCES [students]([student_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_advisor_lecturers] FOREIGN KEY ([lecturer_id]) REFERENCES [lecturers]([lecturer_id])
);

-- Tiến trình Đề tài Luận văn Thạc sĩ (Chuẩn 5 mốc theo quy chế SĐH AGU)
CREATE TABLE [thesis_progress] (
    [thesis_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [student_id] BIGINT NOT NULL UNIQUE,
    [thesis_title] NVARCHAR(500) NOT NULL,
    [current_stage] NVARCHAR(50) DEFAULT N'Bảo vệ đề cương' CHECK ([current_stage] IN (
        N'Đăng ký đề tài', 
        N'Bảo vệ đề cương', 
        N'Báo cáo tiến độ lần 1', 
        N'Báo cáo tiến độ lần 2', 
        N'Nộp bản thảo', 
        N'Bảo vệ chính thức'
    )),
    [progress_percent] INT DEFAULT 0 CHECK ([progress_percent] BETWEEN 0 AND 100),
    [status] NVARCHAR(30) DEFAULT N'Chờ GVHD duyệt' CHECK ([status] IN (N'Chờ GVHD duyệt', N'Đã duyệt', N'Từ chối', N'Đang thực hiện', N'Hoàn thành')),
    [rejection_reason] NVARCHAR(MAX) NULL,
    CONSTRAINT [FK_thesis_students] FOREIGN KEY ([student_id]) REFERENCES [students]([student_id]) ON DELETE CASCADE
);

-- Báo cáo nộp bài theo từng mốc (Cảnh báo màu Xanh / Vàng / Đỏ)
CREATE TABLE [thesis_submissions] (
    [submission_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [thesis_id] BIGINT NOT NULL,
    [stage_name] NVARCHAR(50) NOT NULL, -- N'Bảo vệ đề cương', N'Tiến độ lần 1', N'Tiến độ lần 2', N'Bản thảo'
    [report_file_url] NVARCHAR(255) NOT NULL, -- Upload file PDF <= 25MB
    [deadline] DATE NOT NULL,
    [submitted_at] DATETIME NULL,
    [lecturer_feedback] NVARCHAR(MAX) NULL,   -- Lời dặn / nhận xét của Thầy Cô
    [color_warning] NVARCHAR(10) DEFAULT 'green' CHECK ([color_warning] IN ('green', 'yellow', 'red')),
    [status] NVARCHAR(30) DEFAULT N'Chờ đánh giá' CHECK ([status] IN (N'Chờ đánh giá', N'Đạt', N'Cần sửa đổi')),
    CONSTRAINT [FK_sub_thesis] FOREIGN KEY ([thesis_id]) REFERENCES [thesis_progress]([thesis_id]) ON DELETE CASCADE
);

-- Kiểm tra Đạo văn Turnitin (Quy chế AGU: Tỷ lệ trùng lặp <= 20%)
CREATE TABLE [turnitin_checks] (
    [check_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [thesis_id] BIGINT NOT NULL,
    [file_url] NVARCHAR(255) NOT NULL,
    [similarity_score] DECIMAL(5,2) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CHECK ([status] IN (N'Đạt', N'Cảnh báo', N'Không đạt')),
    [explanation_file] NVARCHAR(255) NULL,
    [checked_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [FK_turnitin_thesis] FOREIGN KEY ([thesis_id]) REFERENCES [thesis_progress]([thesis_id]) ON DELETE CASCADE
);

-- Chuẩn đầu ra NCKH: 01 Bài báo công bố tại Tạp chí KH ĐHAG hoặc HĐGSNN / Scopus
CREATE TABLE [scientific_publications] (
    [publication_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [student_id] BIGINT NOT NULL,
    [paper_title] NVARCHAR(500) NOT NULL,
    [journal_name] NVARCHAR(255) NOT NULL,    -- Ví dụ: Tạp chí Khoa học Trường ĐH An Giang (AGU-JOS)
    [issn_isbn] VARCHAR(50) NULL,             -- Chỉ số ISSN (VD: 0866-8086)
    [paper_url] NVARCHAR(500) NULL,           -- Link bài báo trực tuyến
    [ranking] NVARCHAR(30) NOT NULL CHECK ([ranking] IN (N'Tạp chí KH ĐH An Giang', N'HĐGSNN', N'Scopus/WoS', N'Hội nghị SĐH')),
    [points] DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    [evidence_file] NVARCHAR(255) NOT NULL,   -- File PDF toàn văn bài báo
    [status] NVARCHAR(30) DEFAULT N'Chờ thẩm định' CHECK ([status] IN (N'Chờ thẩm định', N'Đạt', N'Không đạt')),
    [admin_note] NVARCHAR(500) NULL,
    CONSTRAINT [FK_pub_students] FOREIGN KEY ([student_id]) REFERENCES [students]([student_id]) ON DELETE CASCADE
);

-- Chuẩn đầu ra Ngoại ngữ Thạc sĩ: VSTEP Bậc 4 (chuẩn AGU & ĐHQG-HCM), IELTS 5.5...
CREATE TABLE [language_certificates] (
    [cert_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [student_id] BIGINT NOT NULL,
    [cert_type] NVARCHAR(50) NOT NULL, -- N'VSTEP Bậc 4 (B2 ĐHQG-HCM)', N'IELTS', N'TOEFL iBT'
    [score_achieved] NVARCHAR(20) NOT NULL, -- '6.5', '60/100', 'Bậc 4'
    [issue_date] DATE NOT NULL,
    [expiry_date] DATE NULL,
    [certificate_file_url] NVARCHAR(255) NOT NULL,
    [status] NVARCHAR(30) DEFAULT N'Chờ xét duyệt' CHECK ([status] IN (N'Chờ xét duyệt', N'Đạt yêu cầu', N'Không hợp lệ')),
    [admin_note] NVARCHAR(500) NULL,
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [FK_lang_cert_student] FOREIGN KEY ([student_id]) REFERENCES [students]([student_id]) ON DELETE CASCADE
);

-- =============================================================================
-- PHÂN HỆ 6: HỘI ĐỒNG BẢO VỆ LUẬN VĂN THẠC SĨ TẠI AGU (5 THÀNH VIÊN)
-- =============================================================================

CREATE TABLE [defense_committees] (
    [committee_id] INT IDENTITY(1,1) PRIMARY KEY,
    [committee_name] NVARCHAR(150) NOT NULL,
    [defense_date] DATE NOT NULL,
    [defense_room] NVARCHAR(100) NOT NULL, -- Ví dụ: 'Phòng Hội thảo 1 - Khu Hiệu bộ AGU'
    [president_id] INT NOT NULL,     -- 1. Chủ tịch hội đồng
    [reviewer_1_id] INT NOT NULL,    -- 2. Phản biện 1
    [reviewer_2_id] INT NOT NULL,    -- 3. Phản biện 2
    [secretary_id] INT NOT NULL,     -- 4. Thư ký hội đồng
    [member_id] INT NOT NULL,        -- 5. Ủy viên hội đồng
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [FK_com_president] FOREIGN KEY ([president_id]) REFERENCES [lecturers]([lecturer_id]),
    CONSTRAINT [FK_com_rev1] FOREIGN KEY ([reviewer_1_id]) REFERENCES [lecturers]([lecturer_id]),
    CONSTRAINT [FK_com_rev2] FOREIGN KEY ([reviewer_2_id]) REFERENCES [lecturers]([lecturer_id]),
    CONSTRAINT [FK_com_sec] FOREIGN KEY ([secretary_id]) REFERENCES [lecturers]([lecturer_id]),
    CONSTRAINT [FK_com_member] FOREIGN KEY ([member_id]) REFERENCES [lecturers]([lecturer_id])
);

-- Lịch bảo vệ chi tiết của từng học viên Thạc sĩ
CREATE TABLE [thesis_defense_schedules] (
    [defense_schedule_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [thesis_id] BIGINT NOT NULL UNIQUE,
    [committee_id] INT NOT NULL,
    [defense_order] INT NOT NULL DEFAULT 1,
    [start_time] TIME NOT NULL,
    [average_score] DECIMAL(4,2) NULL CHECK ([average_score] BETWEEN 0 AND 10),
    [result] NVARCHAR(20) DEFAULT N'Chưa bảo vệ' CHECK ([result] IN (N'Chưa bảo vệ', N'Đạt', N'Không đạt')),
    CONSTRAINT [FK_sched_thesis] FOREIGN KEY ([thesis_id]) REFERENCES [thesis_progress]([thesis_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_sched_committee] FOREIGN KEY ([committee_id]) REFERENCES [defense_committees]([committee_id])
);

-- Phiếu chấm điểm độc lập của 5 Thầy/Cô trong Hội đồng
CREATE TABLE [defense_evaluations] (
    [evaluation_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [defense_schedule_id] BIGINT NOT NULL,
    [lecturer_id] INT NOT NULL,
    [role_in_committee] NVARCHAR(50) NOT NULL CHECK ([role_in_committee] IN (N'Chủ tịch', N'Phản biện 1', N'Phản biện 2', N'Thư ký', N'Ủy viên')),
    -- Tiêu chuẩn chấm điểm thang 10 của AGU:
    [content_score] DECIMAL(4,2) NOT NULL CHECK ([content_score] BETWEEN 0 AND 5.0),       -- Nội dung (Tối đa 5.0đ)
    [presentation_score] DECIMAL(4,2) NOT NULL CHECK ([presentation_score] BETWEEN 0 AND 2.5), -- Trình bày (Tối đa 2.5đ)
    [qa_score] DECIMAL(4,2) NOT NULL CHECK ([qa_score] BETWEEN 0 AND 2.5),                 -- Trả lời câu hỏi (Tối đa 2.5đ)
    [total_score] AS ([content_score] + [presentation_score] + [qa_score]) PERSISTED,      -- Tổng điểm
    [feedback] NVARCHAR(MAX) NULL,
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [UQ_eval_schedule_lec] UNIQUE ([defense_schedule_id], [lecturer_id]),
    CONSTRAINT [FK_eval_schedule] FOREIGN KEY ([defense_schedule_id]) REFERENCES [thesis_defense_schedules]([defense_schedule_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_eval_lecturer] FOREIGN KEY ([lecturer_id]) REFERENCES [lecturers]([lecturer_id])
);

-- =============================================================================
-- PHÂN HỆ 7: KHẢO SÁT CHẤT LƯỢNG ĐÀO TẠO THẠC SĨ (QA AGU)
-- =============================================================================

CREATE TABLE [qa_survey_templates] (
    [template_id] INT IDENTITY(1,1) PRIMARY KEY,
    [template_code] VARCHAR(50) NOT NULL UNIQUE,
    [title] NVARCHAR(255) NOT NULL,
    [survey_type] NVARCHAR(20) NOT NULL CHECK ([survey_type] IN (N'Học phần', N'Luận văn', N'Tốt nghiệp')),
    [is_published] BIT DEFAULT 0
);

CREATE TABLE [qa_survey_questions] (
    [question_id] INT IDENTITY(1,1) PRIMARY KEY,
    [template_id] INT NOT NULL,
    [question_text] NVARCHAR(MAX) NOT NULL,
    [scale_type] NVARCHAR(50) DEFAULT N'Likert 5',
    CONSTRAINT [FK_questions_templates] FOREIGN KEY ([template_id]) REFERENCES [qa_survey_templates]([template_id]) ON DELETE CASCADE
);

CREATE TABLE [qa_survey_campaigns] (
    [campaign_id] INT IDENTITY(1,1) PRIMARY KEY,
    [template_id] INT NOT NULL,
    [class_id] INT NULL,
    [start_date] DATETIME NOT NULL,
    [end_date] DATETIME NOT NULL,
    CONSTRAINT [FK_campaigns_templates] FOREIGN KEY ([template_id]) REFERENCES [qa_survey_templates]([template_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_campaigns_classes] FOREIGN KEY ([class_id]) REFERENCES [course_classes]([class_id]) ON DELETE SET NULL
);

CREATE TABLE [qa_survey_responses] (
    [response_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [campaign_id] INT NOT NULL,
    [anonymous_token] VARCHAR(64) NOT NULL UNIQUE,
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [FK_responses_campaigns] FOREIGN KEY ([campaign_id]) REFERENCES [qa_survey_campaigns]([campaign_id]) ON DELETE CASCADE
);

CREATE TABLE [qa_survey_details] (
    [detail_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [response_id] BIGINT NOT NULL,
    [question_id] INT NOT NULL,
    [rating_score] INT NOT NULL CHECK ([rating_score] BETWEEN 1 AND 5),
    CONSTRAINT [FK_details_responses] FOREIGN KEY ([response_id]) REFERENCES [qa_survey_responses]([response_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_details_questions] FOREIGN KEY ([question_id]) REFERENCES [qa_survey_questions]([question_id])
);
GO

-- =============================================================================
-- PHẦN 8: TRIGGERS & PROCEDURES ĐẶC THÙ AGU
-- =============================================================================

-- 1. Trigger: Chặn phân công giảng viên chưa đạt chuẩn Tiến sĩ dạy lớp Thạc sĩ
CREATE OR ALTER TRIGGER [trg_check_lecturer_degree_before_assignment]
ON [schedules]
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 
        FROM inserted i
        JOIN [lecturers] l ON i.[lecturer_id] = l.[lecturer_id]
        WHERE l.[degree] NOT IN (N'Tiến sĩ', N'Phó Giáo sư', N'Giáo sư')
    )
    BEGIN
        RAISERROR (N'Quy chế Sau Đại học AGU: Giảng viên tham gia giảng dạy/hướng dẫn Thạc sĩ bắt buộc có học vị Tiến sĩ trở lên!', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- 2. Stored Procedure: Tự động tính điểm trung bình Hội đồng Luận văn Thạc sĩ
CREATE OR ALTER PROCEDURE [sp_calculate_defense_final_grade]
    @p_defense_schedule_id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @avg_score DECIMAL(4,2);
    DECLARE @submitted_count INT;

    SELECT 
        @submitted_count = COUNT(*), 
        @avg_score = ROUND(AVG([total_score]), 2)
    FROM [defense_evaluations]
    WHERE [defense_schedule_id] = @p_defense_schedule_id;

    -- Đủ 3/5 thành viên trở lên đã chấm -> Cập nhật kết quả đạt chuẩn AGU (>= 5.50)
    IF @submitted_count >= 3
    BEGIN
        UPDATE [thesis_defense_schedules]
        SET [average_score] = @avg_score,
            [result] = CASE WHEN @avg_score >= 5.50 THEN N'Đạt' ELSE N'Không đạt' END
        WHERE [defense_schedule_id] = @p_defense_schedule_id;
    END
END;
GO

-- 3. Stored Procedure: GATEKEEPER - Kiểm tra 4 điều kiện bảo vệ Luận văn Thạc sĩ tại AGU
CREATE OR ALTER PROCEDURE [sp_check_thesis_defense_gatekeeper]
    @p_student_id BIGINT,
    @p_is_eligible BIT OUTPUT,
    @p_message NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_unpaid_tuition DECIMAL(12,2);
    DECLARE @v_turnitin_score DECIMAL(5,2);
    DECLARE @v_approved_papers INT;
    DECLARE @v_approved_lang_cert INT;
    
    SET @p_is_eligible = 1;
    SET @p_message = N'';
    
    -- 1. Điều kiện 1: Đã hoàn tất học phí tại AGU
    SELECT @v_unpaid_tuition = ISNULL(SUM([outstanding_balance]), 0)
    FROM [tuition_fees]
    WHERE [student_id] = @p_student_id;
    
    IF @v_unpaid_tuition > 0
    BEGIN
        SET @p_is_eligible = 0;
        SET @p_message = @p_message + N'[Chặn] Học viên còn nợ học phí: ' + FORMAT(@v_unpaid_tuition, 'N0') + N' VNĐ. ';
    END
    
    -- 2. Điều kiện 2: Kiểm tra Đạo văn Turnitin (<= 20% theo quy chế AGU)
    SELECT TOP 1 @v_turnitin_score = tc.[similarity_score]
    FROM [turnitin_checks] tc
    JOIN [thesis_progress] tp ON tc.[thesis_id] = tp.[thesis_id]
    WHERE tp.[student_id] = @p_student_id
    ORDER BY tc.[checked_at] DESC;
    
    IF @v_turnitin_score IS NULL OR @v_turnitin_score > 20.00
    BEGIN
        SET @p_is_eligible = 0;
        SET @p_message = @p_message + N'[Chặn] Tỷ lệ trùng lặp Turnitin vượt quá quy chế <= 20% (Hiện tại: ' + CAST(ISNULL(@v_turnitin_score, 100) AS NVARCHAR(10)) + N'%). ';
    END
    
    -- 3. Điều kiện 3: Có tối thiểu 01 Bài báo KH (Tạp chí KH ĐH An Giang / HĐGSNN)
    SELECT @v_approved_papers = COUNT(*)
    FROM [scientific_publications]
    WHERE [student_id] = @p_student_id AND [status] = N'Đạt';
    
    IF @v_approved_papers < 1
    BEGIN
        SET @p_is_eligible = 0;
        SET @p_message = @p_message + N'[Chặn] Chưa có bài báo khoa học được nghiệm thu (Yêu cầu: 1 bài). ';
    END

    -- 4. Điều kiện 4: Chứng chỉ Ngoại ngữ Chuẩn đầu ra (VSTEP Bậc 4 ĐHQG-HCM / IELTS 5.5+)
    SELECT @v_approved_lang_cert = COUNT(*)
    FROM [language_certificates]
    WHERE [student_id] = @p_student_id AND [status] = N'Đạt yêu cầu';

    IF @v_approved_lang_cert = 0
    BEGIN
        SET @p_is_eligible = 0;
        SET @p_message = @p_message + N'[Chặn] Chưa có Chứng chỉ tiếng Anh Chuẩn đầu ra Thạc sĩ (VSTEP Bậc 4). ';
    END
    
    -- Kết luận
    IF @p_is_eligible = 1
    BEGIN
        SET @p_message = N'Đủ điều kiện tiêu chuẩn bảo vệ luận văn Thạc sĩ tại ĐH An Giang.';
    END
END;
GO

-- =============================================================================
-- PHẦN 9: BỘ DỮ LIỆU MẪU (SEED DATA THỰC TẾ TRƯỜNG ĐH AN GIANG)
-- =============================================================================

-- 1. Vai trò (Roles)
INSERT INTO [roles] ([role_code], [role_name]) VALUES 
('ADMIN', N'Phòng Đào tạo Sau Đại học (Admin)'),
('LECTURER', N'Giảng viên Hướng dẫn / Hội đồng'),
('STUDENT', N'Học viên Cao học Thạc sĩ');

-- 2. Ngành Đào tạo Thạc sĩ thực tế tại AGU
INSERT INTO [majors] ([major_code], [major_name]) VALUES
('8480205', N'Kỹ thuật phần mềm (Software Engineering)'),
('8480101', N'Khoa học máy tính (Computer Science)'),
('8340101', N'Quản trị kinh doanh (Business Administration)'),
('8620110', N'Khoa học cây trồng (Crop Science)'),
('8140111', N'Lý luận và PPDH bộ môn Toán (Mathematics Education)');

-- 3. Chương trình đào tạo (Curriculum)
INSERT INTO [curriculums] ([major_id], [cohort], [orientation], [total_credits], [version]) VALUES
(1, 'K2024-2026', N'Ứng dụng', 60, 'AGU-KTPM-2024'),
(2, 'K2024-2026', N'Nghiên cứu', 60, 'AGU-KHMT-2024');

-- 4. Tài khoản người dùng (Users) - Password demo: '123456'
INSERT INTO [users] ([username], [password_hash], [email], [role_id]) VALUES
('admin_sdh', '$2b$10$hashedpasswordsample', 'sdh@agu.edu.vn', 1),
('gv_doanthanhnghi', '$2b$10$hashedpasswordsample', 'dtnghi@agu.edu.vn', 2),
('gv_nguyencongtru', '$2b$10$hashedpasswordsample', 'nctru@agu.edu.vn', 2),
('gv_huynhphuochai', '$2b$10$hashedpasswordsample', 'hphai@agu.edu.vn', 2),
('gv_tranvanb', '$2b$10$hashedpasswordsample', 'tvb@agu.edu.vn', 2),
('gv_lethid', '$2b$10$hashedpasswordsample', 'ltd@agu.edu.vn', 2),
('hv_ngan_hue', '$2b$10$hashedpasswordsample', 'dpm235422@agu.edu.vn', 3),
('hv_huynh_hieu', '$2b$10$hashedpasswordsample', 'dpm235419@agu.edu.vn', 3);

-- 5. Giảng viên AGU (Lecturers)
INSERT INTO [lecturers] ([user_id], [lecturer_code], [full_name], [degree], [max_slots], [email], [phone]) VALUES
(2, 'GV_AGU001', N'PGS.TS. Đoàn Thanh Nghị', N'Phó Giáo sư', 5, 'dtnghi@agu.edu.vn', '0912345671'),
(3, 'GV_AGU002', N'TS. Nguyễn Công Trứ', N'Tiến sĩ', 4, 'nctru@agu.edu.vn', '0912345672'),
(4, 'GV_AGU003', N'TS. Huỳnh Phước Hải', N'Tiến sĩ', 4, 'hphai@agu.edu.vn', '0912345673'),
(5, 'GV_AGU004', N'TS. Trần Văn B', N'Tiến sĩ', 4, 'tvb@agu.edu.vn', '0912345674'),
(6, 'GV_AGU005', N'TS. Lê Thị D', N'Tiến sĩ', 3, 'ltd@agu.edu.vn', '0912345675');

-- 6. Đợt tuyển sinh & Hồ sơ tuyển sinh
INSERT INTO [admission_campaigns] ([campaign_name], [academic_year], [start_date], [end_date]) VALUES
(N'Tuyển sinh Cao học Đợt 1 - Năm 2024', 2024, '2024-03-01', '2024-05-30');

INSERT INTO [admission_profiles] ([campaign_id], [full_name], [dob], [id_card_number], [phone], [email], [status], [admission_status]) VALUES
(1, N'Nguyễn Thị Ngân Huệ', '2001-05-12', '089201004123', '0987654321', 'dpm235422@agu.edu.vn', N'Đạt yêu cầu', N'Đã nhập học'),
(1, N'Huỳnh Hiếu', '2001-08-20', '089201004124', '0987654322', 'dpm235419@agu.edu.vn', N'Đạt yêu cầu', N'Đã nhập học');

-- 7. Học viên Thạc sĩ (Students)
INSERT INTO [students] ([user_id], [student_code], [profile_id], [curriculum_id], [academic_status], [enrollment_date]) VALUES
(7, '24M848020501', 1, 1, N'Đang học', '2024-09-01'),
(8, '24M848020502', 2, 1, N'Đang học', '2024-09-01');

-- 8. Học phí Thạc sĩ AGU
INSERT INTO [semesters] ([semester_name], [start_date], [end_date]) VALUES 
(N'Học kỳ 1 (2024-2025)', '2024-09-01', '2025-01-15');

INSERT INTO [tuition_fees] ([student_id], [semester_id], [base_amount], [due_date], [paid_amount], [status]) VALUES
(1, 1, 14500000.00, '2024-10-15', 14500000.00, N'Hoàn thành'),
(2, 1, 14500000.00, '2024-10-15', 14500000.00, N'Hoàn thành');

-- 9. Đề tài Luận văn Thạc sĩ & Phân công GVHD
INSERT INTO [thesis_progress] ([student_id], [thesis_title], [current_stage], [progress_percent], [status]) VALUES
(1, N'Ứng dụng Microservices và AI trong Quản trị Đào tạo Sau Đại học tại Trường Đại học An Giang', N'Báo cáo tiến độ lần 2', 65, N'Đang thực hiện'),
(2, N'Xây dựng Hệ thống Kiểm soát Trùng lặp Đề tài và Đánh giá NCKH Dựa trên Xử lý Ngôn ngữ Tự nhiên', N'Bảo vệ đề cương', 25, N'Đang thực hiện');

INSERT INTO [advisor_assignments] ([student_id], [lecturer_id], [role], [assigned_date], [status]) VALUES
(1, 4, N'Hướng dẫn chính', '2024-11-01', N'Đang hướng dẫn'), -- TS. Trần Văn B
(2, 1, N'Hướng dẫn chính', '2024-11-01', N'Đang hướng dẫn'); -- PGS.TS. Đoàn Thanh Nghị

-- 10. Tiến độ nộp bài & Cảnh báo màu Xanh/Vàng/Đỏ
INSERT INTO [thesis_submissions] ([thesis_id], [stage_name], [report_file_url], [deadline], [submitted_at], [lecturer_feedback], [color_warning], [status]) VALUES
(1, N'Bảo vệ đề cương', '/uploads/de_cuong_24M848020501.pdf', '2025-01-15', '2025-01-10', N'Đề cương rõ ràng, hướng nghiên cứu thiết thực cho AGU.', 'green', N'Đạt'),
(1, N'Báo cáo tiến độ lần 1', '/uploads/tien_do_1_24M848020501.pdf', '2025-04-20', '2025-04-18', N'Đã hoàn thành khảo sát cơ sở dữ liệu và kiến trúc.', 'green', N'Đạt'),
(1, N'Báo cáo tiến độ lần 2', '/uploads/tien_do_2_24M848020501.pdf', '2025-08-30', NULL, NULL, 'yellow', N'Chờ đánh giá');

-- 11. Kiểm tra Turnitin & Chuẩn đầu ra NCKH, Ngoại ngữ
INSERT INTO [turnitin_checks] ([thesis_id], [file_url], [similarity_score], [status]) VALUES
(1, '/uploads/turnitin_check_01.pdf', 12.50, N'Đạt');

INSERT INTO [scientific_publications] ([student_id], [paper_title], [journal_name], [issn_isbn], [paper_url], [ranking], [evidence_file], [status]) VALUES
(1, N'Nghiên cứu ứng dụng kiến trúc Microservices trong quản lý dữ liệu đào tạo đại học', N'Tạp chí Khoa học Trường Đại học An Giang', '0866-8086', 'https://sj.agu.edu.vn/article/view/1234', N'Tạp chí KH ĐH An Giang', '/uploads/paper_agu_01.pdf', N'Đạt');

INSERT INTO [language_certificates] ([student_id], [cert_type], [score_achieved], [issue_date], [certificate_file_url], [status]) VALUES
(1, N'VSTEP Bậc 4 (B2 ĐHQG-HCM)', 'Bậc 4 (6.5/10)', '2024-12-10', '/uploads/vstep_b2_chungchi.pdf', N'Đạt yêu cầu');

-- 12. Hội đồng Bảo vệ Luận văn Thạc sĩ tại AGU (Chuẩn 5 Thầy Cô)
INSERT INTO [defense_committees] ([committee_name], [defense_date], [defense_room], [president_id], [reviewer_1_id], [reviewer_2_id], [secretary_id], [member_id]) VALUES
(N'Hội đồng Đánh giá Luận văn Thạc sĩ Ngành KTPM - Đợt 1', '2025-11-20', N'Phòng Hội thảo 1 - Khu Hiệu bộ AGU (18 Ung Văn Khiêm)', 1, 2, 3, 4, 5);
-- 1: PGS.TS. Đoàn Thanh Nghị (Chủ tịch)
-- 2: TS. Nguyễn Công Trứ (PB1)
-- 3: TS. Huỳnh Phước Hải (PB2)
-- 4: TS. Trần Văn B (Thư ký)
-- 5: TS. Lê Thị D (Ủy viên)

INSERT INTO [thesis_defense_schedules] ([thesis_id], [committee_id], [defense_order], [start_time], [result]) VALUES
(1, 1, 1, '08:30:00', N'Chưa bảo vệ');
GO

PRINT N'=============================================================================';
PRINT N'✅ KHỞI TẠO CƠ SỞ DỮ LIỆU AGU POSTGRAD (THẠC SĨ) VÀ SEED DATA THÀNH CÔNG 100%!';
PRINT N'=============================================================================';