# North Wollo Tourism System - Complete Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Data Flow](#architecture--data-flow)
4. [Core Features Deep Dive](#core-features-deep-dive)
5. [Security Implementation](#security-implementation)
6. [Deployment Architecture](#deployment-architecture)
7. [File Communication Flows](#file-communication-flows)

---

## System Overview

**North Wollo Tourism System** is a full-stack web application for managing tourism destinations, hotels, and bookings in the North Wollo region of Ethiopia.

### Key Capabilities
- Multi-language support (Amharic, English, Russian, Japanese, Hindi)
- Real-time booking notifications
- Email verification and notifications
- Role-based access control (Admin, Hotel Owner, Tourist)
- File upload to cloud storage
- Rate limiting and security features
- Audit logging for compliance

### System URLs
- **Production Backend**: https://tourisms-p58j.onrender.com
- **Frontend**: https://newtwotourism.vercel.app
- **Repository**: https://github.com/dfdggfg6-star/tourismnortwollo.git

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose | Location |
|------------|---------|---------|----------|
| **Next.js** | 14.x | React framework with SSR | `frontend/` |
| **React** | 18.x | UI library | `frontend/src/` |
| **TypeScript** | 5.x | Type safety | All `.tsx` files |
| **Tailwind CSS** | 3.x | Styling | `frontend/tailwind.config.ts` |
| **i18next** | 23.x | Internationalization | `frontend/src/i18n/` |
| **Axios** | 1.x | HTTP client | `frontend/src/lib/api.ts` |

### Backend Technologies

| Technology | Version | Purpose | Location |
|------------|---------|---------|----------|
| **Node.js** | 20.x | Runtime environment | - |
| **Express.js** | 4.x | Web framework | `backend-nodejs/src/index.js` |
| **Prisma** | 6.x | ORM & database migrations | `backend-nodejs/prisma/` |
| **PostgreSQL** | 15.x | Database (Supabase) | Cloud hosted |
| **Redis** | 4.x | Caching & rate limiting | `backend-nodejs/src/lib/redis.js` |
| **JWT** | 9.x | Authentication | `backend-nodejs/src/middleware/auth.middleware.js` |

### Communication & Real-time

| Technology | Purpose | Implementation File |
|------------|---------|-------------------|
| **WebSocket (ws)** | Real-time booking updates | `backend-nodejs/src/services/ws.service.js` |
| **SSE (Server-Sent Events)** | One-way real-time updates | `backend-nodejs/src/controllers/sse.controller.js` |

### Email Service

| Technology | Purpose | Implementation File |
|------------|---------|-------------------|
| **Brevo (sib-api-v3-sdk)** | Transactional emails | `backend-nodejs/src/services/email-brevo.service.js` |
| **Nodemailer** | Fallback (not used in production) | `backend-nodejs/src/services/email-gmail.service.js` |

### File Upload & Storage

| Technology | Purpose | Implementation File |
|------------|---------|-------------------|
| **Multer** | File upload middleware | `backend-nodejs/src/controllers/admin.controller.js` |
| **Supabase Storage** | Cloud file storage | `backend-nodejs/src/services/supabase-storage.service.js` |

### Security Technologies

| Technology | Purpose | Implementation File |
|------------|---------|-------------------|
| **bcryptjs** | Password hashing | `backend-nodejs/src/services/auth.service.js` |
| **express-rate-limit** | Rate limiting | `backend-nodejs/src/middleware/rate-limit.middleware.js` |
| **rate-limit-redis** | Redis-based rate limiting | `backend-nodejs/src/middleware/rate-limit.middleware.js` |
| **CORS** | Cross-origin security | `backend-nodejs/src/index.js` |
| **Security Headers** | XSS, CSRF protection | `backend-nodejs/src/index.js` |

### Testing

| Technology | Purpose | Location |
|------------|---------|----------|
| **Jest** | Unit & integration testing | `backend-nodejs/tests/` |
| **Supertest** | API testing | `backend-nodejs/tests/integration/` |

---

## Architecture & Data Flow

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  (Next.js + React + TypeScript - Vercel)                    │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │   i18n   │  │   API    │   │
│  │          │  │          │  │          │  │  Client  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            │ WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API SERVER                        │
│           (Node.js + Express - Render)                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              MIDDLEWARE LAYER                         │  │
│  │  • CORS  • Auth  • Rate Limit  • Audit  • Validate  │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              CONTROLLERS                              │  │
│  │  Auth │ Users │ Tourism │ Hotels │ Bookings │ Admin │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              SERVICES (Business Logic)                │  │
│  │  Auth │ Bookings │ Email │ WebSocket │ SSE │ Upload │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              REPOSITORIES (Data Access)               │  │
│  │  User │ Booking │ Hotel │ Tourism │ Audit            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│  PostgreSQL  │ │  Redis   │ │  Brevo   │ │   Supabase   │
│  (Supabase)  │ │(Leapcell)│ │  Email   │ │   Storage    │
│   Database   │ │  Cache   │ │  Service │ │    (Files)   │
└──────────────┘ └──────────┘ └──────────┘ └──────────────┘
```

### Request Flow Example: User Registration

```
1. Frontend (registration form)
   ↓
2. POST /api/auth/register
   ↓
3. Rate Limit Middleware (checks Redis)
   ↓
4. Validation Middleware (validates input)
   ↓
5. Auth Controller (auth.controller.js)
   ↓
6. Auth Service (auth.service.js)
   ├─→ Hash password (bcryptjs)
   ├─→ Create user (User Repository)
   ├─→ Generate OTP
   └─→ Send email (Email Service → Brevo API)
   ↓
7. Audit Middleware (logs action)
   ↓
8. Response to Frontend
```

---

## Core Features Deep Dive

### 1. Authentication System

#### Files Involved

**Controller**: `backend-nodejs/src/controllers/auth.controller.js`
- Handles HTTP requests for login, register, verify email, reset password
- Routes: `/api/auth/register`, `/api/auth/login`, `/api/auth/verify-email`

**Service**: `backend-nodejs/src/services/auth.service.js`
- Business logic for authentication
- Password hashing with bcryptjs
- JWT token generation
- Email verification OTP generation

**Repository**: `backend-nodejs/src/repositories/auth.repository.js`
- Database operations for tokens
- Manages: EmailVerificationToken, PasswordResetToken, RefreshToken

**Middleware**: `backend-nodejs/src/middleware/auth.middleware.js`
- Verifies JWT tokens
- Extracts user from token
- Protects routes

#### Authentication Flow

```javascript
// 1. User Registration
POST /api/auth/register
Body: { username, email, password, fullName }

// auth.controller.js (Line 45-80)
router.post('/register', registerLimiter, validate(registerSchema), async (req, res, next) => {
  // Calls authService.register()
});

// auth.service.js (Line 120-180)
async register(username, email, password, fullName) {
  // 1. Check if user exists
  // 2. Hash password with bcryptjs
  const passwordHash = await bcrypt.hash(password, 12);
  
  // 3. Create user in database
  const user = await userRepository.create({...});
  
  // 4. Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 5. Save OTP token
  await authRepository.createEmailVerificationToken(user.id, otp, email);
  
  // 6. Send email via Brevo
  await emailService.sendEmailVerificationOtp(email, otp, 10, fullName);
}
```

#### JWT Token Structure

```javascript
// Token Payload (auth.service.js Line 250)
{
  userId: user.id,
  username: user.username,
  roles: ['TOURIST', 'ADMIN', 'HOTEL_OWNER']
}

// Token Expiration
Access Token: 15 minutes (JWT_EXPIRATION)
Refresh Token: 7 hours (JWT_REFRESH_EXPIRATION)
```

### 2. Email Service (Brevo Integration)

#### Why Brevo Instead of Gmail SMTP?

**Problem**: Render blocks SMTP ports (25, 587) which causes Gmail SMTP to fail.

**Solution**: Brevo uses REST API (HTTPS) instead of SMTP, which works on all hosting platforms.

#### Files Involved

**Main Service**: `backend-nodejs/src/services/email.service.js`
- Entry point that loads Brevo service
- Automatically uses Brevo when BREVO_API_KEY is set

**Brevo Implementation**: `backend-nodejs/src/services/email-brevo.service.js`
- Uses `sib-api-v3-sdk` package
- Sends transactional emails via Brevo API

**Gmail Fallback**: `backend-nodejs/src/services/email-gmail.service.js`
- Legacy SMTP implementation (not used in production)

#### Brevo Email Flow

```javascript
// email-brevo.service.js (Line 1-30)
const SibApiV3Sdk = require('sib-api-v3-sdk');

class EmailBrevoService {
  constructor() {
    // Initialize Brevo client
    this.client = SibApiV3Sdk.ApiClient.instance;
    this.client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
    this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  }

  async sendEmail(to, subject, html) {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = { 
      name: 'North Wollo Tourism', 
      email: 'abebemarye5381@gmail.com' 
    };
    sendSmtpEmail.to = [{ email: to }];
    
    // Send via Brevo API
    await this.apiInstance.sendTransacEmail(sendSmtpEmail);
  }
}
```

#### Email Types Sent

1. **Email Verification** (Line 60-85)
   - Sent on registration
   - Contains 6-digit OTP
   - Expires in 10 minutes

2. **Password Reset** (Line 40-58)
   - Sent on forgot password
   - Contains 6-digit OTP
   - Expires in 10 minutes

3. **Booking Notifications** (Line 90-150)
   - Booking accepted
   - Cost proposed
   - Payment received
   - Booking approved/rejected

### 3. File Upload System

#### Files Involved

**Multer Configuration**: `backend-nodejs/src/controllers/admin.controller.js` (Line 20-45)
**Supabase Service**: `backend-nodejs/src/services/supabase-storage.service.js`
**Admin Controller**: Handles upload endpoints

#### File Upload Flow: Tourism Place Image

```
1. Frontend sends multipart/form-data
   ↓
2. POST /api/admin/tourism/:id/upload-image
   ↓
3. Multer Middleware (admin.controller.js Line 30)
   - Accepts file from request
   - Validates file type (image/jpeg, image/png)
   - Limits file size (10MB)
   ↓
4. Admin Controller (Line 250-280)
   router.post('/tourism/:id/upload-image', 
     authenticate, 
     requireRole('ADMIN'),
     upload.single('image'),  // Multer processes file
     async (req, res) => {
       const file = req.file;  // File buffer in memory
       const tourismId = req.params.id;
       
       // Upload to Supabase
       const imageUrl = await supabaseStorage.uploadTourismImage(
         file.buffer, 
         file.originalname,
         tourismId
       );
       
       // Update database
       await prisma.tourismPlace.update({
         where: { id: tourismId },
         data: { imageUrl }
       });
     }
   );
   ↓
5. Supabase Storage Service (supabase-storage.service.js Line 40-70)
   async uploadTourismImage(buffer, filename, tourismId) {
     const supabase = createClient(
       process.env.SUPABASE_URL,
       process.env.SUPABASE_SERVICE_KEY
     );
     
     // Generate unique filename
     const uniqueName = `${Date.now()}-${filename}`;
     const path = `tourism-images/${tourismId}/${uniqueName}`;
     
     // Upload to Supabase Storage bucket
     const { data, error } = await supabase.storage
       .from('tourism-uploads')
       .upload(path, buffer, {
         contentType: 'image/jpeg',
         upsert: false
       });
     
     // Return public URL
     return supabase.storage
       .from('tourism-uploads')
       .getPublicUrl(path).data.publicUrl;
   }
   ↓
6. Response with image URL
   { imageUrl: "https://...supabase.co/storage/v1/object/public/..." }
```

#### Storage Buckets

- **tourism-uploads**: Tourism place images
- **hotel-uploads**: Hotel images  
- **booking-receipts**: Payment receipt uploads

### 4. Real-time Communication

#### WebSocket Implementation

**File**: `backend-nodejs/src/services/ws.service.js`

```javascript
// WebSocket Server Setup (Line 1-30)
const WebSocket = require('ws');

let wss = null;
const clients = new Map(); // userId -> WebSocket connection

function attachWebSocketServer(httpServer) {
  wss = new WebSocket.Server({ 
    server: httpServer,
    path: '/ws'  // WebSocket endpoint
  });
  
  wss.on('connection', (ws, req) => {
    // Extract userId from query params
    const userId = new URL(req.url, 'http://localhost').searchParams.get('userId');
    
    if (userId) {
      clients.set(userId, ws);
      console.log(`WebSocket client connected: ${userId}`);
    }
    
    ws.on('close', () => {
      clients.delete(userId);
    });
  });
}

// Send notification to specific user
function notifyUser(userId, message) {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
```

#### WebSocket Usage: Booking Notifications

**File**: `backend-nodejs/src/services/bookings.service.js` (Line 180-200)

```javascript
// When booking status changes
async updateBookingStatus(bookingId, newStatus) {
  // Update database
  const booking = await bookingRepository.updateStatus(bookingId, newStatus);
  
  // Send email notification
  await emailService.sendBookingAcceptedNotification(...);
  
  // Send WebSocket notification to user
  wsService.notifyUser(booking.userId, {
    type: 'BOOKING_UPDATE',
    bookingId: booking.id,
    status: newStatus,
    message: 'Your booking has been updated'
  });
  
  // Also send SSE notification
  sseService.sendToUser(booking.userId, {
    event: 'booking-update',
    data: booking
  });
}
```

#### SSE (Server-Sent Events) Implementation

**File**: `backend-nodejs/src/controllers/sse.controller.js`

```javascript
// SSE Endpoint (Line 10-50)
router.get('/bookings', authenticate, (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const userId = req.user.userId;
  
  // Register client
  sseService.addClient(userId, res);
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  
  // Cleanup on disconnect
  req.on('close', () => {
    sseService.removeClient(userId);
  });
});
```

**Service**: `backend-nodejs/src/services/sse.service.js`

```javascript
const clients = new Map(); // userId -> Response object

function sendToUser(userId, data) {
  const res = clients.get(userId);
  if (res) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}
```

### 5. Rate Limiting System

#### Files Involved

**Middleware**: `backend-nodejs/src/middleware/rate-limit.middleware.js`
**Redis Client**: `backend-nodejs/src/lib/redis.js`

#### Rate Limiting Configuration

```javascript
// rate-limit.middleware.js (Line 1-100)
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient, isRedisConnected } = require('../lib/redis');

// Global rate limiter (1000 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_GLOBAL_MAX || 1000,
  
  // Use Redis if available, otherwise in-memory
  store: isRedisConnected() 
    ? new RedisStore({ client: getRedisClient() })
    : undefined,
    
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Login rate limiter (5 attempts per 15 minutes)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.RATE_LIMIT_LOGIN_MAX || 5,
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'Too many login attempts, please try again later'
});

// Registration rate limiter (3 per hour)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.RATE_LIMIT_REGISTER_MAX || 3,
  message: 'Too many registration attempts'
});
```

#### Rate Limit Application

```javascript
// index.js (Line 180)
app.use('/api', globalLimiter); // Applied to all API routes

// auth.controller.js
router.post('/login', loginLimiter, ...);
router.post('/register', registerLimiter, ...);
router.post('/reset-password', passwordResetLimiter, ...);

// bookings.controller.js
router.post('/', bookingLimiter, ...);
```

#### Redis Connection with Fallback

```javascript
// redis.js (Line 40-80)
async function initializeRedis() {
  try {
    const client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        tls: process.env.REDIS_TLS === 'true',
        reconnectStrategy: (retries) => {
          if (retries > 10) return new Error('Max retries');
          return Math.min(retries * 500, 3000); // Exponential backoff
        }
      },
      password: process.env.REDIS_PASSWORD
    });
    
    await client.connect();
    return client;
  } catch (error) {
    console.error('Redis connection failed, using in-memory fallback');
    return null; // Rate limiter will use in-memory store
  }
}
```

### 6. Security Implementation

#### Security Headers

**File**: `backend-nodejs/src/index.js` (Line 20-35)

```javascript
// Security headers middleware
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
  );
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // HTTPS Strict Transport Security (production only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  next();
});
```

#### CORS Configuration

```javascript
// index.js (Line 40-48)
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://newtwotourism.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### Password Security

**File**: `backend-nodejs/src/services/auth.service.js`

```javascript
// Password hashing (Line 130)
const bcrypt = require('bcryptjs');

// Hash password with 12 rounds (very secure)
const passwordHash = await bcrypt.hash(password, 12);

// Verify password (Line 200)
const isValid = await bcrypt.compare(password, user.passwordHash);
```

#### Account Lockout Protection

```javascript
// auth.service.js (Line 220-260)
async login(username, password) {
  // Check if account is locked
  const lockout = await authRepository.getAccountLockout(user.id);
  if (lockout && lockout.lockedUntil > new Date()) {
    throw new Error('Account is locked due to too many failed attempts');
  }
  
  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  
  if (!isValid) {
    // Record failed attempt
    await authRepository.recordLoginAttempt(user.id, false, req.ip);
    
    // Check failed attempts in last 15 minutes
    const recentAttempts = await authRepository.getRecentFailedAttempts(
      user.id, 
      15 * 60 * 1000
    );
    
    // Lock account after 5 failed attempts
    if (recentAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min
      await authRepository.lockAccount(user.id, lockUntil);
      throw new Error('Account locked due to too many failed attempts');
    }
    
    throw new Error('Invalid credentials');
  }
  
  // Record successful login
  await authRepository.recordLoginAttempt(user.id, true, req.ip);
}
```

### 7. Audit Logging System

#### Files Involved

**Middleware**: `backend-nodejs/src/middleware/audit.middleware.js`
**Repository**: `backend-nodejs/src/repositories/audit.repository.js`
**Controller**: `backend-nodejs/src/controllers/audit.controller.js`

#### Automatic Audit Logging

```javascript
// audit.middleware.js (Line 1-80)
const auditRepository = require('../repositories/audit.repository');

function auditMiddleware(req, res, next) {
  // Only log state-changing operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }
  
  // Skip if audit is disabled
  if (process.env.AUDIT_ENABLED !== 'true') {
    return next();
  }
  
  // Capture original res.json
  const originalJson = res.json.bind(res);
  
  res.json = function(data) {
    // Log after response is sent
    setImmediate(async () => {
      try {
        const action = determineAction(req.method, req.path);
        const entityType = extractEntityType(req.path);
        const entityId = extractEntityId(req.path, req.body);
        
        await auditRepository.createAuditLog({
          userId: req.user?.userId,
          action,
          entityType,
          entityId,
          changes: JSON.stringify(req.body),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: res.statusCode < 400 ? 'SUCCESS' : 'FAILURE'
        });
      } catch (error) {
        console.error('Audit logging failed:', error);
      }
    });
    
    return originalJson(data);
  };
  
  next();
}

// Applied globally in index.js (Line 60)
app.use(auditMiddleware);
```

#### Audit Actions Tracked

```javascript
// Enum in schema.prisma
enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  REGISTER
  PASSWORD_RESET_REQUEST
  PASSWORD_RESET_CONFIRM
  EMAIL_VERIFICATION_SEND
  EMAIL_VERIFICATION_CONFIRM
  ACCOUNT_LOCKED
  ACCOUNT_UNLOCKED
  AUTHORIZATION_CHECK
  TOKEN_REFRESH
  SESSION_EXPIRED
  EXPORT
  IMPORT
}
```

#### Viewing Audit Logs

```javascript
// audit.controller.js (Line 20-50)
router.get('/', authenticate, async (req, res) => {
  const { startDate, endDate, action, entityType, userId } = req.query;
  
  const logs = await auditRepository.getAuditLogs({
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    action,
    entityType,
    userId: userId ? parseInt(userId) : undefined,
    limit: 100
  });
  
  res.json(logs);
});
```

---

## Deployment Architecture

### Why Render for Backend?

**Render** is chosen for backend deployment because:

1. **Free Tier**: Suitable for development/demo
2. **Automatic Deployments**: Git push triggers deployment
3. **Environment Variables**: Easy configuration
4. **Persistent Disk**: For file uploads (1GB free)
5. **Health Checks**: Automatic monitoring
6. **HTTPS**: Free SSL certificates

### Render Configuration

**File**: `render.yaml` (Blueprint configuration)

```yaml
services:
  - type: web
    name: tourism-backend
    runtime: node
    region: oregon
    plan: free
    branch: main
    rootDir: backend-nodejs
    
    # Build command runs on deployment
    buildCommand: npm install && npx prisma generate && npx prisma migrate deploy
    
    # Start command runs the server
    startCommand: npm start
    
    # Health check endpoint
    healthCheckPath: /health
    
    # Environment variables
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: BREVO_API_KEY
        sync: false  # Set manually in dashboard
      # ... other env vars
    
    # Persistent disk for uploads
    disk:
      name: uploads
      mountPath: /opt/render/project/src/uploads
      sizeGB: 1
```

### Deployment Process

```
1. Developer pushes code to GitHub
   ↓
2. Render detects new commit
   ↓
3. Render clones repository
   ↓
4. Runs buildCommand:
   - npm install (installs dependencies)
   - npx prisma generate (generates Prisma client)
   - npx prisma migrate deploy (runs database migrations)
   ↓
5. Runs startCommand:
   - npm start → node src/index.js
   ↓
6. Server starts on PORT 3001
   ↓
7. Render performs health check:
   - GET /health
   - Expects 200 OK response
   ↓
8. If healthy, routes traffic to new deployment
   ↓
9. Old deployment is shut down
```

### Database Migrations on Deployment

**File**: `backend-nodejs/prisma/schema.prisma`

```prisma
// Prisma schema defines database structure
model User {
  id           Int     @id @default(autoincrement())
  username     String  @unique
  passwordHash String
  email        String? @unique
  // ... other fields
}
```

**Migration Process**:

```bash
# During build (render.yaml buildCommand)
npx prisma migrate deploy

# This runs all pending migrations in prisma/migrations/
# Example: 20260319_add_hero_images/migration.sql
```

### Why Prisma Binary Targets?

**File**: `backend-nodejs/prisma/schema.prisma` (Line 3-5)

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x", "linux-musl-openssl-3.0.x"]
}
```

**Explanation**:
- `native`: For local development (Windows/Mac)
- `debian-openssl-3.0.x`: For Render (uses Debian Linux)
- `linux-musl-openssl-3.0.x`: For Alpine Linux (Docker)

Without correct binary targets, Prisma fails with:
```
Error: Unknown binary target linux-openssl-1.1.x
```

---

## File Communication Flows

### Complete CRUD Flow: Creating a Hotel Booking

This demonstrates how all components work together from frontend to database.

#### Step 1: Frontend - User Creates Booking

**File**: `frontend/src/app/bookings/page.tsx` (Line 100-150)

```typescript
// User fills booking form
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  const bookingData = {
    hotelId: selectedHotel.id,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    numberOfGuests: guestCount,
    numberOfRooms: roomCount,
    specialRequests: requests,
    clientPhone: phone,
    clientEmail: email
  };
  
  try {
    // Call API
    const response = await api.post('/api/bookings', bookingData);
    
    // Show success message
    toast.success('Booking request sent!');
    
    // Redirect to bookings page
    router.push('/bookings');
  } catch (error) {
    toast.error(error.response?.data?.message || 'Booking failed');
  }
};
```

**API Client**: `frontend/src/lib/api.ts` (Line 1-30)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://tourisms-p58j.onrender.com',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

#### Step 2: Backend - Request Arrives

**Entry Point**: `backend-nodejs/src/index.js` (Line 100)

```javascript
// Request flow:
// 1. CORS middleware (allows frontend origin)
// 2. JSON body parser
// 3. Trust proxy (gets real IP from Render)
// 4. Security headers
// 5. Audit middleware (logs the request)
// 6. Global rate limiter (checks Redis)
// 7. Routes to bookings controller

app.use('/api/bookings', require('./controllers/bookings.controller'));
```

#### Step 3: Controller - Validates & Routes

**File**: `backend-nodejs/src/controllers/bookings.controller.js` (Line 40-80)

```javascript
const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { createBookingSchema } = require('../dto/booking.dto');
const bookingsService = require('../services/bookings.service');
const { bookingLimiter } = require('../middleware/rate-limit.middleware');

// POST /api/bookings - Create new booking
router.post('/', 
  authenticate,              // Verify JWT token
  bookingLimiter,           // Rate limit: 10 per 15 min
  validate(createBookingSchema),  // Validate input
  async (req, res, next) => {
    try {
      const userId = req.user.userId;  // From JWT token
      const bookingData = req.body;
      
      // Call service layer
      const booking = await bookingsService.createBooking(userId, bookingData);
      
      res.status(201).json(booking);
    } catch (error) {
      next(error);  // Pass to error handler
    }
  }
);

module.exports = router;
```

#### Step 4: DTO Validation

**File**: `backend-nodejs/src/dto/booking.dto.js` (Line 1-40)

```javascript
const Joi = require('joi');

const createBookingSchema = Joi.object({
  hotelId: Joi.number().integer().positive().required(),
  checkIn: Joi.date().iso().min('now').required(),
  checkOut: Joi.date().iso().greater(Joi.ref('checkIn')).required(),
  numberOfGuests: Joi.number().integer().min(1).max(20).required(),
  numberOfRooms: Joi.number().integer().min(1).max(10).optional(),
  specialRequests: Joi.string().max(500).optional(),
  clientPhone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).optional(),
  clientEmail: Joi.string().email().optional()
});

module.exports = { createBookingSchema };
```

#### Step 5: Service - Business Logic

**File**: `backend-nodejs/src/services/bookings.service.js` (Line 50-150)

```javascript
const { bookingRepository } = require('../repositories');
const emailService = require('./email.service');
const wsService = require('./ws.service');
const sseService = require('./sse.service');

class BookingsService {
  async createBooking(userId, bookingData) {
    // 1. Verify hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: bookingData.hotelId },
      include: { owner: true }
    });
    
    if (!hotel) {
      throw new Error('Hotel not found');
    }
    
    if (!hotel.active) {
      throw new Error('Hotel is not accepting bookings');
    }
    
    // 2. Check for overlapping bookings
    const overlapping = await bookingRepository.findOverlapping(
      bookingData.hotelId,
      bookingData.checkIn,
      bookingData.checkOut
    );
    
    if (overlapping.length > 0) {
      throw new Error('Hotel is fully booked for selected dates');
    }
    
    // 3. Get REQUESTED status
    const requestedStatus = await prisma.bookingStatusEntity.findUnique({
      where: { name: 'REQUESTED' }
    });
    
    // 4. Create booking in database
    const booking = await bookingRepository.create({
      userId,
      hotelId: bookingData.hotelId,
      checkIn: new Date(bookingData.checkIn),
      checkOut: new Date(bookingData.checkOut),
      numberOfGuests: bookingData.numberOfGuests,
      numberOfRooms: bookingData.numberOfRooms,
      specialRequests: bookingData.specialRequests,
      clientPhone: bookingData.clientPhone,
      clientEmail: bookingData.clientEmail,
      statusId: requestedStatus.id
    });
    
    // 5. Send email to hotel owner
    if (hotel.owner?.email) {
      await emailService.sendEmail(
        hotel.owner.email,
        `New Booking Request #${booking.id}`,
        `You have a new booking request for ${hotel.name}...`
      );
    }
    
    // 6. Send real-time notification to hotel owner
    if (hotel.ownerId) {
      wsService.notifyUser(hotel.ownerId, {
        type: 'NEW_BOOKING',
        bookingId: booking.id,
        hotelName: hotel.name
      });
      
      sseService.sendToUser(hotel.ownerId, {
        event: 'new-booking',
        data: booking
      });
    }
    
    // 7. Return booking with relations
    return bookingRepository.findById(booking.id);
  }
}

module.exports = new BookingsService();
```

#### Step 6: Repository - Database Access

**File**: `backend-nodejs/src/repositories/booking.repository.js` (Line 1-100)

```javascript
const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

class BookingRepository extends BaseRepository {
  constructor() {
    super(prisma.hotelBooking);
  }
  
  async create(data) {
    return await prisma.hotelBooking.create({
      data: {
        userId: data.userId,
        hotelId: data.hotelId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        numberOfGuests: data.numberOfGuests,
        numberOfRooms: data.numberOfRooms,
        specialRequests: data.specialRequests,
        clientPhone: data.clientPhone,
        clientEmail: data.clientEmail,
        statusId: data.statusId
      }
    });
  }
  
  async findById(id) {
    return await prisma.hotelBooking.findUnique({
      where: { id },
      include: {
        hotel: {
          include: {
            owner: {
              select: { id: true, username: true, email: true }
            }
          }
        },
        user: {
          select: { id: true, username: true, email: true }
        },
        status: true,
        messages: {
          include: {
            user: {
              select: { id: true, username: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }
  
  async findOverlapping(hotelId, checkIn, checkOut) {
    return await prisma.hotelBooking.findMany({
      where: {
        hotelId,
        OR: [
          {
            checkIn: { lte: checkOut },
            checkOut: { gte: checkIn }
          }
        ],
        status: {
          name: { in: ['REQUESTED', 'OWNER_ACCEPTED', 'PAID', 'APPROVED'] }
        }
      }
    });
  }
}

module.exports = new BookingRepository();
```

#### Step 7: Prisma - SQL Generation

**Prisma Client** (generated from schema.prisma)

```javascript
// prisma.hotelBooking.create() generates SQL:
INSERT INTO "hotel_bookings" (
  "userId", "hotelId", "checkIn", "checkOut",
  "numberOfGuests", "numberOfRooms", "specialRequests",
  "clientPhone", "clientEmail", "statusId",
  "createdAt", "updatedAt"
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
) RETURNING *;
```

#### Step 8: Database - PostgreSQL (Supabase)

```sql
-- Executed on Supabase PostgreSQL
-- Transaction ensures data consistency
BEGIN;

-- Insert booking
INSERT INTO hotel_bookings (...) VALUES (...);

-- Audit log (from audit middleware)
INSERT INTO audit_log_entries (
  "userId", "action", "entityType", "entityId",
  "changes", "ipAddress", "userAgent", "status"
) VALUES (
  123, 'CREATE', 'BOOKING', 456,
  '{"hotelId":10,"checkIn":"2026-06-01",...}',
  '192.168.1.1', 'Mozilla/5.0...', 'SUCCESS'
);

COMMIT;
```

#### Step 9: Response Flow Back

```
Database → Prisma → Repository → Service → Controller → Express → Response

{
  "id": 456,
  "hotelId": 10,
  "userId": 123,
  "checkIn": "2026-06-01T00:00:00.000Z",
  "checkOut": "2026-06-05T00:00:00.000Z",
  "numberOfGuests": 2,
  "numberOfRooms": 1,
  "status": {
    "id": 1,
    "name": "REQUESTED"
  },
  "hotel": {
    "id": 10,
    "name": "Grand Hotel",
    "owner": {
      "id": 50,
      "username": "hotelowner",
      "email": "owner@hotel.com"
    }
  },
  "createdAt": "2026-05-24T21:00:00.000Z"
}
```

#### Step 10: Parallel Notifications

While response is being sent, these happen asynchronously:

```javascript
// 1. Email via Brevo API
emailService.sendEmail(owner.email, ...) 
  → Brevo API (HTTPS)
  → Email delivered to owner's inbox

// 2. WebSocket notification
wsService.notifyUser(ownerId, {...})
  → WebSocket connection
  → Owner's browser receives real-time update

// 3. SSE notification
sseService.sendToUser(ownerId, {...})
  → SSE connection
  → Owner's dashboard updates automatically
```

---

### Complete Flow: Hotel Owner Accepts Booking

#### Frontend: Owner Dashboard

**File**: `frontend/src/app/owner/bookings/page.tsx` (Line 200-250)

```typescript
const handleAcceptBooking = async (bookingId: number) => {
  try {
    // PATCH /api/bookings/:id/accept
    await api.patch(`/api/bookings/${bookingId}/accept`);
    
    toast.success('Booking accepted!');
    
    // Refresh bookings list
    fetchBookings();
  } catch (error) {
    toast.error('Failed to accept booking');
  }
};
```

#### Backend: Status Update Flow

**Controller**: `backend-nodejs/src/controllers/bookings.controller.js` (Line 150)

```javascript
router.patch('/:id/accept',
  authenticate,
  requireRole('HOTEL_OWNER'),
  async (req, res, next) => {
    try {
      const bookingId = parseInt(req.params.id);
      const ownerId = req.user.userId;
      
      // Verify owner owns this hotel
      const booking = await bookingsService.verifyOwnership(bookingId, ownerId);
      
      // Update status
      const updated = await bookingsService.acceptBooking(bookingId);
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);
```

**Service**: `backend-nodejs/src/services/bookings.service.js` (Line 200-280)

```javascript
async acceptBooking(bookingId) {
  // 1. Get current booking
  const booking = await bookingRepository.findById(bookingId);
  
  if (booking.status.name !== 'REQUESTED') {
    throw new Error('Booking cannot be accepted in current status');
  }
  
  // 2. Get OWNER_ACCEPTED status
  const acceptedStatus = await prisma.bookingStatusEntity.findUnique({
    where: { name: 'OWNER_ACCEPTED' }
  });
  
  // 3. Update booking status
  const updated = await bookingRepository.updateStatus(
    bookingId, 
    acceptedStatus.id
  );
  
  // 4. Send email to customer via Brevo
  const customer = booking.user;
  const hotel = booking.hotel;
  
  await emailService.sendBookingAcceptedNotification(
    customer.email,
    hotel.name,
    bookingId
  );
  
  // 5. Send WebSocket notification to customer
  wsService.notifyUser(customer.id, {
    type: 'BOOKING_ACCEPTED',
    bookingId: bookingId,
    hotelName: hotel.name,
    message: `Your booking at ${hotel.name} has been accepted!`
  });
  
  // 6. Send SSE notification
  sseService.sendToUser(customer.id, {
    event: 'booking-status-changed',
    data: {
      bookingId,
      newStatus: 'OWNER_ACCEPTED',
      hotel: hotel.name
    }
  });
  
  // 7. Return updated booking
  return bookingRepository.findById(bookingId);
}
```

**Email Service**: `backend-nodejs/src/services/email-brevo.service.js` (Line 90-120)

```javascript
async sendBookingAcceptedNotification(email, hotelName, bookingId) {
  const appUrl = process.env.FRONTEND_URL;
  
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <h2 style="color:#1d4ed8;">Your Booking Request Was Accepted</h2>
      <p>Great news! <strong>${hotelName}</strong> has accepted your booking request.</p>
      <p><strong>Booking ID:</strong> #${bookingId}</p>
      <a href="${appUrl}/bookings" 
         style="display:inline-block;background:#1d4ed8;color:#fff;
                padding:12px 24px;border-radius:8px;text-decoration:none;">
        View My Bookings
      </a>
    </div>
  `;
  
  return this.sendEmail(
    email,
    `Booking #${bookingId} Accepted — ${hotelName}`,
    html
  );
}

async sendEmail(to, subject, html) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = { 
    name: 'North Wollo Tourism', 
    email: process.env.BREVO_SENDER_EMAIL 
  };
  sendSmtpEmail.to = [{ email: to }];
  
  // Send via Brevo API
  const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
  
  console.log(`✅ Email sent via Brevo to ${to}: ${result.messageId}`);
  return true;
}
```

---

## Testing Strategy

### Unit Tests

**File**: `backend-nodejs/tests/unit/auth.service.test.js`

```javascript
const authService = require('../../src/services/auth.service');
const { userRepository } = require('../../src/repositories');

// Mock dependencies
jest.mock('../../src/repositories');
jest.mock('../../src/services/email.service');

describe('Auth Service - Registration', () => {
  test('should hash password before saving', async () => {
    const password = 'TestPassword123!';
    
    await authService.register('testuser', 'test@example.com', password, 'Test User');
    
    // Verify password was hashed
    const createCall = userRepository.create.mock.calls[0][0];
    expect(createCall.passwordHash).not.toBe(password);
    expect(createCall.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt format
  });
  
  test('should generate 6-digit OTP', async () => {
    await authService.register('testuser', 'test@example.com', 'pass', 'Test');
    
    const otpCall = authRepository.createEmailVerificationToken.mock.calls[0];
    const otp = otpCall[1];
    
    expect(otp).toMatch(/^\d{6}$/);
  });
});
```

### Integration Tests

**File**: `backend-nodejs/tests/integration/booking.integration.test.js`

```javascript
const request = require('supertest');
const app = require('../../src/index');

describe('Booking API Integration', () => {
  let authToken;
  let hotelId;
  
  beforeAll(async () => {
    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'testpass' });
    
    authToken = loginRes.body.accessToken;
    
    // Create test hotel
    const hotelRes = await request(app)
      .post('/api/admin/hotels')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Hotel', starRating: 4 });
    
    hotelId = hotelRes.body.id;
  });
  
  test('should create booking with valid data', async () => {
    const bookingData = {
      hotelId,
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      numberOfGuests: 2,
      numberOfRooms: 1
    };
    
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send(bookingData);
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.status.name).toBe('REQUESTED');
  });
  
  test('should reject booking with past dates', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        hotelId,
        checkIn: '2020-01-01',
        checkOut: '2020-01-05',
        numberOfGuests: 2
      });
    
    expect(res.status).toBe(400);
  });
});
```

---

## Environment Variables Reference

### Required for Production

```bash
# Database (Supabase)
DATABASE_URL=postgresql://user:pass@host:5432/db
DIRECT_URL=postgresql://user:pass@host:5432/db

# JWT Authentication
JWT_SECRET=your-very-long-secret-key-min-64-chars
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7h

# Email (Brevo)
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=your-verified-email@domain.com
BREVO_SENDER_NAME=North Wollo Tourism

# Redis (Rate Limiting)
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...

# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend.vercel.app

# File Upload
UPLOAD_DIR=/opt/render/project/src/uploads
MAX_FILE_SIZE=10485760

# Security
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=10
MAX_IP_ATTEMPTS_PER_HOUR=100

# Audit
AUDIT_ENABLED=true
AUDIT_RETENTION_DAYS=90

# Rate Limiting
RATE_LIMIT_GLOBAL_MAX=1000
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_REGISTER_MAX=3
RATE_LIMIT_PASSWORD_RESET_MAX=3
RATE_LIMIT_EMAIL_VERIFICATION_MAX=5
RATE_LIMIT_BOOKING_MAX=10
RATE_LIMIT_FILE_UPLOAD_MAX=20
RATE_LIMIT_RATING_MAX=10
RATE_LIMIT_ADMIN_MAX=500
```

---

## Common Interview Questions & Answers

### Q1: Why did you choose this tech stack?

**Answer**: 
- **Next.js/React**: Modern, SEO-friendly, great developer experience
- **Node.js/Express**: JavaScript full-stack, large ecosystem, easy to deploy
- **PostgreSQL**: ACID compliance for financial transactions (bookings), strong data integrity
- **Prisma**: Type-safe database access, automatic migrations, great DX
- **Redis**: Fast in-memory caching for rate limiting, reduces database load
- **Brevo**: Reliable email delivery, works on all hosting platforms (no SMTP port issues)
- **Supabase**: Managed PostgreSQL + file storage, generous free tier

### Q2: How do you handle security?

**Answer**:
1. **Authentication**: JWT tokens with short expiration (15min access, 7h refresh)
2. **Password Security**: bcrypt with 12 rounds (very secure)
3. **Rate Limiting**: Redis-based, prevents brute force attacks
4. **Account Lockout**: 5 failed attempts = 15 min lockout
5. **Security Headers**: XSS, clickjacking, MIME sniffing protection
6. **CORS**: Restricted to frontend domain only
7. **Input Validation**: Joi schemas validate all inputs
8. **SQL Injection**: Prisma uses parameterized queries
9. **Audit Logging**: All actions logged for compliance
10. **HTTPS**: All traffic encrypted (Render provides free SSL)

### Q3: How does real-time notification work?

**Answer**:
We use **two complementary approaches**:

1. **WebSocket** (`ws` package):
   - Bidirectional, persistent connection
   - Used for instant notifications
   - Client connects: `ws://backend/ws?userId=123`
   - Server pushes: `{ type: 'BOOKING_UPDATE', data: {...} }`

2. **SSE (Server-Sent Events)**:
   - Unidirectional, HTTP-based
   - Simpler than WebSocket, auto-reconnects
   - Client connects: `GET /api/sse/bookings`
   - Server pushes: `data: {"event":"booking-update"}\n\n`

**Why both?**
- WebSocket for critical real-time features
- SSE as fallback for restrictive networks
- Both work together for maximum reliability

### Q4: How do you handle file uploads?

**Answer**:
**Flow**: Browser → Multer → Memory → Supabase Storage → Database URL

1. **Multer** receives file in memory (not disk)
2. **Validates**: file type, size (max 10MB)
3. **Uploads to Supabase Storage** via SDK
4. **Stores public URL** in PostgreSQL
5. **Serves via CDN**: Fast global delivery

**Why Supabase Storage?**
- Render's disk is ephemeral (resets on deploy)
- Supabase provides persistent, scalable storage
- Built-in CDN for fast image delivery
- Free tier: 1GB storage

### Q5: What happens if Redis goes down?

**Answer**:
**Graceful degradation** - system continues working:

1. Rate limiter detects Redis unavailable
2. Automatically falls back to **in-memory store**
3. Rate limiting still works (per-instance)
4. No errors shown to users
5. Redis reconnects automatically (exponential backoff)

**Code** (`rate-limit.middleware.js`):
```javascript
store: isRedisConnected() 
  ? new RedisStore({ client: getRedisClient() })
  : undefined  // Uses in-memory fallback
```

### Q6: How do you ensure email delivery?

**Answer**:
1. **Brevo API** (not SMTP): Works on all hosting platforms
2. **Retry logic**: Brevo handles retries automatically
3. **Logging**: Every email logged with message ID
4. **Error handling**: Failures logged but don't block user actions
5. **Verification**: Sender email verified in Brevo dashboard
6. **Monitoring**: Check Brevo dashboard for delivery stats

**Why not Gmail SMTP?**
- Render blocks SMTP ports (25, 587)
- Gmail has strict rate limits
- Brevo API is more reliable for transactional emails

### Q7: How do you handle database migrations in production?

**Answer**:
**Automated via Render deployment**:

1. Developer creates migration locally:
   ```bash
   npx prisma migrate dev --name add_new_field
   ```

2. Migration file created in `prisma/migrations/`

3. Commit and push to GitHub

4. Render deployment runs:
   ```bash
   npx prisma migrate deploy
   ```

5. Applies only **pending migrations** (safe, idempotent)

6. If migration fails, deployment stops (rollback)

**Zero-downtime strategy**:
- Additive changes first (add columns)
- Deploy code that works with both old/new schema
- Remove old columns in next migration

### Q8: How do you prevent SQL injection?

**Answer**:
**Prisma ORM** prevents SQL injection automatically:

```javascript
// ❌ Vulnerable (raw SQL)
await prisma.$queryRaw(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ Safe (Prisma)
await prisma.user.findUnique({ where: { id: userId } });

// ✅ Safe (parameterized)
await prisma.$queryRaw`SELECT * FROM users WHERE id = ${userId}`;
```

Prisma uses **parameterized queries** internally:
```sql
-- Generated SQL
SELECT * FROM users WHERE id = $1;
-- Parameters: [123]
```

### Q9: How do you handle concurrent bookings?

**Answer**:
**Database-level locking** prevents double-booking:

```javascript
// 1. Check for overlapping bookings
const overlapping = await prisma.hotelBooking.findMany({
  where: {
    hotelId,
    checkIn: { lte: checkOut },
    checkOut: { gte: checkIn },
    status: { name: { in: ['APPROVED', 'PAID'] } }
  }
});

if (overlapping.length > 0) {
  throw new Error('Hotel fully booked');
}

// 2. Create booking in transaction
await prisma.$transaction(async (tx) => {
  // Re-check inside transaction (prevents race condition)
  const recheck = await tx.hotelBooking.findMany({...});
  if (recheck.length > 0) throw new Error('Booked');
  
  // Create booking
  await tx.hotelBooking.create({...});
});
```

**PostgreSQL transaction** ensures atomicity.

### Q10: How do you monitor the system in production?

**Answer**:
1. **Render Dashboard**: CPU, memory, response times
2. **Health Check**: `/health` endpoint monitored every 30s
3. **Logs**: Structured logging with timestamps
4. **Audit Logs**: All actions tracked in database
5. **Email Logs**: Brevo dashboard shows delivery status
6. **Error Tracking**: Global error handler logs all errors
7. **Rate Limit Monitoring**: Redis metrics

**Health Check** (`index.js`):
```javascript
app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    redis: isRedisConnected() ? 'connected' : 'disconnected'
  });
});
```

---

## Performance Optimizations

### 1. Database Query Optimization

```javascript
// ❌ N+1 Query Problem
const bookings = await prisma.hotelBooking.findMany();
for (const booking of bookings) {
  booking.hotel = await prisma.hotel.findUnique({ where: { id: booking.hotelId } });
}

// ✅ Optimized with Include
const bookings = await prisma.hotelBooking.findMany({
  include: {
    hotel: true,
    user: { select: { id: true, username: true } },
    status: true
  }
});
// Single query with JOINs
```

### 2. Redis Caching

```javascript
// Cache frequently accessed data
async function getTourismPlace(id) {
  const cacheKey = `tourism:${id}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from database
  const place = await prisma.tourismPlace.findUnique({ where: { id } });
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(place));
  
  return place;
}
```

### 3. Pagination

```javascript
// Limit results to prevent memory issues
router.get('/api/bookings', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const [bookings, total] = await Promise.all([
    prisma.hotelBooking.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.hotelBooking.count()
  ]);
  
  res.json({
    data: bookings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
```

### 4. Image Optimization

- **Supabase Storage**: Automatic CDN caching
- **Lazy Loading**: Images load on scroll (frontend)
- **Compression**: Images compressed before upload
- **Responsive**: Multiple sizes for different devices

---

## Troubleshooting Guide

### Issue: "Redis connection failed"

**Cause**: External Redis (Leapcell) unstable from Render

**Solution**: System auto-reconnects, uses in-memory fallback

**Fix**: Consider Render's Redis service for better stability

### Issue: "Prisma binary not found"

**Cause**: Wrong binary target for deployment platform

**Solution**: Update `prisma/schema.prisma`:
```prisma
generator client {
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

### Issue: "Email not sending"

**Cause**: BREVO_API_KEY not set or sender not verified

**Solution**:
1. Check environment variable in Render
2. Verify sender email in Brevo dashboard
3. Check Brevo logs for errors

### Issue: "File upload fails"

**Cause**: Supabase credentials missing or bucket doesn't exist

**Solution**:
1. Verify SUPABASE_URL and SUPABASE_SERVICE_KEY
2. Create storage bucket in Supabase dashboard
3. Set bucket to public access

---

## Conclusion

This system demonstrates:
- ✅ **Modern full-stack architecture**
- ✅ **Production-ready security**
- ✅ **Real-time communication**
- ✅ **Scalable design patterns**
- ✅ **Comprehensive testing**
- ✅ **Cloud-native deployment**

**Key Strengths**:
1. Separation of concerns (Controller → Service → Repository)
2. Type safety (TypeScript frontend, Prisma backend)
3. Security-first approach (JWT, rate limiting, audit logs)
4. Real-time features (WebSocket, SSE)
5. Reliable email delivery (Brevo API)
6. Cloud storage (Supabase)
7. Automated deployments (Render)

**Production URLs**:
- Backend: https://tourisms-p58j.onrender.com
- Frontend: https://newtwotourism.vercel.app
- Repository: https://github.com/dfdggfg6-star/tourismnortwollo.git

---

*Last Updated: May 24, 2026*
