const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { verifyToken, requireRoles } = require('../middlewares/authMiddleware');

router.get('/majors', academicController.getMajors);
router.get('/curriculums', academicController.getCurriculums);
router.get('/curriculums/:id/courses', academicController.getCurriculumCourses);
router.get('/lecturers', academicController.getLecturers);
router.get('/semesters', academicController.getSemesters);
router.post('/semesters', verifyToken, requireRoles('ADMIN'), academicController.createSemester);
router.get('/classes', academicController.getClasses);
router.get('/courses', verifyToken, requireRoles('ADMIN'), academicController.getCourses);
router.post('/courses', verifyToken, requireRoles('ADMIN'), academicController.createCourse);
router.put('/courses/:id', verifyToken, requireRoles('ADMIN'), academicController.updateCourse);
router.delete('/courses/:id', verifyToken, requireRoles('ADMIN'), academicController.deleteCourse);
router.post('/classes', verifyToken, requireRoles('ADMIN'), academicController.createClass);
router.put('/classes/:id', verifyToken, requireRoles('ADMIN'), academicController.updateClass);
router.delete('/classes/:id', verifyToken, requireRoles('ADMIN'), academicController.deleteClass);
router.put('/classes/:id/schedule', verifyToken, requireRoles('ADMIN'), academicController.upsertClassSchedule);

module.exports = router;

