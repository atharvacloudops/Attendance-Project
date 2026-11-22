const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// All user routes require authentication
router.use(protect);

// GET  /api/users          – admin only
router.get('/', authorize('admin'), getAllUsers);

// GET  /api/users/:id
router.get('/:id', authorize('admin'), getUserById);

// PUT  /api/users/:id
router.put('/:id', authorize('admin'), updateUser);

// DELETE /api/users/:id
router.delete('/:id', authorize('admin'), deleteUser);

// PATCH /api/users/:id/toggle-status
router.patch('/:id/toggle-status', authorize('admin'), toggleUserStatus);

module.exports = router;
