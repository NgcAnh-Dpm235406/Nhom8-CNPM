const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const sql = require('mssql/msnodesqlv8'); 
const cron = require('node-cron');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// 1. CẤU HÌNH KẾT NỐI WINDOWS AUTHENTICATION (CHUẨN THEO ẢNH CỦA BẠN)
// -------------------------------------------------------------
// Chuỗi kết nối chỉ định rõ Driver ODBC 18 / 17 hoặc SQL Server mặc định của Windows
const dbConfig = {
    connectionString: 'Driver={ODBC Driver 18 for SQL Server};Server=localhost;Database=agu_postgrad_db;Trusted_Connection=yes;TrustServerCertificate=yes;'
};

sql.connect(dbConfig).then(() => {
    console.log('✅ Node.js đã kết nối thành công tới SQL Server (agu_postgrad_db)!');
}).catch(err => {
    // Nếu máy bạn dùng Driver cũ hơn (Driver 17 hoặc SQL Server gốc), tự động thử lại:
    console.log('⚠️ Đang thử kết nối bằng Driver SQL Server mặc định...');
    const fallbackConfig = {
        connectionString: 'Driver={SQL Server};Server=localhost;Database=agu_postgrad_db;Trusted_Connection=yes;'
    };
    sql.connect(fallbackConfig).then(() => {
        console.log('✅ Kết nối thành công bằng Driver {SQL Server} mặc định!');
    }).catch(e => console.error('❌ Lỗi kết nối DB:', e.message));
});

// -------------------------------------------------------------
// 2. HÀM AUDIT LOG (Ghi lại thao tác nhạy cảm)
// -------------------------------------------------------------
async function writeAuditLog(userId, action, tableName, recordId, oldData, newData, ip) {
    try {
        const request = new sql.Request();
        await request
            .input('userId', sql.BigInt, userId)
            .input('action', sql.NVarChar, action)
            .input('tableName', sql.VarChar, tableName)
            .input('recordId', sql.BigInt, recordId)
            .input('oldData', sql.NVarChar, JSON.stringify(oldData))
            .input('newData', sql.NVarChar, JSON.stringify(newData))
            .input('ip', sql.VarChar, ip)
            .query(`INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data, ip_address)
                    VALUES (@userId, @action, @tableName, @recordId, @oldData, @newData, @ip)`);
    } catch (e) {
        console.error('Lỗi ghi Audit Log:', e);
    }
}

// -------------------------------------------------------------
// 3. UPLOAD FILE KIỂM TRA DUNG LƯỢNG <= 25MB (Multer)
// -------------------------------------------------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // Tối đa 25MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.pdf' || ext === '.docx' || ext === '.doc') {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file PDF hoặc Word (DOCX)!'));
        }
    }
});

// API nhận file upload
app.post('/api/upload-report', upload.single('report_file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Chưa chọn file hoặc file vượt quá 25MB!' });
    }
    res.json({
        message: 'Upload file thành công (<= 25MB)!',
        file_url: `/uploads/${req.file.filename}`,
        size_mb: (req.file.size / (1024 * 1024)).toFixed(2)
    });
});

// -------------------------------------------------------------
// 4. REALTIME SOCKET.IO: ĐẾM VÀ BẮN SLOT GVHD
// -------------------------------------------------------------
io.on('connection', (socket) => {
    console.log('⚡ Client kết nối Socket:', socket.id);

    // Khi có ai đó đăng ký hoặc duyệt đề tài -> Bắn sự kiện cập nhật Slot
    socket.on('update_slot_trigger', async (lecturerId) => {
        try {
            const request = new sql.Request();
            const result = await request
                .input('lecId', sql.Int, lecturerId)
                .query(`SELECT COUNT(*) AS current_slots 
                        FROM advisor_assignments 
                        WHERE lecturer_id = @lecId AND status = N'Đang hướng dẫn'`);
            
            const currentSlots = result.recordset[0].current_slots;
            
            // Gửi dữ liệu realtime cho tất cả client
            io.emit('slot_updated', { lecturerId, currentSlots });
        } catch (err) {
            console.error(err);
        }
    });
});

// -------------------------------------------------------------
// 5. CRON JOB: TỰ ĐỘNG QUÉT CẢNH BÁO QUÁ HẠN (XANH / VÀNG / ĐỎ)
// Chạy tự động mỗi ngày lúc 00:00
// -------------------------------------------------------------
cron.schedule('0 0 * * *', async () => {
    console.log('🕒 Đang chạy Cron job quét cảnh báo hạn chót luận văn...');
    try {
        const request = new sql.Request();
        
        // 1. Quá hạn chót mà chưa nộp -> Đổi sang ĐỎ ('red')
        await request.query(`
            UPDATE thesis_submissions 
            SET color_warning = 'red' 
            WHERE submitted_at IS NULL AND deadline < CAST(GETDATE() AS DATE)
        `);

        // 2. Còn <= 7 ngày mà chưa nộp -> Đổi sang VÀNG ('yellow')
        await request.query(`
            UPDATE thesis_submissions 
            SET color_warning = 'yellow' 
            WHERE submitted_at IS NULL 
              AND deadline >= CAST(GETDATE() AS DATE) 
              AND DATEDIFF(day, GETDATE(), deadline) <= 7
        `);

        // 3. Còn > 7 ngày hoặc đã nộp -> Màu XANH ('green')
        await request.query(`
            UPDATE thesis_submissions 
            SET color_warning = 'green' 
            WHERE submitted_at IS NOT NULL OR DATEDIFF(day, GETDATE(), deadline) > 7
        `);

        console.log('✅ Đã cập nhật xong trạng thái cảnh báo Xanh/Vàng/Đỏ!');
    } catch (err) {
        console.error('Lỗi chạy Cron Job:', err);
    }
});

// CỔNG CHUẨN CỦA NODE.JS SERVER LÀ 5000 (KHÔNG ĐỂ 5173 TRÙNG VỚI FRONTEND)
server.listen(5000, () => {
    console.log('🚀 Server Node.js đang chạy trên http://localhost:5000');
});