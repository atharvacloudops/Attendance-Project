const User = require('../models/User.model');
const Student = require('../models/Student.model');
const { generateToken } = require('../utils/jwt.utils');
const { sendSuccess, sendError } = require('../utils/response.utils');

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, role, rollNumber, department, semester, division } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'Email already registered. Please login.');
    }

    // Create user
    const user = await User.create({ name, email, password, role: role || 'student' });

    // If student role, also create Student profile
    if (user.role === 'student') {
      if (!rollNumber || !department || !semester) {
        await User.findByIdAndDelete(user._id);
        return sendError(res, 400, 'Roll number, department, and semester are required for students.');
      }

      // Check roll number uniqueness
      const existingRoll = await Student.findOne({ rollNumber: rollNumber.toUpperCase() });
      if (existingRoll) {
        await User.findByIdAndDelete(user._id);
        return sendError(res, 409, 'Roll number already registered.');
      }

      await Student.create({
        userId: user._id,
        rollNumber,
        department,
        semester,
        division: division || '',
      });
    }

    const token = generateToken(user._id, user.role);

    sendSuccess(res, 201, 'Registration successful', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    sendError(res, 500, error.message || 'Registration failed');
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (it's excluded by default)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    if (!user.isActive) {
      return sendError(res, 401, 'Your account has been deactivated. Contact admin.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    const token = generateToken(user._id, user.role);

    // Get student profile if student
    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await Student.findOne({ userId: user._id }).select('-faceDescriptor');
    }

    sendSuccess(res, 200, 'Login successful', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      studentProfile,
    });
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 500, 'Login failed. Please try again.');
  }
};

// ─── Get current logged-in user ───────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendError(res, 404, 'User not found');

    let studentProfile = null;
    if (user.role === 'student') {
      studentProfile = await Student.findOne({ userId: user._id }).select('-faceDescriptor');
    }

    sendSuccess(res, 200, 'User fetched', { user, studentProfile });
  } catch (error) {
    sendError(res, 500, 'Failed to get user');
  }
};

// ─── Change password ──────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return sendError(res, 400, 'Current password is incorrect');

    user.password = newPassword;
    await user.save();

    sendSuccess(res, 200, 'Password changed successfully');
  } catch (error) {
    sendError(res, 500, 'Failed to change password');
  }
};

module.exports = { register, login, getMe, changePassword };
