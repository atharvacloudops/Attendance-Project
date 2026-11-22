const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/timetable.controller');

// Import your existing auth middleware
const { protect, authorize } = require('../middleware/auth.middleware');

// Public-ish (any logged-in user)
router.get('/today',          protect, ctrl.getToday);
router.get('/week',           protect, ctrl.getWeek);
router.get('/check-active',   protect, ctrl.checkActive);
router.get('/class/:classId', protect, ctrl.getByClass);

// Admin & Teacher
router.post('/',    protect, authorize('admin', 'teacher'), ctrl.create);
router.put('/:id',  protect, authorize('admin', 'teacher'), ctrl.update);
router.delete('/:id', protect, authorize('admin', 'teacher'), ctrl.remove);

module.exports = router;