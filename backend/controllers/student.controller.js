const Student = require('../models/Student.model');
const User = require('../models/User.model');
const { sendSuccess, sendError } = require('../utils/response.utils');
const path = require('path');

// ─── Get all students ─────────────────────────────────────────────────────────
const getAllStudents = async (req, res) => {
  try {
    const { department, semester, search } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);

    let students = await Student.find(filter)
      .populate('userId', 'name email isActive avatar')
      .select('-faceDescriptor')
      .sort({ rollNumber: 1 });

    if (search) {
      students = students.filter((s) =>
        s.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.rollNumber?.toLowerCase().includes(search.toLowerCase())
      );
    }

    sendSuccess(res, 200, 'Students fetched', { students });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch students');
  }
};

// ─── Get single student by ID ─────────────────────────────────────────────────
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'name email avatar')
      .select('-faceDescriptor');

    if (!student) return sendError(res, 404, 'Student not found');
    sendSuccess(res, 200, 'Student fetched', { student });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch student');
  }
};

// ─── Get own student profile (for logged-in student) ─────────────────────────
const getMyProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id })
      .populate('userId', 'name email avatar')
      .select('-faceDescriptor');

    if (!student) return sendError(res, 404, 'Student profile not found');
    sendSuccess(res, 200, 'Profile fetched', { student });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch profile');
  }
};

// ─── Register face descriptor ─────────────────────────────────────────────────
const registerFace = async (req, res) => {
  try {
    let { faceDescriptor } = req.body;

    // FormData sends everything as strings — parse it if needed
    if (typeof faceDescriptor === 'string') {
      try {
        faceDescriptor = JSON.parse(faceDescriptor);
      } catch {
        return sendError(res, 400, 'Invalid face descriptor format. Could not parse JSON.');
      }
    }

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return sendError(
        res, 400,
        `Invalid face descriptor. Expected array of 128 numbers, got ${Array.isArray(faceDescriptor) ? faceDescriptor.length : typeof faceDescriptor}.`
      );
    }

    // Ensure all values are valid numbers
    const allNumbers = faceDescriptor.every((v) => typeof v === 'number' && isFinite(v));
    if (!allNumbers) {
      return sendError(res, 400, 'Face descriptor contains invalid values. Please try again.');
    }

    const updateData = {
      faceDescriptor,
      faceRegistered: true,
    };

    // If image was uploaded via multer
    if (req.file) {
      updateData.faceImagePath = `/uploads/faces/${req.file.filename}`;
    }

    const student = await Student.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { new: true }
    ).select('-faceDescriptor');

    if (!student) return sendError(res, 404, 'Student profile not found');

    sendSuccess(res, 200, 'Face registered successfully', { student });
  } catch (error) {
    console.error('Face register error:', error);
    sendError(res, 500, 'Failed to register face');
  }
};

// ─── Register face via plain JSON body (preferred — no FormData parsing issues) ─
const registerFaceJSON = async (req, res) => {
  try {
    let { faceDescriptor } = req.body;

    // Normalize: could arrive as array or stringified array
    if (typeof faceDescriptor === 'string') {
      try { faceDescriptor = JSON.parse(faceDescriptor); } catch {
        return sendError(res, 400, 'faceDescriptor is not valid JSON.');
      }
    }

    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return sendError(
        res, 400,
        `Invalid face descriptor. Expected 128 numbers, received ${Array.isArray(faceDescriptor) ? faceDescriptor.length : typeof faceDescriptor}.`
      );
    }

    const allNumbers = faceDescriptor.every((v) => typeof v === 'number' && isFinite(v));
    if (!allNumbers) {
      return sendError(res, 400, 'Face descriptor contains non-numeric values. Please retake.');
    }

    const student = await Student.findOneAndUpdate(
      { userId: req.user._id },
      { faceDescriptor, faceRegistered: true },
      { new: true }
    ).select('-faceDescriptor');

    if (!student) return sendError(res, 404, 'Student profile not found');

    sendSuccess(res, 200, 'Face registered successfully', { student });
  } catch (error) {
    console.error('registerFaceJSON error:', error);
    sendError(res, 500, 'Failed to register face');
  }
};


// Returns name + descriptor for all registered students
const getAllFaceDescriptors = async (req, res) => {
  try {
    const students = await Student.find({ faceRegistered: true })
      .populate('userId', 'name email')
      .select('faceDescriptor rollNumber userId');

    const descriptors = students
      .filter((s) => s.faceDescriptor && s.userId)
      .map((s) => ({
        studentId: s._id,
        userId: s.userId._id,
        name: s.userId.name,
        rollNumber: s.rollNumber,
        descriptor: s.faceDescriptor,
      }));

    sendSuccess(res, 200, 'Descriptors fetched', { descriptors });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch descriptors');
  }
};

// ─── Update student profile ───────────────────────────────────────────────────
const updateStudent = async (req, res) => {
  try {
    const { department, semester, division } = req.body;

    const student = await Student.findOneAndUpdate(
      { userId: req.user._id },
      { department, semester, division },
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!student) return sendError(res, 404, 'Student not found');
    sendSuccess(res, 200, 'Student updated', { student });
  } catch (error) {
    sendError(res, 500, 'Failed to update student');
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  getMyProfile,
  registerFace,
  registerFaceJSON,
  getAllFaceDescriptors,
  updateStudent,
};
