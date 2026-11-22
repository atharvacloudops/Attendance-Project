const express = require('express');
const {
  getAllStudents,
  getStudentById,
  getMyProfile,
  registerFace,
  registerFaceJSON,
  getAllFaceDescriptors,
  updateStudent,
} = require('../controllers/student.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.use(protect);

// GET /api/students/me
router.get('/me', authorize('student'), getMyProfile);

// GET /api/students/face-descriptors
router.get('/face-descriptors', getAllFaceDescriptors);

// POST /api/students/register-face  (multipart — legacy)
router.post('/register-face', authorize('student'), upload.single('faceImage'), registerFace);

// POST /api/students/register-face-json  (plain JSON — preferred, fixes the 128-array bug)
router.post('/register-face-json', authorize('student'), registerFaceJSON);

// PUT /api/students/me
router.put('/me', authorize('student'), updateStudent);

// GET /api/students
router.get('/', authorize('admin', 'teacher'), getAllStudents);

// GET /api/students/:id
router.get('/:id', authorize('admin', 'teacher'), getStudentById);

module.exports = router;
