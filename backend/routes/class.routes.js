const express = require('express');
const {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  joinClass,
  getMyClasses,
} = require('../controllers/class.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// GET /api/classes/my  – student's enrolled classes
router.get('/my', authorize('student'), getMyClasses);

// POST /api/classes/join  – student joins via code
router.post('/join', authorize('student'), joinClass);

// GET /api/classes
router.get('/', getAllClasses);

// POST /api/classes  – teacher/admin creates
router.post('/', authorize('admin', 'teacher'), createClass);

// GET /api/classes/:id
router.get('/:id', getClassById);

// PUT /api/classes/:id
router.put('/:id', authorize('admin', 'teacher'), updateClass);

// DELETE /api/classes/:id
router.delete('/:id', authorize('admin'), deleteClass);

module.exports = router;
