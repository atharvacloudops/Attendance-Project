const express = require('express');
const { processChat } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/chat
router.post('/', protect, processChat);

module.exports = router;
