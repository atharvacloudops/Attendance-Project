const User = require('../models/User.model');
const Student = require('../models/Student.model');
const { sendSuccess, sendError } = require('../utils/response.utils');

// ─── Get all users (admin only) ───────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    sendSuccess(res, 200, 'Users fetched', {
      users,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch users');
  }
};

// ─── Get single user ──────────────────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return sendError(res, 404, 'User not found');
    sendSuccess(res, 200, 'User fetched', { user });
  } catch (error) {
    sendError(res, 500, 'Failed to fetch user');
  }
};

// ─── Update user (admin) ──────────────────────────────────────────────────────
const updateUser = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return sendError(res, 404, 'User not found');
    sendSuccess(res, 200, 'User updated', { user });
  } catch (error) {
    sendError(res, 500, 'Failed to update user');
  }
};

// ─── Delete user (admin) ──────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');

    // Also remove student profile if student
    if (user.role === 'student') {
      await Student.findOneAndDelete({ userId: req.params.id });
    }

    sendSuccess(res, 200, 'User deleted successfully');
  } catch (error) {
    sendError(res, 500, 'Failed to delete user');
  }
};

// ─── Toggle active status ─────────────────────────────────────────────────────
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 404, 'User not found');

    user.isActive = !user.isActive;
    await user.save();

    sendSuccess(res, 200, `User ${user.isActive ? 'activated' : 'deactivated'}`, {
      user,
    });
  } catch (error) {
    sendError(res, 500, 'Failed to update status');
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser, toggleUserStatus };
