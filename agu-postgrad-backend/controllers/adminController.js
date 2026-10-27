const bcrypt = require('bcryptjs');
const { sql, poolPromise, writeAuditLog } = require('../config/db');

const validDegrees = ['Tiến sĩ', 'Phó Giáo sư', 'Giáo sư'];

function validateLecturer(body, requirePassword) {
    const { username, lecturerCode, fullName, degree, email, phone, maxSlots, password } = body || {};
    if (![username, lecturerCode, fullName, degree, email].every(value => typeof value === 'string' && value.trim())) {
        return 'Vui lòng nhập tên đăng nhập, mã giảng viên, họ tên, học vị và email.';
    }
    if (username.trim().length > 100 || lecturerCode.trim().length > 20 || fullName.trim().length > 150 || email.trim().length > 100) {
        return 'Tên đăng nhập, mã giảng viên, họ tên hoặc email vượt quá độ dài cho phép.';
    }
    if (phone !== undefined && phone !== null && (typeof phone !== 'string' || phone.trim().length > 15)) {
        return 'Số điện thoại không được dài quá 15 ký tự.';
    }
    if (requirePassword && (typeof password !== 'string' || password.length < 8)) {
        return 'Mật khẩu ban đầu phải có ít nhất 8 ký tự.';
    }
    if (!requirePassword && password && (typeof password !== 'string' || password.length < 8)) {
        return 'Mật khẩu mới phải có ít nhất 8 ký tự.';
    }
    if (!validDegrees.includes(degree)) {
        return 'Học vị phải là Tiến sĩ, Phó Giáo sư hoặc Giáo sư.';
    }
    if (!Number.isInteger(Number(maxSlots)) || Number(maxSlots) < 1) {
        return 'Số lượng học viên hướng dẫn tối đa phải là số nguyên dương.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return 'Địa chỉ email không hợp lệ.';
    }
    return null;
}

function parseLecturerId(value) {
    const lecturerId = Number(value);
    return Number.isSafeInteger(lecturerId) && lecturerId > 0 ? lecturerId : null;
}

function sendDatabaseError(res, err) {
    if (err.number === 2627 || err.number === 2601) {
        return res.status(409).json({
            success: false,
            message: 'Tên đăng nhập, mã giảng viên hoặc email đã được sử dụng.'
        });
    }
    if (err.number === 547) {
        return res.status(409).json({
            success: false,
            message: 'Không thể xóa giảng viên vì đang được sử dụng trong lớp học, phân công hướng dẫn hoặc hội đồng.'
        });
    }
    console.error('Lỗi quản lý giảng viên:', err);
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi quản lý giảng viên.' });
}

exports.getLecturers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT l.lecturer_id, l.user_id, u.username, u.status AS account_status,
                   l.lecturer_code, l.full_name, l.degree, l.max_slots, l.email, l.phone,
                   ISNULL(active_adv.active_count, 0) AS current_assigned,
                   (l.max_slots - ISNULL(active_adv.active_count, 0)) AS slots_left
            FROM lecturers l
            JOIN users u ON u.user_id = l.user_id
            LEFT JOIN (
                SELECT lecturer_id, COUNT(*) AS active_count
                FROM advisor_assignments
                WHERE status = N'Đang hướng dẫn'
                GROUP BY lecturer_id
            ) active_adv ON l.lecturer_id = active_adv.lecturer_id
            ORDER BY l.full_name ASC
        `);
        return res.json({ success: true, lecturers: result.recordset });
    } catch (err) {
        return sendDatabaseError(res, err);
    }
};

exports.getCommittees = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT c.committee_id, c.committee_name, c.defense_date, c.defense_room,
                   c.president_id, c.reviewer_1_id, c.reviewer_2_id, c.secretary_id, c.member_id,
                   president.full_name AS president_name,
                   reviewer1.full_name AS reviewer1_name,
                   reviewer2.full_name AS reviewer2_name,
                   secretary.full_name AS secretary_name,
                   member.full_name AS member_name,
                   ds.defense_schedule_id, ds.defense_order, ds.start_time,
                   ds.average_score, ds.result AS defense_result,
                   ISNULL(evaluation_counts.evaluation_count, 0) AS evaluation_count,
                   tp.thesis_title, s.student_code, p.full_name AS student_name
            FROM defense_committees c
            JOIN lecturers president ON president.lecturer_id = c.president_id
            JOIN lecturers reviewer1 ON reviewer1.lecturer_id = c.reviewer_1_id
            JOIN lecturers reviewer2 ON reviewer2.lecturer_id = c.reviewer_2_id
            JOIN lecturers secretary ON secretary.lecturer_id = c.secretary_id
            JOIN lecturers member ON member.lecturer_id = c.member_id
            LEFT JOIN thesis_defense_schedules ds ON ds.committee_id = c.committee_id
            LEFT JOIN thesis_progress tp ON tp.thesis_id = ds.thesis_id
            LEFT JOIN students s ON s.student_id = tp.student_id
            LEFT JOIN admission_profiles p ON p.profile_id = s.profile_id
            LEFT JOIN (
                SELECT defense_schedule_id, COUNT(*) AS evaluation_count
                FROM defense_evaluations
                GROUP BY defense_schedule_id
            ) evaluation_counts ON evaluation_counts.defense_schedule_id = ds.defense_schedule_id
            ORDER BY c.defense_date DESC, c.committee_id DESC, ds.defense_order ASC
        `);
        return res.json({ success: true, committees: result.recordset });
    } catch (err) {
        return sendDatabaseError(res, err);
    }
};

exports.getDefenseCandidates = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT tp.thesis_id, tp.thesis_title, tp.current_stage, tp.status AS thesis_status,
                   s.student_id, s.student_code, p.full_name AS student_name
            FROM thesis_progress tp
            JOIN students s ON s.student_id = tp.student_id
            JOIN admission_profiles p ON p.profile_id = s.profile_id
            WHERE NOT EXISTS (
                SELECT 1
                FROM thesis_defense_schedules ds
                WHERE ds.thesis_id = tp.thesis_id
            )
            ORDER BY p.full_name ASC
        `);
        return res.json({ success: true, candidates: result.recordset });
    } catch (err) {
        return sendDatabaseError(res, err);
    }
};

exports.getDefenseEvaluations = async (req, res) => {
    const scheduleId = Number(req.params.id);
    if (!Number.isSafeInteger(scheduleId) || scheduleId < 1) {
        return res.status(400).json({ success: false, message: 'Mã lịch bảo vệ không hợp lệ.' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('scheduleId', sql.BigInt, scheduleId)
            .query(`
                SELECT e.lecturer_id AS lecturerId, e.role_in_committee AS roleInCommittee,
                       e.content_score AS contentScore, e.presentation_score AS presentationScore,
                       e.qa_score AS qaScore, e.feedback
                FROM defense_evaluations e
                WHERE e.defense_schedule_id = @scheduleId
                ORDER BY e.evaluation_id
            `);
        return res.json({ success: true, evaluations: result.recordset });
    } catch (err) {
        return sendDatabaseError(res, err);
    }
};

exports.saveDefenseEvaluations = async (req, res) => {
    const scheduleId = Number(req.params.id);
    if (!Number.isSafeInteger(scheduleId) || scheduleId < 1) {
        return res.status(400).json({ success: false, message: 'Mã lịch bảo vệ không hợp lệ.' });
    }

    const evaluations = req.body?.evaluations;
    if (!Array.isArray(evaluations) || evaluations.length < 1 || evaluations.length > 5) {
        return res.status(400).json({ success: false, message: 'Nhập ít nhất một phiếu chấm hợp lệ.' });
    }

    const validRoles = new Map([
        ['president_id', 'Chủ tịch'],
        ['reviewer_1_id', 'Phản biện 1'],
        ['reviewer_2_id', 'Phản biện 2'],
        ['secretary_id', 'Thư ký'],
        ['member_id', 'Ủy viên']
    ]);
    const seenLecturers = new Set();
    for (const evaluation of evaluations) {
        const lecturerId = Number(evaluation?.lecturerId);
        const contentScore = evaluation?.contentScore;
        const presentationScore = evaluation?.presentationScore;
        const qaScore = evaluation?.qaScore;
        if (!Number.isSafeInteger(lecturerId) || lecturerId < 1 || seenLecturers.has(lecturerId)) {
            return res.status(400).json({ success: false, message: 'Giảng viên trong các phiếu chấm phải hợp lệ và không trùng nhau.' });
        }
        if (typeof contentScore !== 'number' || !Number.isFinite(contentScore) || contentScore < 0 || contentScore > 5 ||
            typeof presentationScore !== 'number' || !Number.isFinite(presentationScore) || presentationScore < 0 || presentationScore > 2.5 ||
            typeof qaScore !== 'number' || !Number.isFinite(qaScore) || qaScore < 0 || qaScore > 2.5) {
            return res.status(400).json({
                success: false,
                message: 'Điểm không hợp lệ: nội dung 0–5, trình bày 0–2.5, hỏi đáp 0–2.5.'
            });
        }
        if (typeof evaluation.feedback !== 'undefined' &&
            (typeof evaluation.feedback !== 'string' || evaluation.feedback.length > 4000)) {
            return res.status(400).json({ success: false, message: 'Nhận xét không được vượt quá 4000 ký tự.' });
        }
        seenLecturers.add(lecturerId);
    }

    let transaction;
    let transactionComplete = false;
    try {
        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const scheduleResult = await transaction.request()
            .input('scheduleId', sql.BigInt, scheduleId)
            .query(`
                SELECT ds.defense_schedule_id, c.president_id, c.reviewer_1_id, c.reviewer_2_id,
                       c.secretary_id, c.member_id
                FROM thesis_defense_schedules ds
                JOIN defense_committees c ON c.committee_id = ds.committee_id
                WHERE ds.defense_schedule_id = @scheduleId
            `);
        if (!scheduleResult.recordset.length) {
            await transaction.rollback();
            transactionComplete = true;
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch bảo vệ.' });
        }

        const schedule = scheduleResult.recordset[0];
        const assignedRoles = new Map();
        for (const [column, role] of validRoles) assignedRoles.set(Number(schedule[column]), role);

        for (const evaluation of evaluations) {
            const lecturerId = Number(evaluation.lecturerId);
            const role = assignedRoles.get(lecturerId);
            if (!role) {
                await transaction.rollback();
                transactionComplete = true;
                return res.status(400).json({
                    success: false,
                    message: 'Chỉ giảng viên thuộc hội đồng này mới được ghi phiếu chấm.'
                });
            }

            await transaction.request()
                .input('scheduleId', sql.BigInt, scheduleId)
                .input('lecturerId', sql.Int, lecturerId)
                .input('role', sql.NVarChar(50), role)
                .input('contentScore', sql.Decimal(4, 2), evaluation.contentScore)
                .input('presentationScore', sql.Decimal(4, 2), evaluation.presentationScore)
                .input('qaScore', sql.Decimal(4, 2), evaluation.qaScore)
                .input('feedback', sql.NVarChar(sql.MAX), evaluation.feedback || null)
                .query(`
                    MERGE INTO defense_evaluations AS target
                    USING (SELECT @scheduleId AS defense_schedule_id, @lecturerId AS lecturer_id) AS source
                    ON target.defense_schedule_id = source.defense_schedule_id
                       AND target.lecturer_id = source.lecturer_id
                    WHEN MATCHED THEN UPDATE SET
                        role_in_committee = @role,
                        content_score = @contentScore,
                        presentation_score = @presentationScore,
                        qa_score = @qaScore,
                        feedback = @feedback,
                        created_at = GETDATE()
                    WHEN NOT MATCHED THEN INSERT (
                        defense_schedule_id, lecturer_id, role_in_committee,
                        content_score, presentation_score, qa_score, feedback
                    ) VALUES (
                        @scheduleId, @lecturerId, @role,
                        @contentScore, @presentationScore, @qaScore, @feedback
                    );
                `);
        }

        await transaction.request()
            .input('p_defense_schedule_id', sql.BigInt, scheduleId)
            .execute('sp_calculate_defense_final_grade');

        const summary = await transaction.request()
            .input('scheduleId', sql.BigInt, scheduleId)
            .query(`
                SELECT ds.average_score, ds.result,
                       (SELECT COUNT(*) FROM defense_evaluations e
                        WHERE e.defense_schedule_id = ds.defense_schedule_id) AS evaluation_count
                FROM thesis_defense_schedules ds
                WHERE ds.defense_schedule_id = @scheduleId
            `);
        await transaction.commit();
        transactionComplete = true;

        await writeAuditLog(req.user.user_id, 'SAVE_DEFENSE_EVALUATIONS', 'defense_evaluations', scheduleId, null, {
            submittedCount: evaluations.length,
            evaluationCount: summary.recordset[0].evaluation_count,
            averageScore: summary.recordset[0].average_score,
            result: summary.recordset[0].result
        }, req.ip);

        return res.json({
            success: true,
            message: Number(summary.recordset[0].evaluation_count) >= 3
                ? 'Đã lưu điểm và cập nhật kết quả bảo vệ.'
                : `Đã lưu phiếu chấm. Cần thêm ${3 - Number(summary.recordset[0].evaluation_count)} phiếu để cập nhật kết quả.`,
            data: summary.recordset[0]
        });
    } catch (err) {
        if (transaction && !transactionComplete) {
            try { await transaction.rollback(); } catch (rollbackError) {
                console.error('Không thể hoàn tác lưu phiếu chấm:', rollbackError);
            }
        }
        console.error('Lỗi lưu điểm bảo vệ:', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu điểm bảo vệ.' });
    }
};

exports.createLecturer = async (req, res) => {
    const validationError = validateLecturer(req.body, true);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const { username, lecturerCode, fullName, degree, email, phone, maxSlots, password } = req.body;
    let transaction;
    let transactionComplete = false;
    try {
        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const roleResult = await transaction.request()
            .input('roleCode', sql.VarChar, 'LECTURER')
            .query('SELECT role_id FROM roles WHERE role_code = @roleCode');
        if (!roleResult.recordset.length) {
            await transaction.rollback();
            transactionComplete = true;
            return res.status(500).json({ success: false, message: 'Chưa cấu hình vai trò LECTURER trong cơ sở dữ liệu.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userResult = await transaction.request()
            .input('username', sql.VarChar(100), username.trim())
            .input('passwordHash', sql.VarChar(255), passwordHash)
            .input('email', sql.VarChar(100), email.trim())
            .input('roleId', sql.Int, roleResult.recordset[0].role_id)
            .query(`
                INSERT INTO users (username, password_hash, email, role_id, status)
                OUTPUT INSERTED.user_id
                VALUES (@username, @passwordHash, @email, @roleId, 'Active')
            `);
        const userId = userResult.recordset[0].user_id;

        const lecturerResult = await transaction.request()
            .input('userId', sql.BigInt, userId)
            .input('lecturerCode', sql.VarChar(20), lecturerCode.trim())
            .input('fullName', sql.NVarChar(150), fullName.trim())
            .input('degree', sql.NVarChar(30), degree)
            .input('maxSlots', sql.Int, Number(maxSlots))
            .input('email', sql.VarChar(100), email.trim())
            .input('phone', sql.VarChar(15), phone ? phone.trim() : null)
            .query(`
                INSERT INTO lecturers (user_id, lecturer_code, full_name, degree, max_slots, email, phone)
                OUTPUT INSERTED.lecturer_id
                VALUES (@userId, @lecturerCode, @fullName, @degree, @maxSlots, @email, @phone)
            `);
        const lecturerId = lecturerResult.recordset[0].lecturer_id;
        await transaction.commit();
        transactionComplete = true;

        await writeAuditLog(req.user.user_id, 'CREATE_LECTURER', 'lecturers', lecturerId, null, {
            username, lecturerCode, fullName, degree, email, maxSlots: Number(maxSlots)
        }, req.ip);
        return res.status(201).json({ success: true, message: 'Thêm giảng viên thành công.', lecturerId });
    } catch (err) {
        if (transaction && !transactionComplete) {
            try { await transaction.rollback(); } catch (rollbackError) {
                console.error('Không thể hoàn tác tạo giảng viên:', rollbackError);
            }
        }
        return sendDatabaseError(res, err);
    }
};

exports.updateLecturer = async (req, res) => {
    const validationError = validateLecturer(req.body, false);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const lecturerId = parseLecturerId(req.params.id);
    if (!lecturerId) return res.status(400).json({ success: false, message: 'Mã giảng viên không hợp lệ.' });

    const { username, lecturerCode, fullName, degree, email, phone, maxSlots, password } = req.body;
    let transaction;
    let transactionComplete = false;
    try {
        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const lecturerResult = await transaction.request()
            .input('lecturerId', sql.Int, lecturerId)
            .query('SELECT user_id FROM lecturers WHERE lecturer_id = @lecturerId');
        if (!lecturerResult.recordset.length) {
            await transaction.rollback();
            transactionComplete = true;
            return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên.' });
        }

        const userId = lecturerResult.recordset[0].user_id;
        const assignmentsResult = await transaction.request()
            .input('lecturerId', sql.Int, lecturerId)
            .query(`
                SELECT COUNT(*) AS assignedCount
                FROM advisor_assignments
                WHERE lecturer_id = @lecturerId AND status = N'Đang hướng dẫn'
            `);
        if (Number(maxSlots) < assignmentsResult.recordset[0].assignedCount) {
            await transaction.rollback();
            transactionComplete = true;
            return res.status(400).json({
                success: false,
                message: 'Không thể đặt hạn mức thấp hơn số học viên đang được giảng viên hướng dẫn.'
            });
        }
        const updateUser = transaction.request()
            .input('userId', sql.BigInt, userId)
            .input('username', sql.VarChar(100), username.trim())
            .input('email', sql.VarChar(100), email.trim());
        let userQuery = 'UPDATE users SET username = @username, email = @email';
        if (password) {
            updateUser.input('passwordHash', sql.VarChar(255), await bcrypt.hash(password, 10));
            userQuery += ', password_hash = @passwordHash';
        }
        await updateUser.query(`${userQuery} WHERE user_id = @userId`);

        await transaction.request()
            .input('lecturerId', sql.Int, lecturerId)
            .input('lecturerCode', sql.VarChar(20), lecturerCode.trim())
            .input('fullName', sql.NVarChar(150), fullName.trim())
            .input('degree', sql.NVarChar(30), degree)
            .input('maxSlots', sql.Int, Number(maxSlots))
            .input('email', sql.VarChar(100), email.trim())
            .input('phone', sql.VarChar(15), phone ? phone.trim() : null)
            .query(`
                UPDATE lecturers
                SET lecturer_code = @lecturerCode, full_name = @fullName, degree = @degree,
                    max_slots = @maxSlots, email = @email, phone = @phone
                WHERE lecturer_id = @lecturerId
            `);
        await transaction.commit();
        transactionComplete = true;

        await writeAuditLog(req.user.user_id, 'UPDATE_LECTURER', 'lecturers', lecturerId, null, {
            username, lecturerCode, fullName, degree, email, maxSlots: Number(maxSlots)
        }, req.ip);
        return res.json({ success: true, message: 'Cập nhật thông tin giảng viên thành công.' });
    } catch (err) {
        if (transaction && !transactionComplete) {
            try { await transaction.rollback(); } catch (rollbackError) {
                console.error('Không thể hoàn tác cập nhật giảng viên:', rollbackError);
            }
        }
        return sendDatabaseError(res, err);
    }
};

exports.deleteLecturer = async (req, res) => {
    const lecturerId = parseLecturerId(req.params.id);
    if (!lecturerId) return res.status(400).json({ success: false, message: 'Mã giảng viên không hợp lệ.' });
    let transaction;
    let transactionComplete = false;
    try {
        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        const deleteResult = await transaction.request()
            .input('lecturerId', sql.Int, lecturerId)
            .query(`
                DELETE FROM lecturers
                OUTPUT DELETED.user_id
                WHERE lecturer_id = @lecturerId
            `);
        if (!deleteResult.recordset.length) {
            await transaction.rollback();
            transactionComplete = true;
            return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên.' });
        }

        await transaction.request()
            .input('userId', sql.BigInt, deleteResult.recordset[0].user_id)
            .query('DELETE FROM users WHERE user_id = @userId');
        await transaction.commit();
        transactionComplete = true;

        await writeAuditLog(req.user.user_id, 'DELETE_LECTURER', 'lecturers', lecturerId, null, null, req.ip);
        return res.json({ success: true, message: 'Đã xóa giảng viên và tài khoản đăng nhập.' });
    } catch (err) {
        if (transaction && !transactionComplete) {
            try { await transaction.rollback(); } catch (rollbackError) {
                console.error('Không thể hoàn tác xóa giảng viên:', rollbackError);
            }
        }
        return sendDatabaseError(res, err);
    }
};
