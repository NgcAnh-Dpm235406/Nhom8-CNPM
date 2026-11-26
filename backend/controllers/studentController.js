const { sql, poolPromise, writeAuditLog } = require('../config/db');

// Helper lấy student_id từ user_id nếu token chưa có
async function resolveStudentId(pool, user) {
    if (user.student_id) return user.student_id;
    const res = await pool.request()
        .input('userId', sql.BigInt, user.user_id)
        .query(`SELECT student_id FROM students WHERE user_id = @userId`);
    return res.recordset.length > 0 ? res.recordset[0].student_id : null;
}

async function resolveLecturerId(pool, user) {
    if (user.lecturer_id) return user.lecturer_id;
    const res = await pool.request()
        .input('userId', sql.BigInt, user.user_id)
        .query(`SELECT lecturer_id FROM lecturers WHERE user_id=@userId`);
    return res.recordset.length > 0 ? res.recordset[0].lecturer_id : null;
}

// 1. Lấy thông tin cá nhân học viên cao học (GET /api/students/me)
exports.getMyInfo = async (req, res) => {
    try {
        const pool = await poolPromise;
        const studentId = await resolveStudentId(pool, req.user);

        if (!studentId) {
            return res.status(404).json({ success: false, message: 'Tài khoản chưa được liên kết với hồ sơ học viên!' });
        }

        const result = await pool.request()
            .input('studentId', sql.BigInt, studentId)
            .query(`
                SELECT 
                    s.student_id,
                    s.student_code,
                    s.curriculum_id,
                    s.academic_status,
                    s.enrollment_date,
                    p.full_name,
                    p.dob,
                    p.id_card_number,
                    p.phone,
                    p.email,
                    p.address,
                    c.cohort,
                    c.orientation,
                    c.total_credits,
                    m.major_code,
                    m.major_name
                FROM students s
                JOIN admission_profiles p ON s.profile_id = p.profile_id
                JOIN curriculums c ON s.curriculum_id = c.curriculum_id
                JOIN majors m ON c.major_id = m.major_id
                WHERE s.student_id = @studentId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ học viên!' });
        }

        res.json({ success: true, student: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateMyInfo = async (req, res) => {
    const { email, phone, address = '' } = req.body || {};
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 100) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email hợp lệ (tối đa 100 ký tự).' });
    }
    if (typeof phone !== 'string' || phone.trim().length < 8 || phone.trim().length > 15 || !/^[0-9+().\-\s]+$/.test(phone.trim())) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập số điện thoại hợp lệ (8–15 ký tự).' });
    }
    if (typeof address !== 'string' || address.length > 500) {
        return res.status(400).json({ success: false, message: 'Địa chỉ không được vượt quá 500 ký tự.' });
    }

    let transaction;
    try {
        const pool = await poolPromise;
        const studentId = await resolveStudentId(pool, req.user);
        if (!studentId) {
            return res.status(404).json({ success: false, message: 'Tài khoản chưa được liên kết với hồ sơ học viên.' });
        }

        const studentResult = await pool.request()
            .input('studentId', sql.BigInt, studentId)
            .query(`
                SELECT s.user_id, s.profile_id, p.email, p.phone, p.address
                FROM students s
                JOIN admission_profiles p ON p.profile_id = s.profile_id
                WHERE s.student_id = @studentId
            `);
        const student = studentResult.recordset[0];
        if (!student) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ học viên.' });
        }

        transaction = new sql.Transaction(pool);
        await transaction.begin();
        await transaction.request()
            .input('userId', sql.BigInt, student.user_id)
            .input('profileId', sql.BigInt, student.profile_id)
            .input('email', sql.VarChar(100), email.trim().toLowerCase())
            .input('phone', sql.VarChar(15), phone.trim())
            .input('address', sql.NVarChar(500), address.trim() || null)
            .query(`
                UPDATE users SET email = @email WHERE user_id = @userId;
                UPDATE admission_profiles
                SET email = @email, phone = @phone, address = @address
                WHERE profile_id = @profileId;
            `);
        await transaction.commit();

        await writeAuditLog(
            req.user?.user_id,
            'UPDATE_STUDENT_PROFILE',
            'admission_profiles',
            student.profile_id,
            { email: student.email, phone: student.phone, address: student.address },
            { email: email.trim().toLowerCase(), phone: phone.trim(), address: address.trim() || null },
            req.ip
        );
        return res.json({ success: true, message: 'Cập nhật thông tin cá nhân thành công.' });
    } catch (err) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Lỗi hoàn tác cập nhật thông tin học viên:', rollbackError);
            }
        }
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ success: false, message: 'Email này đã được tài khoản khác sử dụng.' });
        }
        console.error('Lỗi cập nhật thông tin học viên:', err);
        return res.status(500).json({ success: false, message: 'Không thể cập nhật thông tin cá nhân.' });
    }
};

const CREDIT_PRICE = 750000; // Đơn giá 750.000 VNĐ / tín chỉ quy định AGU

// Hàm tự động đồng bộ và tính toán học phí theo số tín chỉ đã đăng ký cho học viên
const syncStudentTuition = async (pool, studentId) => {
    if (!studentId) return;

    // 1. Lấy danh sách các học kỳ mà học viên đã đăng ký học phần kèm tổng số tín chỉ
    const registeredSemesters = await pool.request()
        .input('studentId', sql.BigInt, studentId)
        .query(`
            SELECT cc.semester_id, ISNULL(SUM(c.credits), 0) AS total_credits
            FROM course_registrations cr
            JOIN course_classes cc ON cr.class_id = cc.class_id
            JOIN courses c ON cc.course_id = c.course_id
            WHERE cr.student_id = @studentId
            GROUP BY cc.semester_id
        `);

    for (const row of registeredSemesters.recordset) {
        const semId = row.semester_id;
        const totalCredits = Number(row.total_credits) || 0;
        const calculatedBase = totalCredits * CREDIT_PRICE;

        // Kiểm tra xem đã có bản ghi trong tuition_fees chưa
        const exist = await pool.request()
            .input('studentId', sql.BigInt, studentId)
            .input('semesterId', sql.Int, semId)
            .query(`
                SELECT tuition_id, base_amount, paid_amount, late_penalty_fee, status
                FROM tuition_fees
                WHERE student_id = @studentId AND semester_id = @semesterId
            `);

        if (exist.recordset.length === 0) {
            // Chưa có bản ghi -> Tự động sinh công nợ
            const semRes = await pool.request()
                .input('semesterId', sql.Int, semId)
                .query(`SELECT end_date FROM semesters WHERE semester_id = @semesterId`);
            const dueDate = semRes.recordset[0]?.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

            await pool.request()
                .input('studentId', sql.BigInt, studentId)
                .input('semesterId', sql.Int, semId)
                .input('baseAmount', sql.Decimal(12, 2), calculatedBase)
                .input('dueDate', sql.Date, dueDate)
                .input('paidAmount', sql.Decimal(12, 2), 0)
                .input('latePenaltyFee', sql.Decimal(12, 2), 0)
                .input('status', sql.NVarChar(30), calculatedBase > 0 ? 'Chưa thanh toán' : 'Hoàn thành')
                .query(`
                    INSERT INTO tuition_fees
                        (student_id, semester_id, base_amount, due_date, paid_amount, late_penalty_fee, status)
                    VALUES (@studentId, @semesterId, @baseAmount, @dueDate, @paidAmount, @latePenaltyFee, @status)
                `);
        } else {
            // Đã có bản ghi -> Cập nhật base_amount theo số tín chỉ thực tế
            const currentRec = exist.recordset[0];
            const paid = Number(currentRec.paid_amount || 0);
            const penalty = Number(currentRec.late_penalty_fee || 0);

            // Cập nhật lại base_amount nếu khác với tính toán theo tín chỉ
            if (Number(currentRec.base_amount) !== calculatedBase) {
                const finalStatus = paid >= calculatedBase + penalty && calculatedBase > 0
                    ? 'Hoàn thành'
                    : paid > 0
                    ? 'Đã thanh toán một phần'
                    : (calculatedBase === 0 && paid === 0)
                    ? 'Hoàn thành'
                    : 'Chưa thanh toán';

                await pool.request()
                    .input('tuitionId', sql.BigInt, currentRec.tuition_id)
                    .input('baseAmount', sql.Decimal(12, 2), calculatedBase)
                    .input('status', sql.NVarChar(30), finalStatus)
                    .query(`
                        UPDATE tuition_fees
                        SET base_amount = @baseAmount, status = @status
                        WHERE tuition_id = @tuitionId
                    `);
            }
        }
    }
};

exports.syncStudentTuition = syncStudentTuition;

// 2. Tra cứu học phí chi tiết từng học kỳ (GET /api/students/tuition)
exports.getTuition = async (req, res) => {
    try {
        const pool = await poolPromise;
        const studentId = req.user.role_code === 'ADMIN' && req.query.studentId 
            ? req.query.studentId 
            : await resolveStudentId(pool, req.user);

        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Thiếu mã học viên!' });
        }

        // Tự động đồng bộ công nợ học phí theo các môn đã đăng ký
        await syncStudentTuition(pool, studentId);

        const result = await pool.request()
            .input('studentId', sql.BigInt, studentId)
            .query(`
                SELECT 
                    t.tuition_id,
                    t.semester_id,
                    t.base_amount,
                    t.due_date,
                    t.paid_amount,
                    t.late_penalty_fee,
                    t.outstanding_balance,
                    t.status,
                    t.payment_slip_file,
                    t.payment_slip_status,
                    t.payment_slip_submitted_at,
                    t.payment_slip_note,
                    sem.semester_name,
                    sem.start_date,
                    sem.end_date
                FROM tuition_fees t
                JOIN semesters sem ON t.semester_id = sem.semester_id
                WHERE t.student_id = @studentId
                  AND (
                    t.base_amount > 0
                    OR t.paid_amount > 0
                    OR t.late_penalty_fee > 0
                    OR t.payment_slip_file IS NOT NULL
                  )
                ORDER BY sem.semester_id DESC
            `);

        // Lấy danh sách môn học đã đăng ký trong từng học kỳ để tính toán chi tiết học phí
        const coursesResult = await pool.request()
            .input('studentId', sql.BigInt, studentId)
            .query(`
                SELECT 
                    cc.semester_id,
                    c.course_id,
                    c.course_code,
                    c.course_name,
                    c.credits
                FROM course_registrations cr
                JOIN course_classes cc ON cr.class_id = cc.class_id
                JOIN courses c ON cc.course_id = c.course_id
                WHERE cr.student_id = @studentId
            `);

        const enrichedList = result.recordset.map(item => {
            const semCourses = coursesResult.recordset.filter(c => c.semester_id === item.semester_id);
            const registeredCredits = semCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
            return {
                ...item,
                credit_price: CREDIT_PRICE,
                registered_credits: registeredCredits,
                courses: semCourses.map(c => ({
                    course_id: c.course_id,
                    course_code: c.course_code,
                    course_name: c.course_name,
                    credits: c.credits,
                    amount: c.credits * CREDIT_PRICE
                }))
            };
        });

        const totalDebt = enrichedList.reduce((sum, item) => sum + Number(item.outstanding_balance || 0), 0);

        res.json({
            success: true,
            totalDebt,
            tuitionList: enrichedList
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getPaymentInfo = async (req, res) => {
    const qrImageUrl = process.env.BANK_QR_IMAGE_URL || null;
    return res.json({
        success: true,
        paymentInfo: {
            bankName: process.env.BANK_NAME || null,
            accountName: process.env.BANK_ACCOUNT_NAME || null,
            accountNumber: process.env.BANK_ACCOUNT_NUMBER || null,
            branch: process.env.BANK_BRANCH || null,
            qrImageUrl
        }
    });
};

exports.submitPaymentSlip = async (req, res) => {
    try {
        const tuitionId = Number(req.params.tuitionId);
        if (!Number.isSafeInteger(tuitionId) || tuitionId <= 0) {
            return res.status(400).json({ success: false, message: 'Mã học phí không hợp lệ.' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng đính kèm ảnh biên lai chuyển khoản.' });
        }

        const pool = await poolPromise;
        const studentId = await resolveStudentId(pool, req.user);
        if (!studentId) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ học viên.' });
        }

        const invoice = await pool.request()
            .input('tuitionId', sql.BigInt, tuitionId)
            .input('studentId', sql.BigInt, studentId)
            .query(`
                SELECT tuition_id, outstanding_balance
                FROM tuition_fees
                WHERE tuition_id = @tuitionId AND student_id = @studentId
            `);

        if (invoice.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn học phí của bạn.' });
        }
        if (Number(invoice.recordset[0].outstanding_balance) <= 0) {
            return res.status(400).json({ success: false, message: 'Hóa đơn này đã được thanh toán đầy đủ.' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        await pool.request()
            .input('tuitionId', sql.BigInt, tuitionId)
            .input('studentId', sql.BigInt, studentId)
            .input('fileUrl', sql.NVarChar(255), fileUrl)
            .query(`
                UPDATE tuition_fees
                SET payment_slip_file = @fileUrl,
                    payment_slip_status = N'Chờ xác nhận',
                    payment_slip_submitted_at = GETDATE(),
                    payment_slip_note = NULL
                WHERE tuition_id = @tuitionId AND student_id = @studentId
            `);

        await writeAuditLog(
            req.user.user_id,
            'SUBMIT_TUITION_PAYMENT_SLIP',
            'tuition_fees',
            tuitionId,
            null,
            { fileUrl, status: 'Chờ xác nhận' },
            req.ip
        );

        return res.status(201).json({
            success: true,
            message: 'Đã gửi biên lai. Học phí sẽ được cập nhật sau khi Phòng Sau Đại học xác nhận.'
        });
    } catch (err) {
        console.error('Lỗi gửi biên lai học phí:', err);
        return res.status(500).json({ success: false, message: 'Không thể gửi biên lai học phí.' });
    }
};

exports.getMyDefenseResult = async (req, res) => {
    try {
        const pool = await poolPromise;
        const studentId = await resolveStudentId(pool, req.user);
        if (!studentId) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ học viên.' });
        }

        const scheduleResult = await pool.request()
            .input('studentId', sql.BigInt, studentId)
            .query(`
                SELECT TOP 1 ds.defense_schedule_id, ds.defense_order, ds.start_time, c.committee_id,
                       ds.average_score, ds.result, c.committee_name, c.defense_date, c.defense_room,
                       c.president_id, c.reviewer_1_id, c.reviewer_2_id, c.secretary_id, c.member_id
                FROM thesis_progress tp
                JOIN thesis_defense_schedules ds ON ds.thesis_id = tp.thesis_id
                JOIN defense_committees c ON c.committee_id = ds.committee_id
                WHERE tp.student_id = @studentId
                ORDER BY c.defense_date DESC, ds.defense_schedule_id DESC
            `);
        if (scheduleResult.recordset.length === 0) {
            return res.json({ success: true, defense: null });
        }

        const schedule = scheduleResult.recordset[0];
        const memberResult = await pool.request()
            .input('committeeId', sql.Int, schedule.committee_id)
            .query(`
                SELECT members.role, l.full_name, l.degree
                FROM defense_committees c
                CROSS APPLY (VALUES
                    (N'Chủ tịch', c.president_id),
                    (N'Phản biện 1', c.reviewer_1_id),
                    (N'Phản biện 2', c.reviewer_2_id),
                    (N'Thư ký', c.secretary_id),
                    (N'Ủy viên', c.member_id)
                ) members(role, lecturer_id)
                JOIN lecturers l ON l.lecturer_id = members.lecturer_id
                WHERE c.committee_id = @committeeId
                ORDER BY CASE members.role
                    WHEN N'Chủ tịch' THEN 1
                    WHEN N'Phản biện 1' THEN 2
                    WHEN N'Phản biện 2' THEN 3
                    WHEN N'Thư ký' THEN 4
                    ELSE 5
                END
            `);
        const evaluationResult = await pool.request()
            .input('scheduleId', sql.BigInt, schedule.defense_schedule_id)
            .query(`
                SELECT e.role_in_committee, l.full_name, e.total_score, e.feedback
                FROM defense_evaluations e
                JOIN lecturers l ON l.lecturer_id = e.lecturer_id
                WHERE e.defense_schedule_id = @scheduleId
                ORDER BY e.role_in_committee
            `);

        return res.json({
            success: true,
            defense: {
                defense_schedule_id: schedule.defense_schedule_id,
                committee_name: schedule.committee_name,
                defense_date: schedule.defense_date,
                defense_room: schedule.defense_room,
                start_time: schedule.start_time,
                defense_order: schedule.defense_order,
                average_score: schedule.average_score,
                result: schedule.result,
                members: memberResult.recordset,
                evaluations: evaluationResult.recordset
            }
        });
    } catch (err) {
        console.error('Lỗi tải kết quả hội đồng:', err);
        return res.status(500).json({ success: false, message: 'Không thể tải kết quả hội đồng.' });
    }
};

// 3. Đăng ký học phần (POST /api/students/register-course)
exports.registerCourse = async (req, res) => {
    try {
        const { classId } = req.body;
        const pool = await poolPromise;
        const studentId = await resolveStudentId(pool, req.user);

        if (!studentId || !classId) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin lớp học phần!' });
        }

        const classAndPrerequisite = await pool.request()
            .input('classId', sql.Int, classId)
            .query(`
                SELECT cc.course_id, cc.semester_id, c.prerequisite_course_id,
                       prereq.course_code AS prerequisite_code, prereq.course_name AS prerequisite_name,
                       sch.day_of_week, sch.start_shift, sch.end_shift
                FROM course_classes cc
                JOIN courses c ON c.course_id = cc.course_id
                LEFT JOIN courses prereq ON prereq.course_id = c.prerequisite_course_id
                LEFT JOIN schedules sch ON sch.class_id = cc.class_id
                WHERE cc.class_id=@classId
            `);
        if (classAndPrerequisite.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Lớp học phần không tồn tại!' });
        }
        const academicClass = classAndPrerequisite.recordset[0];
        if (academicClass.prerequisite_course_id) {
            const prerequisiteCheck = await pool.request()
                .input('studentId', sql.BigInt, studentId)
                .input('prerequisiteCourseId', sql.Int, academicClass.prerequisite_course_id)
                .query(`
                    SELECT TOP 1 sg.final_grade
                    FROM course_registrations cr
                    JOIN course_classes cc ON cc.class_id=cr.class_id
                    JOIN student_grades sg ON sg.registration_id=cr.registration_id
                    WHERE cr.student_id=@studentId
                      AND cc.course_id=@prerequisiteCourseId
                      AND sg.final_grade >= 5
                      AND sg.is_locked=1
                    ORDER BY sg.final_grade DESC
                `);
            if (prerequisiteCheck.recordset.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Chưa đạt học phần tiên quyết: ${academicClass.prerequisite_code} - ${academicClass.prerequisite_name}.`
                });
            }
        }
        if (academicClass.day_of_week) {
            const conflictCheck = await pool.request()
                .input('studentId', sql.BigInt, studentId)
                .input('dayOfWeek', sql.Int, academicClass.day_of_week)
                .input('startShift', sql.Int, academicClass.start_shift)
                .input('endShift', sql.Int, academicClass.end_shift)
                .query(`
                    SELECT TOP 1 c.course_code, c.course_name, cc.class_name
                    FROM course_registrations cr
                    JOIN course_classes cc ON cc.class_id=cr.class_id
                    JOIN courses c ON c.course_id=cc.course_id
                    JOIN schedules sch ON sch.class_id=cc.class_id
                    WHERE cr.student_id=@studentId
                      AND sch.day_of_week=@dayOfWeek
                      AND sch.start_shift <= @endShift
                      AND sch.end_shift >= @startShift
                `);
            if (conflictCheck.recordset.length > 0) {
                const conflict = conflictCheck.recordset[0];
                return res.status(409).json({
                    success: false,
                    message: `Trùng lịch với ${conflict.course_code} - ${conflict.course_name} (${conflict.class_name}).`
                });
            }
        }

        // Kiểm tra lớp có mở không và sĩ số
        const classCheck = await pool.request()
            .input('classId', sql.Int, classId)
            .query(`
                SELECT max_students, status,
                       (SELECT COUNT(*) FROM course_registrations WHERE class_id = @classId) AS current_count
                FROM course_classes WHERE class_id = @classId
            `);

        if (classCheck.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Lớp học phần không tồn tại!' });
        }

        const cInfo = classCheck.recordset[0];
        if (cInfo.status !== 'Mở đăng ký') {
            return res.status(400).json({ success: false, message: `Lớp học phần hiện đang ở trạng thái: ${cInfo.status}` });
        }

        if (cInfo.current_count >= cInfo.max_students) {
            return res.status(400).json({ success: false, message: 'Lớp học phần đã đầy sĩ số tối đa!' });
        }

        // Đăng ký và sinh bản ghi điểm rỗng
        const regInsert = await pool.request()
            .input('studentId', sql.BigInt, studentId)
            .input('classId', sql.Int, classId)
            .query(`
                INSERT INTO course_registrations (student_id, class_id)
                OUTPUT INSERTED.registration_id
                VALUES (@studentId, @classId)
            `);

        const regId = regInsert.recordset[0].registration_id;

        await pool.request()
            .input('regId', sql.BigInt, regId)
            .query(`INSERT INTO student_grades (registration_id, process_grade, exam_grade, final_grade, is_locked)
                    VALUES (@regId, NULL, NULL, NULL, 0)`);

        // Tự động đồng bộ học phí theo tín chỉ đã đăng ký
        await syncStudentTuition(pool, studentId);

        res.status(201).json({ success: true, message: 'Đăng ký học phần thành công!' });
    } catch (err) {
        if (err.message && err.message.includes('UQ_student_class')) {
            return res.status(400).json({ success: false, message: 'Bạn đã đăng ký học phần này rồi!' });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4.1. Hủy đăng ký học phần (DELETE /api/students/cancel-course/:registrationId)
exports.cancelCourseRegistration = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const pool = await poolPromise;
        const studentId = await resolveStudentId(pool, req.user);
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin học viên!' });
        }

        const check = await pool.request()
            .input('regId', sql.BigInt, registrationId)
            .input('studentId', sql.BigInt, studentId)
            .query(`
                SELECT cr.registration_id, sg.final_grade, sg.is_locked, cc.class_name
                FROM course_registrations cr
                JOIN course_classes cc ON cr.class_id = cc.class_id
                LEFT JOIN student_grades sg ON cr.registration_id = sg.registration_id
                WHERE cr.registration_id = @regId AND cr.student_id = @studentId
            `);

        if (check.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lượt đăng ký học phần này.' });
        }

        const item = check.recordset[0];
        if (item.is_locked || item.final_grade !== null) {
            return res.status(400).json({ success: false, message: 'Không thể hủy môn học đã có điểm hoặc đã chốt điểm.' });
        }

        let transaction = new sql.Transaction(pool);
        await transaction.begin();
        await transaction.request()
            .input('regId', sql.BigInt, registrationId)
            .query('DELETE FROM student_grades WHERE registration_id = @regId');
        await transaction.request()
            .input('regId', sql.BigInt, registrationId)
            .query('DELETE FROM course_registrations WHERE registration_id = @regId');
        await transaction.commit();

        await writeAuditLog(req.user.user_id, 'CANCEL_COURSE_REGISTRATION', 'course_registrations', registrationId, null, null, req.ip);

        // Tự động đồng bộ lại học phí sau khi hủy môn
        await syncStudentTuition(pool, studentId);

        return res.json({ success: true, message: `Đã hủy đăng ký lớp ${item.class_name} thành công.` });
    } catch (err) {
        console.error('Lỗi hủy môn học:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 5. Xem danh sách lớp học phần đã đăng ký & Thời khóa biểu (GET /api/students/schedule)
exports.getMyCourses = async (req, res) => {
    try {
        const pool = await poolPromise;
        const studentId = await resolveStudentId(pool, req.user);

        const result = await pool.request()
            .input('studentId', sql.BigInt, studentId)
            .query(`
                SELECT 
                    cr.registration_id,
                    cr.registered_at,
                    cc.class_name,
                    c.course_code,
                    c.course_name,
                    c.credits,
                    sem.semester_name,
                    sch.room_name,
                    sch.day_of_week,
                    sch.start_shift,
                    sch.end_shift,
                    l.full_name AS lecturer_name
                FROM course_registrations cr
                JOIN course_classes cc ON cr.class_id = cc.class_id
                JOIN courses c ON cc.course_id = c.course_id
                JOIN semesters sem ON cc.semester_id = sem.semester_id
                LEFT JOIN schedules sch ON cc.class_id = sch.class_id
                LEFT JOIN lecturers l ON sch.lecturer_id = l.lecturer_id
                WHERE cr.student_id = @studentId
                ORDER BY sem.semester_id DESC, sch.day_of_week ASC
            `);

        res.json({ success: true, courses: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 6. Xem bảng điểm học viên (GET /api/students/grades)
exports.getMyGrades = async (req, res) => {
    try {
        const pool = await poolPromise;
        const studentId = req.user.role_code === 'ADMIN' && req.query.studentId
            ? req.query.studentId
            : await resolveStudentId(pool, req.user);

        const result = await pool.request()
            .input('studentId', sql.BigInt, studentId)
            .query(`
                SELECT 
                    g.grade_id,
                    g.process_grade,
                    g.exam_grade,
                    g.final_grade,
                    g.is_locked,
                    c.course_code,
                    c.course_name,
                    c.credits,
                    sem.semester_name
                FROM student_grades g
                JOIN course_registrations cr ON g.registration_id = cr.registration_id
                JOIN course_classes cc ON cr.class_id = cc.class_id
                JOIN courses c ON cc.course_id = c.course_id
                JOIN semesters sem ON cc.semester_id = sem.semester_id
                WHERE cr.student_id = @studentId
            `);

        res.json({ success: true, grades: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 7. Giảng viên xem các lớp được phân công
exports.getLecturerClasses = async (req, res) => {
    try {
        const pool = await poolPromise;
        const lecturerId = req.user.role_code === 'ADMIN' && req.query.lecturerId
            ? Number(req.query.lecturerId)
            : await resolveLecturerId(pool, req.user);
        if (!lecturerId) return res.status(400).json({ success: false, message: 'Thiếu mã giảng viên.' });

        const result = await pool.request()
            .input('lecturerId', sql.Int, lecturerId)
            .query(`
                SELECT cc.class_id, cc.class_name, cc.status, cc.max_students,
                       c.course_id, c.course_code, c.course_name, c.credits,
                       sem.semester_id, sem.semester_name,
                       sch.room_name, sch.day_of_week, sch.start_shift, sch.end_shift,
                       (SELECT COUNT(*) FROM course_registrations cr WHERE cr.class_id=cc.class_id) AS registered_count
                FROM schedules sch
                JOIN course_classes cc ON cc.class_id=sch.class_id
                JOIN courses c ON c.course_id=cc.course_id
                JOIN semesters sem ON sem.semester_id=cc.semester_id
                WHERE sch.lecturer_id=@lecturerId
                ORDER BY sem.semester_id DESC, c.course_code
            `);
        return res.json({ success: true, classes: result.recordset });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.getLecturerClassStudents = async (req, res) => {
    const classId = Number(req.params.classId);
    if (!Number.isSafeInteger(classId) || classId <= 0) {
        return res.status(400).json({ success: false, message: 'Mã lớp không hợp lệ.' });
    }
    try {
        const pool = await poolPromise;
        const lecturerId = req.user.role_code === 'ADMIN' ? null : await resolveLecturerId(pool, req.user);
        if (req.user.role_code !== 'ADMIN' && !lecturerId) {
            return res.status(400).json({ success: false, message: 'Thiếu mã giảng viên.' });
        }
        const request = pool.request()
            .input('classId', sql.Int, classId);
        if (lecturerId) request.input('lecturerId', sql.Int, lecturerId);
        const result = await request.query(`
            SELECT cr.registration_id, s.student_id, s.student_code, p.full_name, p.email,
                   sg.grade_id, sg.process_grade, sg.exam_grade, sg.final_grade, sg.is_locked
            FROM course_registrations cr
            JOIN students s ON s.student_id=cr.student_id
            JOIN admission_profiles p ON p.profile_id=s.profile_id
            LEFT JOIN student_grades sg ON sg.registration_id=cr.registration_id
            JOIN course_classes cc ON cc.class_id=cr.class_id
            WHERE cr.class_id=@classId
              ${lecturerId ? 'AND EXISTS (SELECT 1 FROM schedules sch WHERE sch.class_id=@classId AND sch.lecturer_id=@lecturerId)' : ''}
            ORDER BY p.full_name
        `);
        return res.json({ success: true, students: result.recordset });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 8. Nhập điểm học phần - Giảng viên / Admin (PUT /api/students/enter-grades)
exports.enterGrades = async (req, res) => {
    try {
        const { gradeId, processGrade, examGrade } = req.body;
        if (!gradeId) {
            return res.status(400).json({ success: false, message: 'Thiếu mã bản ghi điểm!' });
        }

        const pool = await poolPromise;
        const gradeCheck = await pool.request()
            .input('gradeId', sql.BigInt, gradeId)
            .query(`SELECT is_locked FROM student_grades WHERE grade_id = @gradeId`);

        if (gradeCheck.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bản ghi điểm!' });
        }

        if (gradeCheck.recordset[0].is_locked) {
            return res.status(400).json({ success: false, message: 'Điểm của học phần này đã bị khóa, không thể chỉnh sửa!' });
        }
        if (req.user.role_code === 'LECTURER') {
            const lecturerId = await resolveLecturerId(pool, req.user);
            const assignmentCheck = await pool.request()
                .input('gradeId', sql.BigInt, gradeId)
                .input('lecturerId', sql.Int, lecturerId)
                .query(`
                    SELECT 1
                    FROM student_grades sg
                    JOIN course_registrations cr ON cr.registration_id=sg.registration_id
                    JOIN schedules sch ON sch.class_id=cr.class_id
                    WHERE sg.grade_id=@gradeId AND sch.lecturer_id=@lecturerId
                `);
            if (assignmentCheck.recordset.length === 0) {
                return res.status(403).json({ success: false, message: 'Bạn không phụ trách lớp học phần này.' });
            }
        }

        const pGrade = processGrade !== undefined ? parseFloat(processGrade) : null;
        const eGrade = examGrade !== undefined ? parseFloat(examGrade) : null;
        if ((pGrade !== null && (!Number.isFinite(pGrade) || pGrade < 0 || pGrade > 10)) ||
            (eGrade !== null && (!Number.isFinite(eGrade) || eGrade < 0 || eGrade > 10))) {
            return res.status(400).json({ success: false, message: 'Điểm phải nằm trong khoảng từ 0 đến 10.' });
        }
        let finalGrade = null;
        if (pGrade !== null && eGrade !== null) {
            finalGrade = Math.round((pGrade * 0.4 + eGrade * 0.6) * 100) / 100;
        }

        await pool.request()
            .input('gradeId', sql.BigInt, gradeId)
            .input('pGrade', sql.Decimal(4, 2), pGrade)
            .input('eGrade', sql.Decimal(4, 2), eGrade)
            .input('fGrade', sql.Decimal(4, 2), finalGrade)
            .query(`
                UPDATE student_grades
                SET process_grade = @pGrade, exam_grade = @eGrade, final_grade = @fGrade
                WHERE grade_id = @gradeId
            `);

        await writeAuditLog(req.user?.user_id, 'ENTER_GRADES', 'student_grades', gradeId, null, { pGrade, eGrade, finalGrade }, req.ip);

        res.json({
            success: true,
            message: 'Cập nhật điểm thành công!',
            data: { gradeId, processGrade: pGrade, examGrade: eGrade, finalGrade }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
