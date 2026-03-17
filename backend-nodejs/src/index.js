require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 8080;

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
const uploadsDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(path.resolve(uploadsDir)));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/admin/tourism', require('./routes/admin-tourism.routes'));
app.use('/api/admin/hotels', require('./routes/admin-hotels.routes'));
app.use('/api/admin/roads', require('./routes/admin-roads.routes'));
app.use('/api/admin/horse-services', require('./routes/admin-horse-services.routes'));
app.use('/api/admin/guiders', require('./routes/admin-guiders.routes'));
app.use('/api/admin/audit', require('./routes/admin-audit.routes'));
app.use('/api/admin/security', require('./routes/admin-security.routes'));
app.use('/api/tourisms', require('./routes/tourism.routes'));
app.use('/api/hotels', require('./routes/hotels.routes'));
app.use('/api/bookings', require('./routes/bookings.routes'));
app.use('/api/roads', require('./routes/roads.routes'));
app.use('/api/horse-services', require('./routes/horse-services.routes'));
app.use('/api/language-guiders', require('./routes/language-guiders.routes'));
app.use('/api/guiders', require('./routes/guiders.routes'));
app.use('/api/ratings', require('./routes/ratings.routes'));
app.use('/api/map-points', require('./routes/map-points.routes'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'UP' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

// Seed required booking statuses on startup
async function initBookingStatuses() {
  const required = ['REQUESTED', 'OWNER_ACCEPTED', 'COST_PROPOSED', 'PAID', 'APPROVED', 'REJECTED'];
  for (const name of required) {
    const exists = await prisma.bookingStatusEntity.findUnique({ where: { name } });
    if (!exists) {
      await prisma.bookingStatusEntity.create({ data: { name } });
      console.log(`✓ Created booking status: ${name}`);
    }
  }
  const total = await prisma.bookingStatusEntity.count();
  console.log(`✓ Booking statuses ready. Total: ${total}`);
}

// Start server
const certPath = './certificates/localhost.pem';
const keyPath = './certificates/localhost-key.pem';

async function start() {
  await initBookingStatuses();

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const httpsOptions = { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) };
    https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
      console.log(`Backend running on: https://localhost:${PORT}`);
    });
  } else {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend running on: http://localhost:${PORT}`);
      console.log(`Uploads directory: ${path.resolve(uploadsDir)}`);
    });
  }
}

start().catch(err => { console.error('Startup error:', err); process.exit(1); });
