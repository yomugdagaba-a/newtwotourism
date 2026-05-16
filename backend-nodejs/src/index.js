require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const prisma = require('./lib/prisma');

const app = express();
const PORT = process.env.PORT || 9001;

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://localhost:9000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Audit middleware — automatically logs all POST/PUT/PATCH/DELETE requests
const { auditMiddleware } = require('./middleware/audit.middleware');
app.use(auditMiddleware);

// Static uploads — always use UPLOAD_DIR from env (persistent path)
const uploadsDir = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`✓ Created uploads directory: ${uploadsDir}`);
  }
} catch (error) {
  console.warn(`⚠ Could not create uploads directory: ${error.message}`);
  console.warn('File uploads may not work properly. Consider using cloud storage.');
}
app.use('/uploads', express.static(uploadsDir));

// ── Controllers ────────────────────────────────────────────────────────────────
const { publicRouter: tourismPublicRouter, crudRouter: tourismCrudRouter } = require('./controllers/tourism.controller');
const hotelsController = require('./controllers/hotels.controller');
const roadsController = require('./controllers/roads.controller');
const horseServicesController = require('./controllers/horse-services.controller');
const tourismService = require('./services/tourism.service');
const hotelsService = require('./services/hotels.service');
const roadsService = require('./services/roads.service');
const horseServicesService = require('./services/horse-services.service');

// Auth & Users
app.use('/api/auth', require('./controllers/auth.controller'));
app.use('/api/users', require('./controllers/users.controller'));

// Tourism — public read at /api/tourisms, authenticated CRUD at /api/tourism
app.use('/api/tourisms', tourismPublicRouter);
app.use('/api/tourism', tourismCrudRouter);
app.use('/api/user/tourism', tourismCrudRouter);

// Sub-resource: hotels and roads under /api/tourisms/:tourismId
app.get('/api/tourisms/:tourismId/hotels', async (req, res, next) => {
  try { res.json(await hotelsService.getByTourism(parseInt(req.params.tourismId))); } catch (e) { next(e); }
});
app.get('/api/tourisms/:tourismId/roads', async (req, res, next) => {
  try { res.json(await roadsService.getByTourism(parseInt(req.params.tourismId))); } catch (e) { next(e); }
});

// Hotels
app.use('/api/hotels', hotelsController);

// Bookings
app.use('/api/bookings', require('./controllers/bookings.controller'));

// Roads
app.use('/api/roads', roadsController);

// Sub-resource: horse services under /api/roads/:roadId
app.get('/api/roads/:roadId/horse-services', async (req, res, next) => {
  try { res.json(await horseServicesService.getByRoad(parseInt(req.params.roadId))); } catch (e) { next(e); }
});

// Horse Services
app.use('/api/horse-services', horseServicesController);

// Language Guiders (also accessible as /api/guiders for public read)
app.use('/api/language-guiders', require('./controllers/language-guiders.controller'));
app.use('/api/guiders', require('./controllers/language-guiders.controller'));

// Ratings
app.use('/api/ratings', require('./controllers/ratings.controller'));

// Alias: POST /api/tourisms/:id/rate → POST /api/ratings/tourism
const ratingsService = require('./services/ratings.service');
const { authenticate: _authenticate } = require('./middleware/auth.middleware');
app.post('/api/tourisms/:tourismId/rate', _authenticate, async (req, res, next) => {
  try {
    const result = await ratingsService.rateTourism(parseInt(req.params.tourismId), req.user.userId, req.body.rating, req.body.comment);
    res.status(201).json(result);
  } catch (e) { next(e); }
});

// Map Points
app.use('/api/map-points', require('./controllers/map-points.controller'));

// Admin (all sub-resources consolidated under /api/admin)
app.use('/api/admin', require('./controllers/admin.controller'));

// Audit (authenticated, not admin-only)
app.use('/api/audit', require('./controllers/audit.controller'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'UP' }));

// Global error handler
const { globalExceptionHandler } = require('./exception/GlobalExceptionHandler');
app.use(globalExceptionHandler);

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

// Clean up any blob: URLs accidentally stored in the DB
async function cleanupBlobUrls() {
  const result = await prisma.tourismPlace.updateMany({
    where: { imageUrl: { startsWith: 'blob:' } },
    data: { imageUrl: null },
  });
  if (result.count > 0) {
    console.log(`✓ Cleaned up ${result.count} tourism place(s) with invalid blob: imageUrl`);
  }
}

// Start server
const certPath = path.resolve(__dirname, '../certificates/localhost.pem');
const keyPath = path.resolve(__dirname, '../certificates/localhost-key.pem');

async function start() {
  await initBookingStatuses();
  await cleanupBlobUrls();

  // Verify email service on startup
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;
    
    if (gmailUser && gmailPassword) {
      console.log(`✅ Email service ready (Gmail SMTP configured)`);
    } else {
      console.warn('⚠️  No email credentials set — emails will not be sent');
    }
  } catch (smtpErr) {
    console.error(`❌ Email service check failed: ${smtpErr.message}`);
  }

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

// Only start the server when run directly (not when required by tests)
if (require.main === module) {
  start().catch(err => { console.error('Startup error:', err); process.exit(1); });
}

// Export app for Supertest integration tests
module.exports = app;
