const { sql, poolPromise } = require('../config/db');

// 1. Lấy danh sách ngành đào tạo Thạc sĩ (GET /api/academic/majors)
exports.getMajors = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT major_id, major_code, major_name
            FROM majors
            ORDER BY major_id ASC
        `);
        res.json({ success: true, majors: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Lấy khung chương trình đào tạo (GET /api/academic/curriculums)
exports.getCurriculums = async (req, res) => {
    try {
        const { majorId } = req.query;
        const pool = await poolPromise;
        let queryStr = `
            SELECT c.curriculum_id, c.cohort, c.orientation, c.total_credits, c.version,
                   m.major_code, m.major_name
            FROM curriculums c
            JOIN majors m ON c.major_id = m.major_id
            WHERE 1=1
        `;
        const request = pool.request();
        if (majorId) {
            queryStr += ` AND c.major_id = @majorId`;
            request.input('majorId', sql.Int, majorId);
        }

        const result = await request.query(queryStr);
        res.json({ success: true, curriculums: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Lấy danh sách học phần trong một CTĐT (GET /api/academic/curriculums/:id/courses)
exports.getCurriculumCourses = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('curriculumId', sql.Int, id)
            .query(`
                SELECT cc.curriculum_course_id, cc.course_type, cc.recommended_semester,
                       c.course_id, c.course_code, c.course_name, c.credits,
                       prereq.course_code AS prerequisite_code, prereq.course_name AS prerequisite_name
                FROM curriculum_courses cc
                JOIN courses c ON cc.course_id = c.course_id
                LEFT JOIN courses prereq ON c.prerequisite_course_id = prereq.course_id
                WHERE cc.curriculum_id = @curriculumId
                ORDER BY cc.recommended_semester ASC, c.course_code ASC
            `);
        res.json({ success: true, courses: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Lấy danh sách Giảng viên Hướng dẫn & Slot còn trống (GET /api/academic/lecturers)
// Phục vụ màn hình Giảng viên & chọn GVHD
exports.getLecturers = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                l.lecturer_id,
                l.lecturer_code,
                l.full_name,
                l.degree,
                l.max_slots,
                l.email,
                l.phone,
                ISNULL(active_adv.active_count, 0) AS current_assigned,
                (l.max_slots - ISNULL(active_adv.active_count, 0)) AS slots_left
            FROM lecturers l
            LEFT JOIN (
                SELECT lecturer_id, COUNT(*) AS active_count
                FROM advisor_assignments
                WHERE status = N'Đang hướng dẫn'
                GROUP BY lecturer_id
            ) active_adv ON l.lecturer_id = active_adv.lecturer_id
            ORDER BY l.degree DESC, l.full_name ASC
        `);
        res.json({ success: true, lecturers: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 5. Lấy danh sách học kỳ (GET /api/academic/semesters)
exports.getSemesters = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT semester_id, semester_name, start_date, end_date, is_grade_locked
            FROM semesters
            ORDER BY semester_id DESC
        `);
        res.json({ success: true, semesters: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createSemester = async (req, res) => {
    const { semesterName, startDate, endDate } = req.body || {};
    if (!semesterName?.trim() || !startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập tên và thời gian học kỳ.' });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('semesterName', sql.NVarChar(50), semesterName.trim())
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query('INSERT INTO semesters (semester_name, start_date, end_date) VALUES (@semesterName,@startDate,@endDate)');
        return res.status(201).json({ success: true, message: 'Tạo học kỳ thành công.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 6. Lấy danh sách lớp học phần mở đăng ký (GET /api/academic/classes)
exports.getClasses = async (req, res) => {
    try {
        const { semesterId } = req.query;
        const pool = await poolPromise;
        let queryStr = `
            SELECT 
                cc.class_id,
                cc.class_name,
                cc.max_students,
                cc.status,
                cc.semester_id,
                c.course_id,
                c.course_code,
                c.course_name,
                c.credits,
                sem.semester_name,
                (SELECT COUNT(*) FROM course_registrations cr WHERE cr.class_id = cc.class_id) AS registered_count,
                sch.schedule_id, sch.lecturer_id, sch.room_name, sch.day_of_week,
                sch.start_shift, sch.end_shift, l.full_name AS lecturer_name
            FROM course_classes cc
            JOIN courses c ON cc.course_id = c.course_id
            JOIN semesters sem ON cc.semester_id = sem.semester_id
            LEFT JOIN schedules sch ON sch.class_id = cc.class_id
            LEFT JOIN lecturers l ON l.lecturer_id = sch.lecturer_id
            WHERE 1=1
        `;

        const request = pool.request();
        if (semesterId) {
            queryStr += ` AND cc.semester_id = @semesterId`;
            request.input('semesterId', sql.Int, semesterId);
        }

        const result = await request.query(queryStr);
        res.json({ success: true, classes: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getCourses = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT c.course_id, c.course_code, c.course_name, c.credits,
                   c.prerequisite_course_id,
                   p.course_code AS prerequisite_code, p.course_name AS prerequisite_name
            FROM courses c
            LEFT JOIN courses p ON c.prerequisite_course_id = p.course_id
            ORDER BY c.course_code
        `);
        return res.json({ success: true, courses: result.recordset });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.createCourse = async (req, res) => {
    const { courseCode, courseName, credits, prerequisiteCourseId = null } = req.body || {};
    const creditCount = Number(credits);
    if (!courseCode?.trim() || !courseName?.trim() || !Number.isInteger(creditCount) || creditCount < 1) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mã, tên và số tín chỉ hợp lệ.' });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('courseCode', sql.VarChar(20), courseCode.trim())
            .input('courseName', sql.NVarChar(150), courseName.trim())
            .input('credits', sql.Int, creditCount)
            .input('prerequisiteCourseId', sql.Int, prerequisiteCourseId || null)
            .query(`
                INSERT INTO courses (course_code, course_name, credits, prerequisite_course_id)
                OUTPUT INSERTED.course_id
                VALUES (@courseCode, @courseName, @credits, @prerequisiteCourseId)
            `);
        return res.status(201).json({ success: true, message: 'Tạo học phần thành công.', courseId: result.recordset[0].course_id });
    } catch (err) {
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ success: false, message: 'Mã học phần đã tồn tại.' });
        }
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateCourse = async (req, res) => {
    const courseId = Number(req.params.id);
    const { courseCode, courseName, credits, prerequisiteCourseId = null } = req.body || {};
    const creditCount = Number(credits);
    if (!Number.isSafeInteger(courseId) || courseId <= 0 || !courseCode?.trim() || !courseName?.trim() ||
        !Number.isInteger(creditCount) || creditCount < 1) {
        return res.status(400).json({ success: false, message: 'Dữ liệu học phần không hợp lệ.' });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('courseId', sql.Int, courseId)
            .input('courseCode', sql.VarChar(20), courseCode.trim())
            .input('courseName', sql.NVarChar(150), courseName.trim())
            .input('credits', sql.Int, creditCount)
            .input('prerequisiteCourseId', sql.Int, prerequisiteCourseId || null)
            .query(`
                UPDATE courses
                SET course_code=@courseCode, course_name=@courseName, credits=@credits,
                    prerequisite_course_id=@prerequisiteCourseId
                WHERE course_id=@courseId
            `);
        return res.json({ success: true, message: 'Cập nhật học phần thành công.' });
    } catch (err) {
        if (err.number === 2627 || err.number === 2601) {
            return res.status(409).json({ success: false, message: 'Mã học phần đã tồn tại.' });
        }
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteCourse = async (req, res) => {
    const courseId = Number(req.params.id);
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
        return res.status(400).json({ success: false, message: 'Mã học phần không hợp lệ.' });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('courseId', sql.Int, courseId)
            .query('DELETE FROM courses WHERE course_id=@courseId');
        return res.json({ success: true, message: 'Đã xóa học phần.' });
    } catch (err) {
        if (err.number === 547) {
            return res.status(409).json({ success: false, message: 'Không thể xóa học phần đang được sử dụng.' });
        }
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.createClass = async (req, res) => {
    const { courseId, semesterId, className, maxStudents = 35, status = 'Mở đăng ký' } = req.body || {};
    if (!Number.isInteger(Number(courseId)) || !Number.isInteger(Number(semesterId)) || !className?.trim()) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ thông tin lớp học phần.' });
    }
    if (!['Mở đăng ký', 'Đã chốt', 'Đã hủy'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Trạng thái lớp không hợp lệ.' });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('courseId', sql.Int, Number(courseId))
            .input('semesterId', sql.Int, Number(semesterId))
            .input('className', sql.NVarChar(100), className.trim())
            .input('maxStudents', sql.Int, Number(maxStudents))
            .input('status', sql.NVarChar(20), status)
            .query(`
                INSERT INTO course_classes (course_id, semester_id, class_name, max_students, status)
                OUTPUT INSERTED.class_id
                VALUES (@courseId, @semesterId, @className, @maxStudents, @status)
            `);
        return res.status(201).json({ success: true, message: 'Tạo lớp học phần thành công.', classId: result.recordset[0].class_id });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateClass = async (req, res) => {
    const classId = Number(req.params.id);
    const { courseId, semesterId, className, maxStudents, status } = req.body || {};
    if (!Number.isSafeInteger(classId) || classId <= 0 || !className?.trim()) {
        return res.status(400).json({ success: false, message: 'Dữ liệu lớp học phần không hợp lệ.' });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('classId', sql.Int, classId)
            .input('courseId', sql.Int, Number(courseId))
            .input('semesterId', sql.Int, Number(semesterId))
            .input('className', sql.NVarChar(100), className.trim())
            .input('maxStudents', sql.Int, Number(maxStudents))
            .input('status', sql.NVarChar(20), status)
            .query(`
                UPDATE course_classes
                SET course_id=@courseId, semester_id=@semesterId, class_name=@className,
                    max_students=@maxStudents, status=@status
                WHERE class_id=@classId
            `);
        return res.json({ success: true, message: 'Cập nhật lớp học phần thành công.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteClass = async (req, res) => {
    const classId = Number(req.params.id);
    if (!Number.isSafeInteger(classId) || classId <= 0) {
        return res.status(400).json({ success: false, message: 'Mã lớp không hợp lệ.' });
    }
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('classId', sql.Int, classId)
            .query('DELETE FROM course_classes WHERE class_id=@classId');
        return res.json({ success: true, message: 'Đã xóa lớp học phần.' });
    } catch (err) {
        if (err.number === 547) return res.status(409).json({ success: false, message: 'Không thể xóa lớp đang có đăng ký.' });
        return res.status(500).json({ success: false, message: err.message });
    }
};

exports.upsertClassSchedule = async (req, res) => {
    const classId = Number(req.params.id);
    const { lecturerId, roomName, dayOfWeek, startShift, endShift } = req.body || {};
    if (!Number.isSafeInteger(classId) || classId <= 0 ||
        !Number.isInteger(Number(lecturerId)) || !roomName?.trim() ||
        !Number.isInteger(Number(dayOfWeek)) || Number(dayOfWeek) < 2 || Number(dayOfWeek) > 8 ||
        !Number.isInteger(Number(startShift)) || !Number.isInteger(Number(endShift)) ||
        Number(startShift) > Number(endShift)) {
        return res.status(400).json({ success: false, message: 'Thông tin lịch học không hợp lệ.' });
    }
    try {
        const pool = await poolPromise;
        const existing = await pool.request()
            .input('classId', sql.Int, classId)
            .query('SELECT schedule_id FROM schedules WHERE class_id=@classId');
        if (existing.recordset.length > 0) {
            await pool.request()
                .input('classId', sql.Int, classId)
                .input('lecturerId', sql.Int, Number(lecturerId))
                .input('roomName', sql.NVarChar(50), roomName.trim())
                .input('dayOfWeek', sql.Int, Number(dayOfWeek))
                .input('startShift', sql.Int, Number(startShift))
                .input('endShift', sql.Int, Number(endShift))
                .query(`
                    UPDATE schedules
                    SET lecturer_id=@lecturerId, room_name=@roomName, day_of_week=@dayOfWeek,
                        start_shift=@startShift, end_shift=@endShift
                    WHERE class_id=@classId
                `);
        } else {
            await pool.request()
                .input('classId', sql.Int, classId)
                .input('lecturerId', sql.Int, Number(lecturerId))
                .input('roomName', sql.NVarChar(50), roomName.trim())
                .input('dayOfWeek', sql.Int, Number(dayOfWeek))
                .input('startShift', sql.Int, Number(startShift))
                .input('endShift', sql.Int, Number(endShift))
                .query(`
                    INSERT INTO schedules (class_id, lecturer_id, room_name, day_of_week, start_shift, end_shift)
                    VALUES (@classId, @lecturerId, @roomName, @dayOfWeek, @startShift, @endShift)
                `);
        }
        return res.json({ success: true, message: 'Đã lưu lịch học và phân công giảng viên.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

