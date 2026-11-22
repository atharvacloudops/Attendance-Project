const StudyMaterial = require('../models/StudyMaterial.model');
const Class = require('../models/Class.model');
const { sendSuccess, sendError } = require('../utils/response.utils');
const fs = require('fs');
const path = require('path');

// @desc    Upload new study material (PDF)
// @route   POST /api/materials
// @access  Private (Teacher)
exports.uploadMaterial = async (req, res) => {
  try {
    const { title, description, classId, subject } = req.body;

    if (!req.file) {
      return sendError(res, 400, 'Please upload a PDF file');
    }

    // Verify class exists and belongs to teacher
    const classInfo = await Class.findById(classId);
    if (!classInfo) {
      return sendError(res, 404, 'Class not found');
    }

    if (classInfo.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 403, 'Not authorized to upload to this class');
    }

    const newMaterial = await StudyMaterial.create({
      title,
      description,
      fileUrl: `/uploads/materials/${req.file.filename}`,
      uploadedBy: req.user._id,
      classId,
      subject: subject || classInfo.subject,
    });

    sendSuccess(res, 201, 'Study material uploaded successfully', { material: newMaterial });
  } catch (error) {
    console.error('Upload material error:', error);
    sendError(res, 500, 'Server Error during upload');
  }
};

// @desc    Get study materials for a specific class
// @route   GET /api/materials/class/:classId
// @access  Private (Student/Teacher)
exports.getMaterialsByClass = async (req, res) => {
  try {
    const materials = await StudyMaterial.find({ classId: req.params.classId })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    sendSuccess(res, 200, 'Materials fetched successfully', { materials });
  } catch (error) {
    console.error('Get materials error:', error);
    sendError(res, 500, 'Server Error');
  }
};

// @desc    Delete study material
// @route   DELETE /api/materials/:id
// @access  Private (Teacher/Admin)
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);

    if (!material) {
      return sendError(res, 404, 'Material not found');
    }

    // Verify ownership
    if (material.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 403, 'Not authorized to delete this material');
    }

    // Delete the file from filesystem
    const filePath = path.join(__dirname, '..', material.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await material.deleteOne();

    sendSuccess(res, 200, 'Material deleted successfully');
  } catch (error) {
    console.error('Delete material error:', error);
    sendError(res, 500, 'Server Error');
  }
};
