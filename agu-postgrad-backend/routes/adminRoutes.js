const express = require('express');
const adminController = require('../controllers/adminController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireRoles('ADMIN'));
router.get('/lecturers', adminController.getLecturers);
router.get('/lecturers/:id/students', adminController.getLecturerStudents);
router.get('/committees', adminController.getCommittees);
router.get('/defense-candidates', adminController.getDefenseCandidates);
router.get('/defense-schedules/:id/evaluations', adminController.getDefenseEvaluations);
router.post('/defense-schedules/:id/evaluations', adminController.saveDefenseEvaluations);
router.post('/lecturers', adminController.createLecturer);
router.put('/lecturers/:id', adminController.updateLecturer);
router.delete('/lecturers/:id', adminController.deleteLecturer);

module.exports = router;
