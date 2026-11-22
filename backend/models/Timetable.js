const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  subject:   { type: String, required: true, trim: true },
  teacher:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  class:     { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  day: {
    type: String,
    required: true,
    enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  },
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  room:      { type: String, default: '' },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);