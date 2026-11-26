const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const admissionController = require('../controllers/admissionController');
const upload = require('../middlewares/uploadMiddleware');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

const publicAdmissionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    message: {
        success: false,
        message: 'Hệ thống tiếp nhận quá nhiều yêu cầu từ kết nối của bạn. Vui lòng chờ 1 phút.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Public endpoints (Dành cho thí sinh nộp hồ sơ & tra cứu)
router.get('/campaigns', admissionController.getCampaigns);
router.post('/register', publicAdmissionLimiter, upload.single('degree_file'), admissionController.registerProfile);
router.get('/lookup', publicAdmissionLimiter, admissionController.lookupAdmission);

// Admin endpoints (Dành cho Phòng Đào tạo SĐH)
router.get('/profiles', verifyToken, requireRoles('ADMIN'), admissionController.getAllProfiles);
router.post('/campaigns', verifyToken, requireRoles('ADMIN'), admissionController.createCampaign);
router.put('/profiles/:id/review', verifyToken, requireRoles('ADMIN'), admissionController.reviewProfile);
router.post('/profiles/:id/admit', verifyToken, requireRoles('ADMIN'), admissionController.admitCandidate);

module.exports = router;

