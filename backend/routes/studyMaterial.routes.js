const express = require('express');
const router = express.Router();
const { uploadMaterial, getMaterialsByClass, deleteMaterial } = require('../controllers/studyMaterial.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const uploadPdf = require('../middleware/uploadPdf.middleware');

// Routes
// POST /api/materials - Upload new material
router.post(
  '/',
  protect,
  authorize('teacher', 'admin'),
  uploadPdf.single('file'),
  uploadMaterial
);

// GET /api/materials/class/:classId - Get materials for class
router.get(
  '/class/:classId',
  protect,
  getMaterialsByClass
);

// DELETE /api/materials/:id - Delete material
router.delete(
  '/:id',
  protect,
  authorize('teacher', 'admin'),
  deleteMaterial
);

module.exports = router;
