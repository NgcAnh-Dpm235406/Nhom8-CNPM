const cron = require('node-cron');
const { poolPromise } = require('../config/db');

async function runDeadlineCheck() {
    try {
        const pool = await poolPromise;
        await pool.request().query(`
            -- 1. Quá hạn chót mà chưa nộp -> Đỏ ('red')
            UPDATE thesis_submissions 
            SET color_warning = 'red' 
            WHERE submitted_at IS NULL AND deadline < CAST(GETDATE() AS DATE);

            -- 2. Còn <= 7 ngày mà chưa nộp -> Vàng ('yellow')
            UPDATE thesis_submissions 
            SET color_warning = 'yellow' 
            WHERE submitted_at IS NULL 
              AND deadline >= CAST(GETDATE() AS DATE) 
              AND DATEDIFF(day, GETDATE(), deadline) <= 7;

            -- 3. Đã nộp hoặc còn > 7 ngày -> Xanh ('green')
            UPDATE thesis_submissions 
            SET color_warning = 'green' 
            WHERE submitted_at IS NOT NULL OR DATEDIFF(day, GETDATE(), deadline) > 7;
        `);
        console.log('✅ [Cron] Hoàn tất cập nhật trạng thái cảnh báo Xanh / Vàng / Đỏ!');
    } catch (err) {
        console.error('❌ [Cron] Lỗi khi quét hạn nộp luận văn:', err.message);
    }
}

function initDeadlineReminderCron() {
    // Quét ngay 1 lần khi khởi động máy chủ
    runDeadlineCheck();

    // Chạy tự động định kỳ mỗi ngày lúc 00:00
    cron.schedule('0 0 * * *', async () => {
        console.log('🕒 [Cron] Đang quét cập nhật cảnh báo hạn chót luận văn (Xanh/Vàng/Đỏ)...');
        await runDeadlineCheck();
    });

    console.log('🕒 [Cron Job] Đã kích hoạt lịch trình tự động quét deadline hàng ngày');
}

module.exports = { initDeadlineReminderCron };

