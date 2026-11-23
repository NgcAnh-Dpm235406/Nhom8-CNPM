const express = require('express');
const adminController = require('../controllers/adminController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireRoles('ADMIN'));
router.get('/overview-stats', adminController.getOverviewStats);
router.get('/students', adminController.getStudents);
router.get('/tuition', adminController.getTuitionList);
router.post('/tuition', adminController.createTuition);
router.put('/tuition/:id', adminController.updateTuition);
router.put('/tuition/:id/payment-slip/review', adminController.reviewTuitionPaymentSlip);
router.put('/students/:id/academic-status', adminController.updateStudentAcademicStatus);
router.put('/students/:id/account-status', adminController.updateStudentAccountStatus);
router.post('/students/:id/reset-password', adminController.resetStudentPassword);
router.get('/lecturers', adminController.getLecturers);
router.get('/lecturers/:id/students', adminController.getLecturerStudents);
router.get('/committees', adminController.getCommittees);
router.get('/defense-candidates', adminController.getDefenseCandidates);
router.get('/defense-schedules/:id/evaluations', adminController.getDefenseEvaluations);
router.post('/defense-schedules/:id/evaluations', adminController.saveDefenseEvaluations);
router.post('/lecturers', adminController.createLecturer);
router.put('/lecturers/:id', adminController.updateLecturer);
router.delete('/lecturers/:id', adminController.deleteLecturer);

router.get('/students/:id/outputs', adminController.getStudentOutputs);
router.put('/publications/:pubId/review', adminController.reviewPublication);
router.put('/language-certs/:certId/review', adminController.reviewLanguageCert);
module.exports = router;
