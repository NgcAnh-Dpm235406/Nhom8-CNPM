const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Giới hạn tần suất đăng nhập và đổi mật khẩu để chống Brute-force & Credential Stuffing
const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 10, // Tối đa 10 lần yêu cầu trong 1 phút
    message: {
        success: false,
        message: 'Bạn đã thao tác xác thực quá nhiều lần liên tiếp. Vui lòng đợi 1 phút và thử lại.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/login', authLimiter, authController.login);
router.get('/profile', verifyToken, authController.getProfile);
router.put('/change-password', verifyToken, authLimiter, authController.changePassword);
router.get('/notifications', verifyToken, authController.getNotifications);
router.put('/notifications/:id/read', verifyToken, authController.markNotificationRead);

module.exports = router;

