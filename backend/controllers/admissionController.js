const { sql, poolPromise, writeAuditLog, createNotification } = require('../config/db');
const bcrypt = require('bcryptjs');

function getStudentUsernameBase(fullName) {
    const nameParts = String(fullName || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/gi, 'd')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(Boolean);
    const namePart = nameParts.slice(-2).join('');
    if (!namePart) throw new Error('Không thể tạo tên đăng nhập từ họ tên học viên.');
    return `hv_${namePart}`.slice(0, 100);
}

async function getUniqueStudentUsername(transaction, fullName) {
    const base = getStudentUsernameBase(fullName);
    for (let suffix = 1; suffix < Number.MAX_SAFE_INTEGER; suffix += 1) {
        const suffixPart = suffix === 1 ? '' : `_${suffix}`;
        const username = `${base.slice(0, 100 - suffixPart.length)}${suffixPart}`;
        const existing = await transaction.request()
            .input('username', sql.VarChar(100), username)
            .query('SELECT TOP (1) user_id FROM users WITH (UPDLOCK, HOLDLOCK) WHERE username = @username');
        if (existing.recordset.length === 0) return username;
    }
    throw new Error('Không thể tạo tên đăng nhập duy nhất cho học viên.');
}

// 1. Lấy danh sách đợt tuyển sinh đang mở (GET /api/admission/campaigns)
exports.getCampaigns = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT campaign_id, campaign_name, academic_year, start_date, end_date
            FROM admission_campaigns
            WHERE CAST(GETDATE() AS DATE) BETWEEN start_date AND end_date
            ORDER BY academic_year DESC, campaign_id DESC
        `);
        res.json({ success: true, campaigns: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Tạo đợt tuyển sinh mới (POST /api/admission/campaigns)
exports.createCampaign = async (req, res) => {
    const { campaignName, academicYear, startDate, endDate } = req.body;
    const name = typeof campaignName === 'string' ? campaignName.trim() : '';
    const year = Number(academicYear);

    const isValidDate = value => {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const parsed = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    };

    if (!name || name.length > 150) {
        return res.status(400).json({
            success: false,
            message: 'Tên đợt tuyển sinh không được để trống và tối đa 150 ký tự.'
        });
    }
    if (!Number.isSafeInteger(year) || year < 2000 || year > 9999) {
        return res.status(400).json({ success: false, message: 'Năm học không hợp lệ.' });
    }
    if (!isValidDate(startDate) || !isValidDate(endDate) || endDate < startDate) {
        return res.status(400).json({
            success: false,
            message: 'Ngày bắt đầu và kết thúc không hợp lệ; ngày kết thúc phải sau hoặc bằng ngày bắt đầu.'
        });
    }

    try {
        const pool = await poolPromise;
        const duplicate = await pool.request()
            .input('campaignName', sql.NVarChar(150), name)
            .input('academicYear', sql.Int, year)
            .query(`
                SELECT campaign_id
                FROM admission_campaigns
                WHERE campaign_name = @campaignName AND academic_year = @academicYear
            `);
        if (duplicate.recordset.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Đợt tuyển sinh này đã tồn tại trong năm học đã chọn.'
            });
        }

        const result = await pool.request()
            .input('campaignName', sql.NVarChar(150), name)
            .input('academicYear', sql.Int, year)
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(`
                INSERT INTO admission_campaigns (campaign_name, academic_year, start_date, end_date)
                OUTPUT INSERTED.campaign_id, INSERTED.campaign_name, INSERTED.academic_year,
                       INSERTED.start_date, INSERTED.end_date
                VALUES (@campaignName, @academicYear, @startDate, @endDate)
            `);

        const campaign = result.recordset[0];
        await writeAuditLog(
            req.user?.user_id,
            'CREATE_ADMISSION_CAMPAIGN',
            'admission_campaigns',
            campaign.campaign_id,
            null,
            campaign,
            req.ip
        );

        await createNotification({
            title: 'Đợt tuyển sinh mới',
            content: `Đợt tuyển sinh "${campaign.campaign_name}" năm ${campaign.academic_year} đã được mở từ ${campaign.start_date} đến ${campaign.end_date}.`,
            targetRoleId: 1
        });

        return res.status(201).json({
            success: true,
            message: 'Đã tạo đợt tuyển sinh thành công.',
            campaign
        });
    } catch (err) {
        console.error('Lỗi tạo đợt tuyển sinh:', err);
        return res.status(500).json({ success: false, message: 'Không thể tạo đợt tuyển sinh.' });
    }
};

// 2. Nộp hồ sơ dự tuyển trực tuyến (POST /api/admission/register)
// Phục vụ màn hình RegisterPage.tsx
exports.registerProfile = async (req, res) => {
    try {
        const { fullName, email, phone, idCardNumber, campaignId, majorId, dob, address } = req.body;
        const degreeFileUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const requiredTextFields = [fullName, email, phone, idCardNumber, dob, address];
        if (requiredTextFields.some(value => typeof value !== 'string' || !value.trim()) || !campaignId || !majorId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin cá nhân, đợt tuyển sinh và ngành dự tuyển!'
            });
        }
        const parsedDob = new Date(`${dob}T00:00:00Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(parsedDob.getTime()) || parsedDob.toISOString().slice(0, 10) !== dob) {
            return res.status(400).json({ success: false, message: 'Ngày sinh không hợp lệ.' });
        }
        if (!degreeFileUrl) {
            return res.status(400).json({ success: false, message: 'Vui lòng tải lên file hồ sơ minh chứng.' });
        }

        const campaignIdNumber = Number(campaignId);
        const majorIdNumber = Number(majorId);
        if (!Number.isSafeInteger(campaignIdNumber) || !Number.isSafeInteger(majorIdNumber)) {
            return res.status(400).json({ success: false, message: 'Đợt tuyển sinh hoặc ngành dự tuyển không hợp lệ.' });
        }

        const pool = await poolPromise;
        const openCampaign = await pool.request()
            .input('campaignId', sql.Int, campaignIdNumber)
            .query(`
                SELECT campaign_id
                FROM admission_campaigns
                WHERE campaign_id = @campaignId
                  AND CAST(GETDATE() AS DATE) BETWEEN start_date AND end_date
            `);
        if (openCampaign.recordset.length === 0) {
            return res.status(400).json({ success: false, message: 'Đợt tuyển sinh đã đóng hoặc không tồn tại.' });
        }

        const selectedMajor = await pool.request()
            .input('majorId', sql.Int, majorIdNumber)
            .query('SELECT major_id FROM majors WHERE major_id = @majorId');
        if (selectedMajor.recordset.length === 0) {
            return res.status(400).json({ success: false, message: 'Ngành dự tuyển không tồn tại.' });
        }

        // Kiểm tra xem số CCCD đã từng nộp trong đợt này chưa
        const checkExist = await pool.request()
            .input('idCard', sql.VarChar, idCardNumber.trim())
            .query(`SELECT profile_id FROM admission_profiles WHERE id_card_number = @idCard`);

        if (checkExist.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Số CCCD ${idCardNumber} đã tồn tại trong danh sách hồ sơ tuyển sinh!`
            });
        }

        const result = await pool.request()
            .input('campaignId', sql.Int, campaignIdNumber)
            .input('majorId', sql.Int, majorIdNumber)
            .input('fullName', sql.NVarChar, fullName.trim())
            .input('dob', sql.Date, dob)
            .input('idCard', sql.VarChar, idCardNumber.trim())
            .input('phone', sql.VarChar, phone.trim())
            .input('email', sql.VarChar, email.trim().toLowerCase())
            .input('address', sql.NVarChar, address.trim())
            .input('degreeFile', sql.NVarChar, degreeFileUrl)
            .query(`
                INSERT INTO admission_profiles (campaign_id, major_id, full_name, dob, id_card_number, phone, email, address, undergrad_degree_file, status, admission_status)
                OUTPUT INSERTED.profile_id
                VALUES (@campaignId, @majorId, @fullName, @dob, @idCard, @phone, @email, @address, @degreeFile, N'Chờ xét duyệt', N'Chưa trúng tuyển')
            `);

        const profileId = result.recordset[0].profile_id;
        const profileCode = `THS-${new Date().getFullYear()}-${String(profileId).padStart(4, '0')}`;

        await createNotification({
            title: 'Hồ sơ dự tuyển mới',
            content: `Thí sinh ${fullName.trim()} vừa nộp hồ sơ dự tuyển cho đợt ${campaignIdNumber}. Vui lòng kiểm tra và xét duyệt hồ sơ.`,
            targetRoleId: 1
        });

        res.status(201).json({
            success: true,
            message: 'Nộp hồ sơ dự tuyển Thạc sĩ thành công!',
            data: {
                profileId,
                profileCode,
                fullName,
                idCardNumber,
                degreeFileUrl
            }
        });
    } catch (err) {
        console.error('Lỗi nộp hồ sơ:', err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ: ' + err.message });
    }
};

// 3. Tra cứu kết quả hồ sơ tuyển sinh (GET /api/admission/lookup)
// Phục vụ màn hình ResultLookupPage.tsx
exports.lookupAdmission = async (req, res) => {
    try {
        const { key } = req.query; // Nhận số CCCD hoặc mã hồ sơ (ID)
        if (!key) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập số CCCD hoặc Mã hồ sơ cần tra cứu!' });
        }

        const cleanKey = key.trim().replace(/^THS-\d{4}-/i, ''); // Loại bỏ prefix nếu người dùng nhập THS-2026-0892

        const pool = await poolPromise;
        const result = await pool.request()
            .input('searchKey', sql.VarChar, cleanKey)
            .query(`
                SELECT TOP 1 
                    p.profile_id,
                    p.full_name,
                    p.id_card_number,
                    p.phone,
                    p.email,
                    p.status AS review_status,
                    p.admission_status,
                    p.undergrad_degree_file,
                    p.created_at,
                    c.campaign_name,
                    c.academic_year,
                    s.student_code
                FROM admission_profiles p
                JOIN admission_campaigns c ON p.campaign_id = c.campaign_id
                LEFT JOIN students s ON s.profile_id = p.profile_id
                WHERE p.id_card_number = @searchKey 
                   OR CAST(p.profile_id AS VARCHAR) = @searchKey
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hồ sơ dự tuyển nào với thông tin đã nhập!'
            });
        }

        const row = result.recordset[0];
        const profileCode = `THS-${row.academic_year || new Date().getFullYear()}-${String(row.profile_id).padStart(4, '0')}`;

        return res.json({
            success: true,
            data: {
                id: profileCode,
                profileId: row.profile_id,
                name: row.full_name,
                idCard: row.id_card_number,
                phone: row.phone,
                email: row.email,
                campaign: row.campaign_name,
                reviewStatus: row.review_status,
                admissionStatus: row.admission_status,
                studentCode: row.student_code || null,
                note: row.admission_status === 'Trúng tuyển' || row.admission_status === 'Đã nhập học'
                    ? 'Chúc mừng! Thí sinh đã trúng tuyển chương trình Sau Đại học tại ĐH An Giang.'
                    : `Hồ sơ hiện đang ở trạng thái: ${row.review_status}. Vui lòng theo dõi email liên tục.`
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Lấy toàn bộ danh sách hồ sơ dự tuyển - Dành cho Ban Tuyển sinh/Admin (GET /api/admission/profiles)
exports.getAllProfiles = async (req, res) => {
    try {
        const { status, admissionStatus, campaignId } = req.query;
        const pool = await poolPromise;

        let queryStr = `
            SELECT p.profile_id, p.full_name, p.dob, p.id_card_number, p.phone, p.email,
                   p.undergrad_degree_file, p.status, p.admission_status, p.created_at,
                   c.campaign_name, s.student_code
            FROM admission_profiles p
            JOIN admission_campaigns c ON p.campaign_id = c.campaign_id
            LEFT JOIN students s ON s.profile_id = p.profile_id
            WHERE 1=1
        `;

        const request = pool.request();
        if (status) {
            queryStr += ` AND p.status = @status`;
            request.input('status', sql.NVarChar, status);
        }
        if (admissionStatus) {
            queryStr += ` AND p.admission_status = @admissionStatus`;
            request.input('admissionStatus', sql.NVarChar, admissionStatus);
        }
        if (campaignId) {
            queryStr += ` AND p.campaign_id = @campaignId`;
            request.input('campaignId', sql.Int, campaignId);
        }

        queryStr += ` ORDER BY p.profile_id DESC`;

        const result = await request.query(queryStr);
        res.json({ success: true, count: result.recordset.length, profiles: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 5. Duyệt hồ sơ (PUT /api/admission/profiles/:id/review)
exports.reviewProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Đạt yêu cầu', 'Không đạt', 'Cần bổ sung'

        if (!['Đạt yêu cầu', 'Không đạt', 'Cần bổ sung'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái duyệt không hợp lệ!' });
        }

        const pool = await poolPromise;
        await pool.request()
            .input('profileId', sql.BigInt, id)
            .input('status', sql.NVarChar, status)
            .query(`UPDATE admission_profiles SET status = @status WHERE profile_id = @profileId`);

        await writeAuditLog(req.user?.user_id, 'REVIEW_ADMISSION_PROFILE', 'admission_profiles', id, null, { status }, req.ip);

        const notificationTitle = status === 'Đạt yêu cầu' ? 'Hồ sơ đạt yêu cầu' : status === 'Cần bổ sung' ? 'Cần bổ sung hồ sơ' : 'Hồ sơ không đạt';
        await createNotification({
            title: notificationTitle,
            content: `Hồ sơ tuyển sinh #${id} đã được cập nhật trạng thái: ${status}.`,
            targetRoleId: 1
        });

        res.json({ success: true, message: `Đã cập nhật trạng thái hồ sơ thành: ${status}` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 6. Quyết định công nhận trúng tuyển & Cấp MSHV tự động (POST /api/admission/profiles/:id/admit)
exports.admitCandidate = async (req, res) => {
    let transaction;
    try {
        const { id } = req.params;
        const { curriculumId = 1 } = req.body;

        const pool = await poolPromise;
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // 1. Kiểm tra hồ sơ
        const profileRes = await transaction.request()
            .input('profileId', sql.BigInt, id)
            .query(`
                SELECT p.*, c.academic_year
                FROM admission_profiles p
                JOIN admission_campaigns c ON c.campaign_id = p.campaign_id
                WHERE p.profile_id = @profileId
            `);

        if (profileRes.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ thí sinh!' });
        }

        const candidate = profileRes.recordset[0];
        if (candidate.status !== 'Đạt yêu cầu') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể công nhận trúng tuyển hồ sơ đã đạt yêu cầu.'
            });
        }

        // 2. Kiểm tra nếu đã nhập học rồi
        const existStudent = await transaction.request()
            .input('profileId', sql.BigInt, id)
            .query(`SELECT student_code FROM students WHERE profile_id = @profileId`);

        if (existStudent.recordset.length > 0) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Thí sinh này đã được cấp MSHV: ${existStudent.recordset[0].student_code}!`
            });
        }

        const profileNumber = Number(candidate.profile_id);
        if (!Number.isSafeInteger(profileNumber) || profileNumber < 1 || profileNumber > 999999) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Không thể tạo mã học viên 9 ký tự vì mã hồ sơ vượt quá giới hạn.'
            });
        }

        const yearPrefix = String(candidate.academic_year || new Date().getFullYear()).slice(-2) + 'M';
        const studentCode = `${yearPrefix}${String(profileNumber).padStart(6, '0')}`;

        // 3. Tạo tài khoản User (Role STUDENT = 3)
        const username = await getUniqueStudentUsername(transaction, candidate.full_name);
        const defaultPassword = 'AGU@' + candidate.id_card_number.slice(-4);
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        const userInsert = await transaction.request()
            .input('username', sql.VarChar, username)
            .input('passwordHash', sql.VarChar, passwordHash)
            .input('email', sql.VarChar, candidate.email)
            .input('roleId', sql.Int, 3)
            .query(`
                INSERT INTO users (username, password_hash, email, role_id, status)
                OUTPUT INSERTED.user_id
                VALUES (@username, @passwordHash, @email, @roleId, 'Active')
            `);

        const newUserId = userInsert.recordset[0].user_id;

        // 4. Thêm vào bảng students
        const studentInsert = await transaction.request()
            .input('userId', sql.BigInt, newUserId)
            .input('studentCode', sql.VarChar, studentCode)
            .input('profileId', sql.BigInt, candidate.profile_id)
            .input('curriculumId', sql.Int, curriculumId)
            .query(`
                INSERT INTO students (user_id, student_code, profile_id, curriculum_id, academic_status, enrollment_date)
                OUTPUT INSERTED.student_id
                VALUES (@userId, @studentCode, @profileId, @curriculumId, N'Đang học', CAST(GETDATE() AS DATE))
            `);

        const newStudentId = studentInsert.recordset[0].student_id;

        // 6. Cập nhật trạng thái tuyển sinh
        await transaction.request()
            .input('profileId', sql.BigInt, candidate.profile_id)
            .query(`UPDATE admission_profiles SET admission_status = N'Đã nhập học', status = N'Đạt yêu cầu' WHERE profile_id = @profileId`);

        // Không tạo hóa đơn học phí mặc định khi mới được công nhận trúng tuyển.
        // Chỉ tạo học phí khi học viên thực sự đăng ký học phần trong một kỳ học.

        await transaction.commit();

        // 8. Ghi Audit Log
        await writeAuditLog(req.user?.user_id, 'ADMIT_STUDENT', 'students', newStudentId, null, { studentCode, username }, req.ip);

        await createNotification({
            title: 'Công nhận trúng tuyển',
            content: `Học viên ${candidate.full_name} đã được công nhận trúng tuyển với mã học viên ${studentCode}.`,
            targetRoleId: 1
        });

        return res.status(201).json({
            success: true,
            message: 'Công nhận trúng tuyển & Cấp MSHV thành công!',
            data: {
                studentId: newStudentId,
                studentCode,
                username,
                temporaryPassword: defaultPassword,
                fullName: candidate.full_name
            }
        });
    } catch (err) {
        if (transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error('Lỗi hoàn tác giao dịch nhập học:', rollbackError);
            }
        }
        console.error('Lỗi khi nhập học thí sinh:', err);
        return res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
};
