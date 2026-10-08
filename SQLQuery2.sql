-- =============================================================================
-- TOÀN BỘ SCRIPT CÓ KHẢ NĂNG TỰ XÓA VÀ TẠO LẠI (RE-RUNNABLE SCRIPT)
-- Hệ quản trị: Microsoft SQL Server (T-SQL)
-- =============================================================================

USE master;
GO

-- 1. Nếu Database đã tồn tại thì đóng kết nối và xóa đi để tạo mới lại từ đầu
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'agu_postgrad_db')
BEGIN
    ALTER DATABASE agu_postgrad_db SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE agu_postgrad_db;
END
GO

-- 2. Tạo mới Database
CREATE DATABASE agu_postgrad_db;
GO

USE agu_postgrad_db;
GO

-- =============================================================================
-- PHẦN 1: TẠO TOÀN BỘ CÁC BẢNG (TABLES)
-- =============================================================================

-- 1. Phân hệ Hệ thống & Phân quyền
CREATE TABLE [roles] (
    [role_id] INT IDENTITY(1,1) PRIMARY KEY,
    [role_code] VARCHAR(50) NOT NULL UNIQUE,
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
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [FK_notif_roles] FOREIGN KEY ([target_role_id]) REFERENCES [roles]([role_id]) ON DELETE SET NULL,
    CONSTRAINT [FK_notif_users] FOREIGN KEY ([target_user_id]) REFERENCES [users]([user_id]) ON DELETE CASCADE
);

-- 2. Phân hệ Tuyển sinh & Nhập học
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
    [degree_level] NVARCHAR(20) NOT NULL CHECK ([degree_level] IN (N'Thạc sĩ', N'Tiến sĩ')),
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
    [foreign_lang_cert] NVARCHAR(100) NULL,
    [foreign_lang_score] NVARCHAR(20) NULL,
    [foreign_lang_cert_file] NVARCHAR(255) NULL,
    [status] NVARCHAR(30) DEFAULT N'Chờ xét duyệt' CHECK ([status] IN (N'Chờ xét duyệt', N'Đạt yêu cầu', N'Không đạt', N'Cần bổ sung')),
    [admission_status] NVARCHAR(30) DEFAULT N'Chưa trúng tuyển' CHECK ([admission_status] IN (N'Chưa trúng tuyển', N'Trúng tuyển', N'Đã nhập học')),
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [FK_profiles_campaigns] FOREIGN KEY ([campaign_id]) REFERENCES [admission_campaigns]([campaign_id]) ON DELETE CASCADE
);

-- 3. Phân hệ Chương trình Đào tạo & Giảng viên
CREATE TABLE [majors] (
    [major_id] INT IDENTITY(1,1) PRIMARY KEY,
    [major_code] VARCHAR(20) NOT NULL UNIQUE,
    [major_name] NVARCHAR(150) NOT NULL,
    [degree_level] NVARCHAR(20) NOT NULL CHECK ([degree_level] IN (N'Thạc sĩ', N'Tiến sĩ'))
);

CREATE TABLE [admission_quotas] (
    [quota_id] INT IDENTITY(1,1) PRIMARY KEY,
    [campaign_id] INT NOT NULL,
    [major_id] INT NOT NULL,
    [target_quota] INT NOT NULL,
    CONSTRAINT [FK_quotas_campaigns] FOREIGN KEY ([campaign_id]) REFERENCES [admission_campaigns]([campaign_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_quotas_majors] FOREIGN KEY ([major_id]) REFERENCES [majors]([major_id])
);

CREATE TABLE [curriculums] (
    [curriculum_id] INT IDENTITY(1,1) PRIMARY KEY,
    [major_id] INT NOT NULL,
    [cohort] VARCHAR(20) NOT NULL,
    [orientation] NVARCHAR(20) NOT NULL CHECK ([orientation] IN (N'Ứng dụng', N'Nghiên cứu')),
    [total_credits] INT NOT NULL,
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

CREATE TABLE [lecturers] (
    [lecturer_id] INT IDENTITY(1,1) PRIMARY KEY,
    [user_id] BIGINT NOT NULL UNIQUE,
    [lecturer_code] VARCHAR(20) NOT NULL UNIQUE,
    [full_name] NVARCHAR(150) NOT NULL,
    [degree] NVARCHAR(30) NOT NULL CHECK ([degree] IN (N'Thạc sĩ', N'Tiến sĩ', N'Phó Giáo sư', N'Giáo sư')),
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
    [max_students] INT NOT NULL DEFAULT 40,
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

-- 4. Phân hệ Học viên, Tài chính & Học tập
CREATE TABLE [students] (
    [student_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [user_id] BIGINT NOT NULL UNIQUE,
    [student_code] VARCHAR(20) NOT NULL UNIQUE,
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

-- 5. Phân hệ Bảo vệ Luận văn & NCKH
CREATE TABLE [advisor_assignments] (
    [advisor_assignment_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [student_id] BIGINT NOT NULL,
    [lecturer_id] INT NOT NULL,
    [role] NVARCHAR(30) NOT NULL CHECK ([role] IN (N'Hướng dẫn chính', N'Đồng hướng dẫn')),
    [assigned_date] DATE NOT NULL,
    [status] NVARCHAR(30) DEFAULT N'Đang hướng dẫn' CHECK ([status] IN (N'Đang hướng dẫn', N'Đã hoàn thành', N'Đã hủy')),
    CONSTRAINT [FK_advisor_students] FOREIGN KEY ([student_id]) REFERENCES [students]([student_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_advisor_lecturers] FOREIGN KEY ([lecturer_id]) REFERENCES [lecturers]([lecturer_id])
);

CREATE TABLE [thesis_progress] (
    [thesis_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [student_id] BIGINT NOT NULL UNIQUE,
    [thesis_title] NVARCHAR(MAX) NOT NULL,
    [current_stage] NVARCHAR(30) DEFAULT N'Đề cương' CHECK ([current_stage] IN (N'Đề cương', N'Chuyên đề 1', N'Chuyên đề 2', N'Chuyên đề 3', N'Bảo vệ cấp Cơ sở', N'Bảo vệ cấp Trường')),
    [progress_percent] INT DEFAULT 0 CHECK ([progress_percent] BETWEEN 0 AND 100),
    CONSTRAINT [FK_thesis_students] FOREIGN KEY ([student_id]) REFERENCES [students]([student_id]) ON DELETE CASCADE
);

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

CREATE TABLE [scientific_publications] (
    [publication_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [student_id] BIGINT NOT NULL,
    [paper_title] NVARCHAR(MAX) NOT NULL,
    [journal_name] NVARCHAR(255) NOT NULL,
    [ranking] NVARCHAR(30) NOT NULL CHECK ([ranking] IN (N'Scopus/WoS', N'HĐGSNN', N'Hội nghị SĐH', N'Khác')),
    [points] DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    [evidence_file] NVARCHAR(255) NOT NULL,
    [status] NVARCHAR(30) DEFAULT N'Chờ thẩm định' CHECK ([status] IN (N'Chờ thẩm định', N'Đạt', N'Không đạt')),
    CONSTRAINT [FK_pub_students] FOREIGN KEY ([student_id]) REFERENCES [students]([student_id]) ON DELETE CASCADE
);

-- 6. Phân hệ Đảm bảo Chất lượng QA
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

CREATE TABLE [qa_student_completions] (
    [completion_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [student_id] BIGINT NOT NULL,
    [campaign_id] INT NOT NULL,
    [completed_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [UQ_student_campaign] UNIQUE ([student_id], [campaign_id]),
    CONSTRAINT [FK_compl_students] FOREIGN KEY ([student_id]) REFERENCES [students]([student_id]) ON DELETE CASCADE,
    CONSTRAINT [FK_compl_campaigns] FOREIGN KEY ([campaign_id]) REFERENCES [qa_survey_campaigns]([campaign_id]) ON DELETE CASCADE
);

CREATE TABLE [clo_plo_matrix] (
    [matrix_id] INT IDENTITY(1,1) PRIMARY KEY,
    [course_id] INT NOT NULL,
    [clo_code] VARCHAR(20) NOT NULL,
    [plo_code] VARCHAR(20) NOT NULL,
    [weight] DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    CONSTRAINT [FK_clo_courses] FOREIGN KEY ([course_id]) REFERENCES [courses]([course_id]) ON DELETE CASCADE
);

CREATE TABLE [sar_evidence_repository] (
    [evidence_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [code] VARCHAR(50) NOT NULL UNIQUE,
    [title] NVARCHAR(255) NOT NULL,
    [category] NVARCHAR(100) NOT NULL,
    [file_url] NVARCHAR(255) NOT NULL,
    [created_at] DATETIME DEFAULT GETDATE()
);
GO

-- -----------------------------------------------------------------------------
-- BỔ SUNG: TIẾN ĐỘ BÁO CÁO (XANH/VÀNG/ĐỎ), HỘI ĐỒNG VÀ SLOT GIẢNG VIÊN
-- -----------------------------------------------------------------------------
USE [agu_postgrad_db];
GO
-- 1. Bổ sung cột max_slots vào bảng lecturers
ALTER TABLE [lecturers] 
ADD [max_slots] INT NOT NULL DEFAULT 4;
GO

-- 2. Bổ sung trạng thái duyệt đề tài vào bảng thesis_progress
ALTER TABLE [thesis_progress]
ADD [status] NVARCHAR(30) DEFAULT N'Chờ GVHD duyệt' CHECK ([status] IN (N'Chờ GVHD duyệt', N'Đã duyệt', N'Từ chối', N'Đang thực hiện', N'Hoàn thành')),
    [rejection_reason] NVARCHAR(MAX) NULL;
GO

-- 3. BẢNG MỚI: Báo cáo tiến độ chi tiết từng giai đoạn & Cảnh báo màu Xanh/Vàng/Đỏ
CREATE TABLE [thesis_submissions] (
    [submission_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [thesis_id] BIGINT NOT NULL,
    [stage_name] NVARCHAR(50) NOT NULL, -- N'Đề cương', N'Tiến độ 1', N'Bản thảo'
    [report_file_url] NVARCHAR(255) NOT NULL, -- File PDF upload <= 25MB
    [deadline] DATE NOT NULL,                 -- Node.js cron job quét ngày này
    [submitted_at] DATETIME NULL,
    [lecturer_feedback] NVARCHAR(MAX) NULL,   -- Nhận xét của GVHD
    [color_warning] NVARCHAR(10) DEFAULT 'green' CHECK ([color_warning] IN ('green', 'yellow', 'red')),
    [status] NVARCHAR(30) DEFAULT N'Chờ đánh giá' CHECK ([status] IN (N'Chờ đánh giá', N'Đạt', N'Cần sửa đổi')),
    CONSTRAINT [FK_sub_thesis] FOREIGN KEY ([thesis_id]) REFERENCES [thesis_progress]([thesis_id]) ON DELETE CASCADE
);
GO

-- 4. BẢNG MỚI: Hội đồng Bảo vệ Luận văn (Admin thành lập hội đồng)
CREATE TABLE [defense_committees] (
    [committee_id] INT IDENTITY(1,1) PRIMARY KEY,
    [committee_name] NVARCHAR(150) NOT NULL,
    [defense_date] DATE NOT NULL,
    [defense_room] NVARCHAR(50) NOT NULL,
    [president_id] INT NOT NULL,     -- Chủ tịch hội đồng
    [reviewer_1_id] INT NOT NULL,    -- Phản biện 1
    [reviewer_2_id] INT NOT NULL,    -- Phản biện 2
    [secretary_id] INT NOT NULL,     -- Thư ký
    [member_id] INT NOT NULL,        -- Ủy viên
    [created_at] DATETIME DEFAULT GETDATE(),
    CONSTRAINT [FK_com_president] FOREIGN KEY ([president_id]) REFERENCES [lecturers]([lecturer_id]),
    CONSTRAINT [FK_com_rev1] FOREIGN KEY ([reviewer_1_id]) REFERENCES [lecturers]([lecturer_id]),
    CONSTRAINT [FK_com_rev2] FOREIGN KEY ([reviewer_2_id]) REFERENCES [lecturers]([lecturer_id]),
    CONSTRAINT [FK_com_sec] FOREIGN KEY ([secretary_id]) REFERENCES [lecturers]([lecturer_id]),
    CONSTRAINT [FK_com_member] FOREIGN KEY ([member_id]) REFERENCES [lecturers]([lecturer_id])
);
GO

-- 5. BẢNG MỚI: Lịch bảo vệ chi tiết từng học viên & Điểm bảo vệ
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
GO

-- =============================================================================
-- PHẦN 2: TRIGGER & STORED PROCEDURE
-- =============================================================================

CREATE TRIGGER [trg_check_lecturer_degree_before_assignment]
ON [schedules]
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 
        FROM inserted i
        JOIN [lecturers] l ON i.[lecturer_id] = l.[lecturer_id]
        WHERE l.[degree] = N'Thạc sĩ'
    )
    BEGIN
        RAISERROR (N'Vi phạm quy chế: Giảng viên chưa đạt học vị Tiến sĩ trở lên!', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

CREATE PROCEDURE [sp_check_thesis_defense_gatekeeper]
    @p_student_id BIGINT,
    @p_is_eligible BIT OUTPUT,
    @p_message NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @v_unpaid_tuition DECIMAL(12,2);
    DECLARE @v_degree_level NVARCHAR(20);
    DECLARE @v_turnitin_score DECIMAL(5,2);
    DECLARE @v_approved_papers INT;
    DECLARE @v_required_papers INT;
    
    SET @p_is_eligible = 1;
    SET @p_message = N'';
    
    -- 1. Check nợ học phí
    SELECT @v_unpaid_tuition = ISNULL(SUM([outstanding_balance]), 0)
    FROM [tuition_fees]
    WHERE [student_id] = @p_student_id;
    
    IF @v_unpaid_tuition > 0
    BEGIN
        SET @p_is_eligible = 0;
        SET @p_message = @p_message + N'[Chặn] Học viên còn nợ học phí: ' + FORMAT(@v_unpaid_tuition, 'N0') + N' VNĐ. ';
    END
    
    -- 2. Check Turnitin
    SELECT TOP 1 @v_turnitin_score = tc.[similarity_score]
    FROM [turnitin_checks] tc
    JOIN [thesis_progress] tp ON tc.[thesis_id] = tp.[thesis_id]
    WHERE tp.[student_id] = @p_student_id
    ORDER BY tc.[checked_at] DESC;
    
    IF @v_turnitin_score IS NULL OR @v_turnitin_score > 20.00
    BEGIN
        SET @p_is_eligible = 0;
        SET @p_message = @p_message + N'[Chặn] Tỷ lệ trùng lặp Turnitin vượt quá 20% (Hiện tại: ' + CAST(ISNULL(@v_turnitin_score, 100) AS NVARCHAR(10)) + N'%). ';
    END
    
    -- 3. Check bài báo khoa học
    SELECT @v_degree_level = m.[degree_level]
    FROM [students] s
    JOIN [curriculums] c ON s.[curriculum_id] = c.[curriculum_id]
    JOIN [majors] m ON c.[major_id] = m.[major_id]
    WHERE s.[student_id] = @p_student_id;
    
    IF @v_degree_level = N'Thạc sĩ'
        SET @v_required_papers = 1;
    ELSE
        SET @v_required_papers = 2;
        
    SELECT @v_approved_papers = COUNT(*)
    FROM [scientific_publications]
    WHERE [student_id] = @p_student_id AND [status] = N'Đạt';
    
    IF @v_approved_papers < @v_required_papers
    BEGIN
        SET @p_is_eligible = 0;
        SET @p_message = @p_message + N'[Chặn] Thiếu minh chứng bài báo KH (Yêu cầu: ' + CAST(@v_required_papers AS NVARCHAR(5)) + N', Hiện có: ' + CAST(@v_approved_papers AS NVARCHAR(5)) + N'). ';
    END
    
    IF @p_is_eligible = 1
    BEGIN
        SET @p_message = N'Đủ điều kiện nộp hồ sơ bảo vệ luận văn/luận án.';
    END
END;
GO