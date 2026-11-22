/**
 * attendance.controller.js
 * ─────────────────────────
 * All attendance logic:
 *  • markAttendance     — single face-recognition mark
 *  • markManualBulk     — teacher marks multiple students (present/absent/late + remarks)
 *  • getMyAttendance    — student self-view
 *  • getStudentAttendance
 *  • getClassAttendance
 *  • getAllAttendance    — admin
 *  • updateAttendance   — patch status/remarks
 *  • deleteAttendance
 *  • exportAttendance   — CSV with server save at /attendance_records/{className}/{date}/
 */

const fs   = require('fs');
const path = require('path');

const Attendance = require('../models/Attendance.model');
const Student    = require('../models/Student.model');
const Class      = require('../models/Class.model');
const { sendSuccess, sendError } = require('../utils/response.utils');

// ── Date helpers ───────────────────────────────────────────────────────────────
const todayString = () => new Date().toISOString().split('T')[0];
const safeFilename = (s) => (s || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');

// ── CSV builder ────────────────────────────────────────────────────────────────
function buildCSV(rows) {
  if (!rows.length) return '';
  const esc  = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = Object.keys(rows[0]).join(',');
  const body = rows.map((r) => Object.values(r).map(esc).join(',')).join('\n');
  return `${head}\n${body}`;
}

/**
 * Save CSV to:
 *   backend/attendance_records/<className>/<date>/attendance_<date>.csv
 * Returns the relative path for the API response.
 */
function saveCSV(csvContent, className, dateStr) {
  const classSlug = safeFilename(className);
  const dir = path.join(__dirname, '..', 'attendance_records', classSlug, dateStr);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `attendance_${dateStr}.csv`;
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, csvContent, 'utf8');

  return {
    savedPath: `backend/attendance_records/${classSlug}/${dateStr}/${filename}`,
    savedAs:   filename,
  };
}

// ─── markAttendance ──────────────────────────────────────────────────────────
const markAttendance = async (req, res) => {
  try {
    const { studentId, classId, confidence, method } = req.body;
    if (!studentId) return sendError(res, 400, 'studentId is required');

    const student = await Student.findById(studentId);
    if (!student) return sendError(res, 404, 'Student not found');

    const dateStr = todayString();
    const existing = await Attendance.findOne({ studentId, dateString: dateStr, classId: classId || null });
    if (existing) {
      return sendError(res, 409, 'Attendance already marked for today', { attendance: existing });
    }

    const record = await Attendance.create({
      studentId,
      classId:    classId || null,
      markedBy:   req.user._id,
      date:       new Date(),
      dateString: dateStr,
      status:     'present',
      method:     method || 'face_recognition',
      confidence: confidence ?? null,
    });

    const populated = await record.populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'name email' },
    });

    sendSuccess(res, 201, 'Attendance marked', { attendance: populated });
  } catch (err) {
    console.error('[markAttendance]', err);
    sendError(res, 500, 'Failed to mark attendance');
  }
};

// ─── markManualBulk ──────────────────────────────────────────────────────────
const markManualBulk = async (req, res) => {
  try {
    const { students, classId, date, status: globalStatus } = req.body;
    if (!Array.isArray(students) || !students.length) {
      return sendError(res, 400, 'students array is required');
    }

    const dateStr = date || todayString();
    const results = { marked: [], updated: [], errors: [] };

    for (const entry of students) {
      const studentId = entry.studentId || entry;
      const status    = entry.status  || globalStatus || 'present';
      const remarks   = entry.remarks || '';

      try {
        const existing = await Attendance.findOne({ studentId, dateString: dateStr, classId: classId || null });
        if (existing) {
          existing.status   = status;
          existing.remarks  = remarks;
          existing.method   = 'manual';
          existing.markedBy = req.user._id;
          await existing.save();
          results.updated.push({ studentId, status });
        } else {
          await Attendance.create({
            studentId, classId: classId || null,
            markedBy: req.user._id,
            date: new Date(dateStr + 'T12:00:00.000Z'),
            dateString: dateStr,
            status, method: 'manual', remarks,
          });
          results.marked.push({ studentId, status });
        }
      } catch (e) {
        console.error('[markManualBulk] student error:', e.message);
        results.errors.push({ studentId, error: e.message });
      }
    }

    const total = results.marked.length + results.updated.length;
    sendSuccess(res, 200, `Saved ${total} records (${results.marked.length} new, ${results.updated.length} updated)`, { results });
  } catch (err) {
    console.error('[markManualBulk]', err);
    sendError(res, 500, 'Failed to mark attendance');
  }
};

// ─── getStudentAttendance ────────────────────────────────────────────────────
const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classId, from, to, page = 1, limit = 30 } = req.query;

    const filter = { studentId };
    if (classId) filter.classId = classId;
    if (from || to) {
      filter.dateString = {};
      if (from) filter.dateString.$gte = from;
      if (to)   filter.dateString.$lte = to;
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(filter);

    const records = await Attendance.find(filter)
      .populate({ path: 'classId', select: 'name subject' })
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const presentCount = await Attendance.countDocuments({ ...filter, status: 'present' });
    const percentage   = total > 0 ? Math.round((presentCount / total) * 100) : 0;

    sendSuccess(res, 200, 'Attendance fetched', {
      records,
      stats:      { total, present: presentCount, percentage },
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch attendance');
  }
};

// ─── getMyAttendance ─────────────────────────────────────────────────────────
const getMyAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) return sendError(res, 404, 'Student profile not found');
    req.params.studentId = student._id.toString();
    return getStudentAttendance(req, res);
  } catch (err) {
    sendError(res, 500, 'Failed to fetch attendance');
  }
};

// ─── getClassAttendance ──────────────────────────────────────────────────────
const getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, from, to } = req.query;

    const filter = { classId };
    if (date) filter.dateString = date;
    else if (from || to) {
      filter.dateString = {};
      if (from) filter.dateString.$gte = from;
      if (to)   filter.dateString.$lte = to;
    }

    const records = await Attendance.find(filter)
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'name email' },
        select: 'rollNumber department semester',
      })
      .sort({ date: -1 });

    sendSuccess(res, 200, 'Class attendance fetched', { records });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch class attendance');
  }
};

// ─── getAllAttendance (admin) ─────────────────────────────────────────────────
const getAllAttendance = async (req, res) => {
  try {
    const { date, classId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (date)    filter.dateString = date;
    if (classId) filter.classId   = classId;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(filter);

    const records = await Attendance.find(filter)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' }, select: 'rollNumber department' })
      .populate('classId', 'name subject')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    sendSuccess(res, 200, 'All attendance fetched', { records, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch attendance');
  }
};

// ─── updateAttendance ────────────────────────────────────────────────────────
const updateAttendance = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const record = await Attendance.findByIdAndUpdate(
      req.params.id, { status, remarks, method: 'manual' }, { new: true }
    );
    if (!record) return sendError(res, 404, 'Record not found');
    sendSuccess(res, 200, 'Attendance updated', { record });
  } catch (err) {
    sendError(res, 500, 'Failed to update attendance');
  }
};

// ─── deleteAttendance ────────────────────────────────────────────────────────
const deleteAttendance = async (req, res) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) return sendError(res, 404, 'Record not found');
    sendSuccess(res, 200, 'Attendance record deleted');
  } catch (err) {
    sendError(res, 500, 'Failed to delete record');
  }
};

// ─── exportAttendance ────────────────────────────────────────────────────────
/**
 * GET /api/attendance/export?classId=&from=&to=&date=
 *
 * • Builds CSV rows with: Date, StudentID, Name, Roll, Department, Class,
 *   Subject, Status, Method, Confidence, Timestamp, Remarks
 * • Saves file to: backend/attendance_records/<ClassName>/<date>/attendance_<date>.csv
 * • Returns JSON with { data[], total, savedAs, savedPath }
 */
const exportAttendance = async (req, res) => {
  try {
    const { classId, from, to, date } = req.query;

    const filter = {};
    if (classId) filter.classId = classId;
    if (date)    filter.dateString = date;
    else if (from || to) {
      filter.dateString = {};
      if (from) filter.dateString.$gte = from;
      if (to)   filter.dateString.$lte = to;
    }

    const records = await Attendance.find(filter)
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' }, select: 'rollNumber department semester userId' })
      .populate('classId', 'name subject')
      .sort({ dateString: 1, 'studentId.rollNumber': 1 });

    const csvRows = records.map((r) => ({
      Date:        r.dateString,
      StudentID:   r.studentId?._id?.toString() || '',
      Name:        r.studentId?.userId?.name    || '',
      Email:       r.studentId?.userId?.email   || '',
      Roll:        r.studentId?.rollNumber      || '',
      Department:  r.studentId?.department      || '',
      Class:       r.classId?.name              || '',
      Subject:     r.classId?.subject           || '',
      Status:      r.status,
      Method:      r.method,
      Confidence:  r.confidence != null ? `${Math.round(r.confidence * 100)}%` : 'N/A',
      Timestamp:   r.createdAt ? new Date(r.createdAt).toISOString() : '',
      Remarks:     r.remarks || '',
    }));

    // Determine date label for folder/file naming
    const dateLabel = date ? date : (from && to ? (from + '_to_' + to) : todayString());
    const className = records[0]?.classId?.name || (classId ? `class_${classId.slice(-6)}` : 'All');

    let savedPath = null;
    let savedAs   = null;

    if (csvRows.length > 0) {
      const csv = buildCSV(csvRows);
      const info = saveCSV(csv, className, dateLabel);
      savedPath = info.savedPath;
      savedAs   = info.savedAs;
      console.log(`[exportAttendance] Saved ${csvRows.length} rows → ${savedPath}`);
    }

    sendSuccess(res, 200, 'Export ready', {
      data:      csvRows,
      total:     csvRows.length,
      savedAs,
      savedPath,
    });
  } catch (err) {
    console.error('[exportAttendance]', err);
    sendError(res, 500, 'Failed to export attendance');
  }
};

module.exports = {
  markAttendance,
  markManualBulk,
  getStudentAttendance,
  getMyAttendance,
  getClassAttendance,
  getAllAttendance,
  updateAttendance,
  deleteAttendance,
  exportAttendance,
};
