const express = require('express');
const {
  markAttendance,
  markManualBulk,
  getStudentAttendance,
  getMyAttendance,
  getClassAttendance,
  getAllAttendance,
  updateAttendance,
  deleteAttendance,
  exportAttendance,
} = require('../controllers/attendance.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// POST /api/attendance/mark           — face recognition single
router.post('/mark', markAttendance);

// POST /api/attendance/mark-manual    — teacher marks multiple students manually
router.post('/mark-manual', authorize('admin', 'teacher'), markManualBulk);

// GET  /api/attendance/my             — student views own history
router.get('/my', authorize('student'), getMyAttendance);

// GET  /api/attendance/export
router.get('/export', authorize('admin', 'teacher'), exportAttendance);

// GET  /api/attendance/all            — admin
router.get('/all', authorize('admin'), getAllAttendance);

// GET  /api/attendance/class/:classId — teacher views class attendance
router.get('/class/:classId', authorize('admin', 'teacher'), getClassAttendance);

// GET  /api/attendance/student/:studentId
router.get('/student/:studentId', authorize('admin', 'teacher'), getStudentAttendance);

// PUT  /api/attendance/:id
router.put('/:id', authorize('admin', 'teacher'), updateAttendance);

// DELETE /api/attendance/:id
router.delete('/:id', authorize('admin'), deleteAttendance);

module.exports = router;

