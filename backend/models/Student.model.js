const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    // Link to User account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    division: {
      type: String,
      trim: true,
      uppercase: true,
    },
    // Face descriptor array (128-point Float32Array stored as regular array)
    faceDescriptor: {
      type: [Number],
      default: null,
    },
    faceRegistered: {
      type: Boolean,
      default: false,
    },
    faceImagePath: {
      type: String,
      default: null,
    },
    // Classes the student is enrolled in
    enrolledClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  },
  { timestamps: true }
);

// Virtual for populated user data
studentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

module.exports = mongoose.model('Student', studentSchema);
