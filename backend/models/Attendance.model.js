const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Date only (YYYY-MM-DD) for quick duplicate checks
    dateString: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present',
    },
    method: {
      type: String,
      enum: ['face_recognition', 'manual', 'qr_code'],
      default: 'face_recognition',
    },
    confidence: {
      type: Number,     // face recognition confidence score 0–1
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Prevent duplicate attendance for same student on same day in same class
attendanceSchema.index(
  { studentId: 1, dateString: 1, classId: 1 },
  { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
