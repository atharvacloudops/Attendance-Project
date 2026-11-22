const Timetable = require('../models/Timetable');

// Helper to send success responses
const ok  = (res, data, msg = 'Success') => res.status(200).json({ success: true, message: msg, data });
const err = (res, status, msg)           => res.status(status).json({ success: false, message: msg });

// ── Day name from today's date ────────────────────────────────────────────────
const getTodayName = () =>
  ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

// ── GET /api/timetable/today  (student: see today's slots) ───────────────────
exports.getToday = async (req, res) => {
  try {
    const slots = await Timetable.find({ isActive: true, day: getTodayName() })
      .populate('teacher', 'name email')
      .populate('class',   'name subject joinCode')
      .sort('startTime');
    ok(res, { slots, day: getTodayName() });
  } catch (e) {
    err(res, 500, e.message);
  }
};

// ── GET /api/timetable/week  (all slots for the whole week) ──────────────────
exports.getWeek = async (req, res) => {
  try {
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const slots = await Timetable.find({ isActive: true })
      .populate('teacher', 'name')
      .populate('class',   'name subject')
      .sort('startTime');

    // Group by day for easy frontend rendering
    const grouped = {};
    days.forEach(d => { grouped[d] = []; });
    slots.forEach(s => { if (grouped[s.day]) grouped[s.day].push(s); });

    ok(res, { grouped, days });
  } catch (e) {
    err(res, 500, e.message);
  }
};

// ── GET /api/timetable/class/:classId  (teacher: see their class schedule) ───
exports.getByClass = async (req, res) => {
  try {
    const slots = await Timetable.find({ class: req.params.classId, isActive: true })
      .populate('teacher', 'name')
      .sort('day startTime');
    ok(res, { slots });
  } catch (e) {
    err(res, 500, e.message);
  }
};

// ── POST /api/timetable  (admin: create a slot) ──────────────────────────────
exports.create = async (req, res) => {
  try {
    const { subject, teacher, class: classId, day, startTime, endTime, room } = req.body;

    if (!subject || !teacher || !classId || !day || !startTime || !endTime) {
      return err(res, 400, 'subject, teacher, class, day, startTime and endTime are all required');
    }

    // Prevent duplicate slot for same class on same day at same time
    const exists = await Timetable.findOne({ class: classId, day, startTime });
    if (exists) {
      return err(res, 409, `A timetable slot for this class on ${day} at ${startTime} already exists`);
    }

    const slot = await Timetable.create({ subject, teacher, class: classId, day, startTime, endTime, room });
    const populated = await slot.populate([
      { path: 'teacher', select: 'name email' },
      { path: 'class',   select: 'name subject' },
    ]);
    ok(res, { slot: populated }, 'Timetable slot created');
  } catch (e) {
    err(res, 500, e.message);
  }
};

// ── PUT /api/timetable/:id  (admin: update a slot) ───────────────────────────
exports.update = async (req, res) => {
  try {
    const slot = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('teacher', 'name')
      .populate('class',   'name subject');
    if (!slot) return err(res, 404, 'Timetable slot not found');
    ok(res, { slot }, 'Timetable slot updated');
  } catch (e) {
    err(res, 500, e.message);
  }
};

// ── DELETE /api/timetable/:id  (admin: delete a slot) ────────────────────────
exports.remove = async (req, res) => {
  try {
    const slot = await Timetable.findByIdAndDelete(req.params.id);
    if (!slot) return err(res, 404, 'Timetable slot not found');
    ok(res, {}, 'Timetable slot deleted');
  } catch (e) {
    err(res, 500, e.message);
  }
};

// ── GET /api/timetable/check-active  (used by attendance to verify class is live) ──
exports.checkActive = async (req, res) => {
  try {
    const { classId } = req.query;
    const now  = new Date();
    const time = now.toTimeString().slice(0, 5);   // "09:35"
    const day  = getTodayName();

    const slot = await Timetable.findOne({
      class:     classId,
      day,
      startTime: { $lte: time },
      endTime:   { $gte: time },
      isActive:  true,
    });

    ok(res, {
      isActive: !!slot,
      slot:     slot || null,
      currentTime: time,
      currentDay:  day,
      message: slot
        ? `Class is active until ${slot.endTime}`
        : `No active class right now on ${day} at ${time}`,
    });
  } catch (e) {
    err(res, 500, e.message);
  }
};