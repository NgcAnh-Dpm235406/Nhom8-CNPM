const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const upload = require('../middlewares/uploadMiddleware');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

router.get('/me', verifyToken, studentController.getMyInfo);
router.put('/me', verifyToken, requireRoles('STUDENT'), studentController.updateMyInfo);
router.get('/tuition', verifyToken, studentController.getTuition);
router.get('/payment-info', verifyToken, studentController.getPaymentInfo);
router.post('/tuition/:tuitionId/payment-slip', verifyToken, requireRoles('STUDENT'), upload.paymentSlipUpload.single('payment_slip'), studentController.submitPaymentSlip);
router.get('/defense-result', verifyToken, requireRoles('STUDENT'), studentController.getMyDefenseResult);
router.post('/register-course', verifyToken, requireRoles('STUDENT'), studentController.registerCourse);
router.delete('/cancel-course/:registrationId', verifyToken, requireRoles('STUDENT'), studentController.cancelCourseRegistration);
router.get('/schedule', verifyToken, studentController.getMyCourses);
router.get('/grades', verifyToken, studentController.getMyGrades);
router.get('/lecturer/classes', verifyToken, requireRoles('LECTURER', 'ADMIN'), studentController.getLecturerClasses);
router.get('/lecturer/classes/:classId/students', verifyToken, requireRoles('LECTURER', 'ADMIN'), studentController.getLecturerClassStudents);
router.put('/enter-grades', verifyToken, requireRoles('LECTURER', 'ADMIN'), studentController.enterGrades);

module.exports = router;
