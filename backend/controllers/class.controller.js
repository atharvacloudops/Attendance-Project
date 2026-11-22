const Class = require('../models/Class.model');
const Student = require('../models/Student.model');
const { sendSuccess, sendError } = require('../utils/response.utils');

// ─── Create class (teacher/admin) ─────────────────────────────────────────────
const createClass = async (req, res) => {
  try {
    const { name, subject, department, semester, division, schedule } = req.body;

    const classDoc = await Class.create({
      name,
      subject,
      department,
      semester,
      division,
      schedule,
      teacher: req.user._id,
    });

    sendSuccess(res, 201, 'Class created', { class: classDoc });
  } catch (error) {
    sendError(res, 500, error.message || 'Failed to create class');
  }
};

// ─── Get all classes ──────────────────────────────────────────────────────────
const getAllClasses = async (req, res) => {
  try {
    const filter = {};

    // Teachers only see their own classes
    if (req.user.role === 'teacher') filter.teacher = req.user._id;

    const classes = await Class.find(filter)
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    sendSuccess(res, 200, 'Classes fetched', { classes });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch classes');
  }
};

// ─── Get single class ─────────────────────────────────────────────────────────
const getClassById = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate({
        path: 'students',
        populate: { path: 'userId', select: 'name email' },
        select: 'rollNumber department semester division faceRegistered userId',
      });

    if (!classDoc) return sendError(res, 404, 'Class not found');
    sendSuccess(res, 200, 'Class fetched', { class: classDoc });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch class');
  }
};

// ─── Update class ─────────────────────────────────────────────────────────────
const updateClass = async (req, res) => {
  try {
    const classDoc = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!classDoc) return sendError(res, 404, 'Class not found');
    sendSuccess(res, 200, 'Class updated', { class: classDoc });
  } catch (error) {
    sendError(res, 500, 'Failed to update class');
  }
};

// ─── Delete class ─────────────────────────────────────────────────────────────
const deleteClass = async (req, res) => {
  try {
    const classDoc = await Class.findByIdAndDelete(req.params.id);
    if (!classDoc) return sendError(res, 404, 'Class not found');
    sendSuccess(res, 200, 'Class deleted');
  } catch (error) {
    sendError(res, 500, 'Failed to delete class');
  }
};

// ─── Student joins class via join code ────────────────────────────────────────
const joinClass = async (req, res) => {
  try {
    const { joinCode } = req.body;

    const classDoc = await Class.findOne({ joinCode: joinCode?.toUpperCase() });
    if (!classDoc) return sendError(res, 404, 'Invalid join code');

    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return sendError(res, 404, 'Student profile not found');

    // Check if already enrolled
    if (classDoc.students.some(id => id.equals(student._id))) {
      return sendError(res, 409, 'Already enrolled in this class');
    }

    classDoc.students.push(student._id);
    await classDoc.save();

    student.enrolledClasses.push(classDoc._id);
    await student.save();

    sendSuccess(res, 200, 'Joined class successfully', { class: classDoc });
  } catch (error) {
    sendError(res, 500, 'Failed to join class');
  }
};

// ─── Get classes for a student ────────────────────────────────────────────────
const getMyClasses = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return sendError(res, 404, 'Student profile not found');

    const classes = await Class.find({ students: student._id })
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    sendSuccess(res, 200, 'Classes fetched', { classes });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch classes');
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  joinClass,
  getMyClasses,
};
