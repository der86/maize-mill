const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

// Stricter limiter specifically on login to blunt brute-force/credential-stuffing
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function signAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
}

function signRefreshToken(user) {
  return jwt.sign({ id: user._id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * POST /api/auth/register
 * Only an existing admin can create new users (prevents public self-signup
 * onto a private plant-management system). Bootstrap the first admin with
 * `npm run seed:admin` (utils/createAdmin.js) instead.
 */
router.post(
  '/register',
  protect,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('Password must contain a number'),
    body('role').optional().isIn(['admin', 'manager', 'operator']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ success: false, message: 'A user with that email already exists.' });
      }
      const user = await User.create({ name, email, password, role: role || 'operator' });
      res.status(201).json({ success: true, data: user.toSafeObject() });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  loginLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password +failedLoginAttempts +lockUntil');

      // Generic message on every failure path below - never reveal whether
      // the email exists, to avoid account enumeration.
      const genericFail = () => res.status(401).json({ success: false, message: 'Invalid email or password.' });

      if (!user) return genericFail();

      if (user.isLocked) {
        return res.status(423).json({
          success: false,
          message: 'Account temporarily locked due to repeated failed logins. Try again later.',
        });
      }

      if (!user.isActive) return genericFail();

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
          user.lockUntil = Date.now() + LOCK_TIME_MS;
          user.failedLoginAttempts = 0;
        }
        await user.save();
        return genericFail();
      }

      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      user.lastLogin = new Date();

      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      user.refreshTokenHash = hashToken(refreshToken);
      await user.save();

      res.json({
        success: true,
        data: { user: user.toSafeObject(), accessToken, refreshToken },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/refresh', [body('refreshToken').notEmpty()], validate, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token. Please log in again.' });
    }

    const user = await User.findById(decoded.id).select('+refreshTokenHash');
    if (!user || !user.isActive || user.refreshTokenHash !== hashToken(refreshToken)) {
      return res.status(401).json({ success: false, message: 'Refresh token no longer valid. Please log in again.' });
    }

    const newAccessToken = signAccessToken(user);
    // Rotate the refresh token to reduce replay risk
    const newRefreshToken = signRefreshToken(user);
    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', protect, async (req, res, next) => {
  try {
    req.user.refreshTokenHash = undefined;
    await req.user.save();
    res.json({ success: true, message: 'Logged out.' });
  } catch (err) {
    next(err);
  }
});

router.get('/me', protect, (req, res) => {
  res.json({ success: true, data: req.user.toSafeObject() });
});

module.exports = router;
