const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ['admin', 'manager', 'operator'],
      default: 'operator',
    },
    isActive: { type: Boolean, default: true },
    refreshTokenHash: { type: String, select: false }, // stores hash of current valid refresh token
    lastLogin: { type: Date },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
  };
};

module.exports = mongoose.model('User', userSchema);
