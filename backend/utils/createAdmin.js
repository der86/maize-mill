/**
 * Run once to create the first admin user, since the public /register route
 * is locked to admins only (there's a chicken-and-egg problem otherwise).
 * Usage: npm run seed:admin
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) {
      console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in your .env first.');
      process.exit(1);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Admin ${email} already exists. Nothing to do.`);
      process.exit(0);
    }

    await User.create({ name: 'Plant Admin', email, password, role: 'admin' });
    console.log(`Admin user created: ${email}`);
    console.log('IMPORTANT: log in and change this password immediately.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create admin:', err.message);
    process.exit(1);
  }
})();
