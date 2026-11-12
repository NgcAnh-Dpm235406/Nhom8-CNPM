const { sql, poolPromise, writeAuditLog } = require('../config/db');

// Helper lấy student_id
async function resolveStudentId(pool, user) {
    if (user.student_id) return user.student_id;
    const res = await pool.request()
        .input('userId', sql.BigInt, user.user_id)
        .query(`SELECT student_id FROM students WHERE user_id = @userId`);
    return res.recordset.length > 0 ? res.recordset[0].student_id : null;
}

// 1. GATEKEEPER: Kiểm tra 4 điều kiện bảo vệ Luận văn Thạc sĩ (GET /api/committee/gatekeeper-check/:studentId?)
// Gọi trực tiếp Stored Procedure: sp_check_thesis_defense_gatekeeper
exports.checkDefenseGatekeeper = async (req, res) => {
    try {
        const pool = await poolPromise;
        const studentId = req.params.studentId || await resolveStudentId(pool, req.user);

        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã học viên cần kiểm tra!' });
        }

        const request = pool.request();
        request.input('p_student_id', sql.BigInt, studentId);
        request.output('p_is_eligible', sql.Bit);
        request.output('p_message', sql.NVarChar(sql.MAX));

        const result = await request.execute('sp_check_thesis_defense_gatekeeper');

        const isEligible = Boolean(result.output.p_is_eligible);
        const message = result.output.p_message;

        res.json({
            success: true,
            studentId,
            isEligible,
            message,
            statusBadge: isEligible ? 'Đủ điều kiện bảo vệ' : 'Chưa đủ điều kiện'
        });
    } catch (err) {
        console.error('Lỗi khi chạy Gatekeeper:', err);
        res.status(500).json({ success: false, message: 'Lỗi Gatekeeper: ' + err.message });
    }
};

// 2. Thành lập Hội đồng Bảo vệ Luận văn Thạc sĩ (POST /api/committee/create)
// Yêu cầu chuẩn 5 Thầy/Cô có học vị Tiến sĩ trở lên
exports.createCommittee = async (req, res) => {
    let transaction;
    let transactionComplete = false;
    try {
        const {
            committeeName, defenseDate, defenseRoom, presidentId, reviewer1Id,
            reviewer2Id, secretaryId, memberId, thesisId, defenseOrder = 1,
            startTime = '08:00:00'
        } = req.body;

        if (!committeeName || !defenseDate || !defenseRoom || !presidentId || !reviewer1Id || !reviewer2Id || !secretaryId || !memberId) {
            return res.status(400).json({ success: false, message: 'Hội đồng bắt buộc phải có đầy đủ 5 thành viên (Chủ tịch, PB1, PB2, Thư ký, Ủy viên)!' });
        }
        if (new Set([presidentId, reviewer1Id, reviewer2Id, secretaryId, memberId].map(Number)).size !== 5) {
            return res.status(400).json({ success: false, message: '5 thành viên hội đồng phải là 5 giảng viên khác nhau.' });
        }
        if (thesisId && (!Number.isSafeInteger(Number(thesisId)) || Number(thesisId) < 1)) {
            return res.status(400).json({ success: false, message: 'Học viên/đề tài được chọn không hợp lệ.' });
        }
        if (!Number.isInteger(Number(defenseOrder)) || Number(defenseOrder) < 1 ||
            !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(startTime)) {
            return res.status(400).json({ success: false, message: 'Lượt bảo vệ hoặc giờ bảo vệ không hợp lệ.' });
        }

        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);
        await transaction.begin();
        const result = await transaction.request()
            .input('name', sql.NVarChar, committeeName)
            .input('date', sql.Date, defenseDate)
            .input('room', sql.NVarChar, defenseRoom)
            .input('pres', sql.Int, presidentId)
            .input('rev1', sql.Int, reviewer1Id)
            .input('rev2', sql.Int, reviewer2Id)
            .input('sec', sql.Int, secretaryId)
            .input('mem', sql.Int, memberId)
            .query(`
                INSERT INTO defense_committees (committee_name, defense_date, defense_room, president_id, reviewer_1_id, reviewer_2_id, secretary_id, member_id)
                OUTPUT INSERTED.committee_id
                VALUES (@name, @date, @room, @pres, @rev1, @rev2, @sec, @mem)
            `);

        const committeeId = result.recordset[0].committee_id;
        let defenseScheduleId = null;
        if (thesisId) {
            const candidateResult = await transaction.request()
                .input('thesisId', sql.BigInt, thesisId)
                .query(`
                    SELECT thesis_id
                    FROM thesis_progress
                    WHERE thesis_id = @thesisId
                      AND NOT EXISTS (
                        SELECT 1 FROM thesis_defense_schedules
                        WHERE thesis_defense_schedules.thesis_id = thesis_progress.thesis_id
                      )
                `);
            if (!candidateResult.recordset.length) {
                await transaction.rollback();
                transactionComplete = true;
                return res.status(409).json({
                    success: false,
                    message: 'Đề tài không tồn tại hoặc học viên đã được xếp lịch bảo vệ.'
                });
            }

            const scheduleResult = await transaction.request()
                .input('thesisId', sql.BigInt, thesisId)
                .input('committeeId', sql.Int, committeeId)
                .input('defenseOrder', sql.Int, defenseOrder)
                .input('startTime', sql.VarChar(8), startTime.length === 5 ? `${startTime}:00` : startTime)
                .query(`
                    INSERT INTO thesis_defense_schedules (thesis_id, committee_id, defense_order, start_time, result)
                    OUTPUT INSERTED.defense_schedule_id
                    VALUES (@thesisId, @committeeId, @defenseOrder, CAST(@startTime AS TIME), N'Chưa bảo vệ')
                `);
            defenseScheduleId = scheduleResult.recordset[0].defense_schedule_id;
            await transaction.request()
                .input('thesisId', sql.BigInt, thesisId)
                .query(`UPDATE thesis_progress SET current_stage = N'Bảo vệ chính thức' WHERE thesis_id = @thesisId`);
        }

        await transaction.commit();
        transactionComplete = true;
        await writeAuditLog(req.user?.user_id, 'CREATE_COMMITTEE', 'defense_committees', committeeId, null, {
            ...req.body,
            defenseScheduleId
        }, req.ip);

        return res.status(201).json({
            success: true,
            message: thesisId
                ? 'Thành lập hội đồng và xếp lịch học viên thành công!'
                : 'Thành lập Hội đồng bảo vệ luận văn Thạc sĩ thành công!',
            committeeId,
            defenseScheduleId
        });
    } catch (err) {
        if (transaction && !transactionComplete) {
            try { await transaction.rollback(); } catch (rollbackError) {
                console.error('Không thể hoàn tác thành lập hội đồng:', rollbackError);
            }
        }
        if (err.number === 2601 || err.number === 2627) {
            return res.status(409).json({
                success: false,
                message: 'Học viên đã được xếp lịch bảo vệ ở một hội đồng khác.'
            });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Xếp lịch bảo vệ cho học viên (POST /api/committee/schedule)
exports.scheduleDefense = async (req, res) => {
    try {
        const { thesisId, committeeId, defenseOrder = 1, startTime = '08:00:00' } = req.body;
        if (!thesisId || !committeeId) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin đề tài hoặc hội đồng!' });
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('thesisId', sql.BigInt, thesisId)
            .input('committeeId', sql.Int, committeeId)
            .input('order', sql.Int, defenseOrder)
            .input('time', sql.VarChar, startTime)
            .query(`
                INSERT INTO thesis_defense_schedules (thesis_id, committee_id, defense_order, start_time, result)
                OUTPUT INSERTED.defense_schedule_id
                VALUES (@thesisId, @committeeId, @order, CAST(@time AS TIME), N'Chưa bảo vệ')
            `);

        const defenseScheduleId = result.recordset[0].defense_schedule_id;

        // Cập nhật trạng thái đề tài sang 'Bảo vệ chính thức'
        await pool.request()
            .input('thesisId', sql.BigInt, thesisId)
            .query(`UPDATE thesis_progress SET current_stage = N'Bảo vệ chính thức' WHERE thesis_id = @thesisId`);

        res.status(201).json({
            success: true,
            message: 'Xếp lịch bảo vệ thành công!',
            defenseScheduleId
        });
    } catch (err) {
        if (err.number === 2601 || err.number === 2627) {
            return res.status(409).json({
                success: false,
                message: 'Học viên đã được xếp lịch bảo vệ ở một hội đồng khác.'
            });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Lấy danh sách lịch bảo vệ (GET /api/committee/schedules)
exports.getDefenseSchedules = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                ds.defense_schedule_id,
                ds.defense_order,
                ds.start_time,
                ds.average_score,
                ds.result,
                tp.thesis_title,
                s.student_code,
                p.full_name AS student_name,
                c.committee_name,
                c.defense_date,
                c.defense_room,
                pres.full_name AS president_name,
                sec.full_name AS secretary_name
            FROM thesis_defense_schedules ds
            JOIN thesis_progress tp ON ds.thesis_id = tp.thesis_id
            JOIN students s ON tp.student_id = s.student_id
            JOIN admission_profiles p ON s.profile_id = p.profile_id
            JOIN defense_committees c ON ds.committee_id = c.committee_id
            JOIN lecturers pres ON c.president_id = pres.lecturer_id
            JOIN lecturers sec ON c.secretary_id = sec.lecturer_id
            ORDER BY c.defense_date DESC, ds.defense_order ASC
        `);

        res.json({ success: true, schedules: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 5. Thầy Cô trong Hội đồng chấm điểm độc lập (POST /api/committee/evaluate)
// Thang điểm AGU: Nội dung <= 5.0, Trình bày <= 2.5, Trả lời câu hỏi <= 2.5
exports.evaluateDefense = async (req, res) => {
    try {
        const { defenseScheduleId, lecturerId, roleInCommittee, contentScore, presentationScore, qaScore, feedback } = req.body;
        const scheduleId = Number(defenseScheduleId);
        const actualLecId = req.user.role_code === 'LECTURER' ? Number(req.user.lecturer_id) : Number(lecturerId);
        const cScore = Number(contentScore);
        const pScore = Number(presentationScore);
        const qScore = Number(qaScore);

        if (!Number.isSafeInteger(scheduleId) || scheduleId < 1 ||
            !Number.isSafeInteger(actualLecId) || actualLecId < 1) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mã lịch bảo vệ hoặc mã giảng viên hợp lệ. Hãy tải lại danh sách hội đồng.'
            });
        }
        if (!Number.isFinite(cScore) || cScore < 0 || cScore > 5.0 ||
            !Number.isFinite(pScore) || pScore < 0 || pScore > 2.5 ||
            !Number.isFinite(qScore) || qScore < 0 || qScore > 2.5) {
            return res.status(400).json({
                success: false,
                message: 'Điểm không hợp lệ! Chuẩn AGU: Nội dung [0-5.0], Trình bày [0-2.5], Trả lời câu hỏi [0-2.5].'
            });
        }

        const pool = await poolPromise;
        const committeeResult = await pool.request()
            .input('schedId', sql.BigInt, scheduleId)
            .query(`
                SELECT c.president_id, c.reviewer_1_id, c.reviewer_2_id, c.secretary_id, c.member_id
                FROM thesis_defense_schedules ds
                JOIN defense_committees c ON c.committee_id = ds.committee_id
                WHERE ds.defense_schedule_id = @schedId
            `);
        if (!committeeResult.recordset.length) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch bảo vệ.' });
        }
        const committee = committeeResult.recordset[0];
        const roleByColumn = [
            ['president_id', 'Chủ tịch'],
            ['reviewer_1_id', 'Phản biện 1'],
            ['reviewer_2_id', 'Phản biện 2'],
            ['secretary_id', 'Thư ký'],
            ['member_id', 'Ủy viên']
        ];
        const assignedRole = roleByColumn.find(([column]) => Number(committee[column]) === actualLecId)?.[1];
        if (!assignedRole) {
            return res.status(403).json({ success: false, message: 'Giảng viên không thuộc hội đồng của lịch bảo vệ này.' });
        }

        await pool.request()
            .input('schedId', sql.BigInt, scheduleId)
            .input('lecId', sql.Int, actualLecId)
            .input('role', sql.NVarChar, assignedRole)
            .input('cScore', sql.Decimal(4, 2), cScore)
            .input('pScore', sql.Decimal(4, 2), pScore)
            .input('qScore', sql.Decimal(4, 2), qScore)
            .input('feedback', sql.NVarChar, feedback || null)
            .query(`
                MERGE INTO defense_evaluations AS target
                USING (SELECT @schedId AS schedId, @lecId AS lecId) AS source
                ON (target.defense_schedule_id = source.schedId AND target.lecturer_id = source.lecId)
                WHEN MATCHED THEN
                    UPDATE SET content_score = @cScore, presentation_score = @pScore, qa_score = @qScore,
                               role_in_committee = @role, feedback = @feedback, created_at = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (defense_schedule_id, lecturer_id, role_in_committee, content_score, presentation_score, qa_score, feedback)
                    VALUES (@schedId, @lecId, @role, @cScore, @pScore, @qScore, @feedback);
            `);

        // Tự động kích hoạt Stored Procedure tính điểm trung bình nếu đủ người chấm
        const calcRequest = pool.request();
        calcRequest.input('p_defense_schedule_id', sql.BigInt, scheduleId);
        await calcRequest.execute('sp_calculate_defense_final_grade');

        // Lấy lại kết quả sau khi SP tính
        const updatedRes = await pool.request()
            .input('schedId', sql.BigInt, scheduleId)
            .query(`SELECT average_score, result FROM thesis_defense_schedules WHERE defense_schedule_id = @schedId`);

        res.json({
            success: true,
            message: 'Đã lưu phiếu chấm điểm của Giảng viên và cập nhật điểm Hội đồng!',
            finalSummary: updatedRes.recordset[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 6. Kích hoạt thủ công tính điểm Hội đồng (POST /api/committee/calculate-grade/:scheduleId)
exports.triggerCalculateGrade = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const pool = await poolPromise;

        const request = pool.request();
        request.input('p_defense_schedule_id', sql.BigInt, scheduleId);
        await request.execute('sp_calculate_defense_final_grade');

        const result = await pool.request()
            .input('schedId', sql.BigInt, scheduleId)
            .query(`SELECT average_score, result FROM thesis_defense_schedules WHERE defense_schedule_id = @schedId`);

        res.json({
            success: true,
            message: 'Đã tính lại điểm tổng kết Hội đồng!',
            data: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
