const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    division: {
      type: String,
      trim: true,
      uppercase: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    schedule: {
      days: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] }],
      startTime: String,
      endTime: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Join code for students to self-enroll
    joinCode: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Generate a random 6-char join code
classSchema.pre('save', function (next) {
  if (!this.joinCode) {
    this.joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Class', classSchema);
