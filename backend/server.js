require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const purchaseRoutes = require('./routes/purchases');
const millingRoutes = require('./routes/milling');
const salesRoutes = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');

// Fail fast if critical secrets are missing (prevents accidentally running with
// weak/undefined JWT secrets in production).
['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'].forEach((key) => {
  if (!process.env[key]) {
    // eslint-disable-next-line no-console
    console.error(`FATAL: missing required environment variable ${key}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
});

connectDB();

const app = express();

// --- Security middleware ---
app.use(helmet()); // sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
app.disable('x-powered-by');

const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors({
    origin(origin, callback) {
      // allow no-origin requests (mobile apps, curl, Expo Go dev client) and whitelisted origins
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' })); // body size limit guards against large-payload DoS
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . from user input to block NoSQL injection
app.use(xss()); // sanitizes user input against basic XSS payloads
app.use(hpp()); // guards against HTTP parameter pollution

// General API rate limiter (auth routes have their own stricter limiter too)
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is healthy', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/milling', millingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));

// Safety nets: don't let the process die silently or hang forever on unexpected errors
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = app;
