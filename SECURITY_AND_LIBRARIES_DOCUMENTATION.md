# Security Features & Libraries Documentation

This document provides a comprehensive overview of all security features, libraries, and their implementations in the Tourism System.

---

## Table of Contents
1. [Backend Security Libraries](#backend-security-libraries)
2. [Frontend State Management](#frontend-state-management)
3. [Security Features](#security-features)
4. [File Upload Management](#file-upload-management)
5. [Email Services](#email-services)

---

## Backend Security Libraries

### 1. **CORS (Cross-Origin Resource Sharing)**
**Package:** `cors@^2.8.5`

**Location:** `backend-nodejs/src/index.js`

**Function:**
- Controls which origins can access the API
- Enables credentials (cookies, authorization headers)
- Restricts HTTP methods and headers

**Implementation:**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://localhost:9000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Purpose:**
- Prevents unauthorized cross-origin requests
- Protects against CSRF attacks
- Ensures only trusted frontend can communicate with backend

---

### 2. **bcryptjs (Password Hashing)**
**Package:** `bcryptjs@^2.4.3`

**Locations:**
- `backend-nodejs/src/services/auth.service.js`
- `backend-nodejs/src/services/admin.service.js`
- `backend-nodejs/src/controllers/users.controller.js`
- `backend-nodejs/prisma/seed.js`

**Functions:**

#### Password Hashing (Registration)
```javascript
const passwordHash = await bcrypt.hash(password, 10);
```
- **Salt rounds:** 10 (industry standard)
- **Used in:** User registration, password reset, admin password changes

#### Password Verification (Login)
```javascript
const valid = await bcrypt.compare(password, user.passwordHash);
```
- **Used in:** Login authentication, password change verification

**Purpose:**
- Securely stores passwords using one-way hashing
- Prevents password exposure in database breaches
- Uses salt to prevent rainbow table attacks

---

### 3. **JWT (JSON Web Tokens)**
**Package:** `jsonwebtoken@^9.0.2`

**Location:** `backend-nodejs/src/services/auth.service.js`

**Configuration:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';  // 30m in production
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7h';
```

**Functions:**

#### Access Token Generation
```javascript
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
```
- **Payload:** `{ sub: username, userId, roles }`
- **Expiration:** 30 minutes
- **Purpose:** Short-lived token for API authentication

#### Refresh Token Generation
```javascript
const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION });
```
- **Expiration:** 7 hours
- **Purpose:** Long-lived token for session renewal
- **Storage:** Database (`RefreshToken` table)

#### Token Verification
```javascript
const payload = jwt.verify(token, JWT_SECRET);
```
- **Used in:** Authentication middleware, token refresh

**Purpose:**
- Stateless authentication
- Role-based access control (RBAC)
- Automatic session expiration

---

### 4. **Multer (File Upload)**
**Package:** `multer@^1.4.5-lts.1`

**Locations:**
- `backend-nodejs/src/controllers/admin.controller.js`
- `backend-nodejs/src/controllers/bookings.controller.js`

**Configuration:**
```javascript
const storage = multer.memoryStorage();  // For Supabase compatibility
return multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (!ALLOWED.includes(ext)) {
      return cb(new Error(`Only ${ALLOWED.join(', ')} files allowed`));
    }
    cb(null, true);
  },
});
```

**Allowed File Types:**
- Images: `jpg`, `jpeg`, `png`, `gif`, `webp`
- Documents: `pdf`

**Functions:**
- **Tourism Images:** `upload.single('image')`
- **Hotel Images:** `upload.array('images', 10)`
- **Booking Receipts:** `upload.single('receipt')`

**Purpose:**
- Secure file upload handling
- File type validation
- File size limits
- Memory storage for cloud upload (Supabase)

---

### 5. **Nodemailer (Email Service)**
**Package:** `nodemailer@^6.9.7`

**Location:** `backend-nodejs/src/services/email-gmail.service.js`

**Configuration:**
```javascript
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});
```

**Email Functions:**

1. **Password Reset OTP**
   ```javascript
   sendPasswordResetOtp(email, otp, expiryMinutes)
   ```

2. **Email Verification OTP**
   ```javascript
   sendEmailVerificationOtp(email, otp, expiryMinutes, fullName)
   ```

3. **Booking Notifications**
   - `sendBookingAcceptedNotification()`
   - `sendCostProposedNotification()`
   - `sendReceiptUploadedNotification()`
   - `sendBookingApprovedNotification()`
   - `sendBookingRejectedNotification()`

4. **Welcome Email**
   ```javascript
   sendWelcomeEmail(email, fullName)
   ```

**Purpose:**
- OTP delivery for authentication
- Booking workflow notifications
- Security alerts
- User engagement

---

### 6. **Express Rate Limit**
**Package:** `express-rate-limit@^7.1.5`

**Status:** ✅ **FULLY IMPLEMENTED**

**Locations:**
- `backend-nodejs/src/middleware/rate-limit.middleware.js` (middleware)
- Applied across auth, bookings, ratings, and admin controllers

**Rate Limiters Implemented:**

1. **Global API Limiter** - 1000 requests per 15 minutes (all `/api/*`)
2. **Login Limiter** - 5 attempts per 15 minutes
3. **Registration Limiter** - 3 per hour
4. **Password Reset Limiter** - 3 per hour
5. **Email Verification Limiter** - 5 per 15 minutes
6. **Booking Creation Limiter** - 10 per hour
7. **File Upload Limiter** - 20 per 15 minutes
8. **Rating Creation Limiter** - 10 per hour
9. **Admin Limiter** - 500 per 15 minutes

**Implementation Example:**
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

// Applied to routes
router.post('/login', loginLimiter, validate(LoginDto), login);
```

**Purpose:**
- Prevent brute force attacks
- Limit API abuse
- Protect against DDoS
- Prevent resource exhaustion

**Documentation:** See `RATE_LIMITING_DOCUMENTATION.md` for complete details

---

## Frontend State Management

### 7. **Zustand**
**Package:** `zustand@^4.5.0`

**Location:** `frontend/src/store/useAuthStore.ts`

**State Management:**
```typescript
interface AuthState {
  token: string | null;
  refreshToken: string | null;
  username: string | null;
  userId: number | null;
  role: UserRole | null;
  browsingMode: BrowsingMode;
  isAuthenticated: boolean;
  emailVerified: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  expiresAt: string | null;
  expiresIn: number | null;
}
```

**Key Functions:**

1. **Login**
   ```typescript
   login(token, refreshToken, userId, expiresAt, expiresIn)
   ```
   - Stores tokens in localStorage
   - Decodes JWT payload
   - Sets authentication state

2. **Logout**
   ```typescript
   logout()
   ```
   - Calls backend revoke endpoint
   - Clears localStorage
   - Resets state

3. **Token Refresh**
   ```typescript
   refreshAccessToken()
   ```
   - Automatically refreshes expired tokens
   - Updates state with new tokens

4. **Auto-Refresh Hook**
   ```typescript
   useAutoRefresh()
   ```
   - Checks token expiry every 60 seconds
   - Refreshes when < 5 minutes remaining

**Purpose:**
- Centralized authentication state
- Persistent sessions across page reloads
- Automatic token management
- Role-based UI rendering

---

## Security Features

### 8. **Security Headers**
**Location:** `backend-nodejs/src/index.js`

**Implementation:**
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Content-Security-Policy', "default-src 'self'; ...");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), ...');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
});
```

**Headers Explained:**

1. **X-Frame-Options: DENY**
   - Prevents clickjacking attacks
   - Blocks embedding in iframes

2. **X-Content-Type-Options: nosniff**
   - Prevents MIME type sniffing
   - Forces browser to respect Content-Type

3. **X-XSS-Protection: 1; mode=block**
   - Enables browser XSS filter
   - Blocks page if XSS detected

4. **Content-Security-Policy**
   - Restricts resource loading
   - Prevents inline script execution
   - Mitigates XSS attacks

5. **Strict-Transport-Security (HSTS)**
   - Forces HTTPS connections
   - Prevents protocol downgrade attacks

---

### 9. **XSS Prevention**
**Location:** `backend-nodejs/src/middleware/audit.middleware.js`

**Detection Patterns:**
```javascript
const XSS_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on\w+\s*=/i,          // onclick=, onload=, onerror=
  /<iframe/i,
  /<img[^>]+src\s*=\s*['"]?javascript/i,
  /eval\s*\(/i,
  /document\s*\.\s*cookie/i,
];
```

**Detection Function:**
```javascript
function containsXss(value) {
  if (typeof value !== 'string') return false;
  return XSS_PATTERNS.some(p => p.test(value));
}
```

**Frontend Sanitization:**
**Location:** `frontend/src/utils/formValidation.ts`

```typescript
// Real-time input sanitization
export const sanitizeFullName = (value: string): string => {
  return value.replace(/[^a-zA-Z\s]/g, '');
};

export const sanitizeUsername = (value: string): string => {
  let sanitized = value.replace(/[^a-zA-Z0-9_]/g, '');
  if (sanitized.length > 0 && !/^[a-zA-Z]/.test(sanitized)) {
    sanitized = sanitized.substring(1);
  }
  return sanitized;
};
```

**Purpose:**
- Prevents script injection
- Blocks malicious HTML
- Sanitizes user input
- Logs attack attempts

---

### 10. **SQL Injection Prevention**
**Location:** `backend-nodejs/src/middleware/audit.middleware.js`

**Detection Patterns:**
```javascript
const SQL_INJECTION_PATTERNS = [
  /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
  /UNION\s+(ALL\s+)?SELECT/i,
  /DROP\s+(TABLE|DATABASE|INDEX)/i,
  /INSERT\s+INTO/i,
  /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE)/i,
  /--\s*$/,
  /\/\*.*\*\//,
  /xp_cmdshell/i,
  /EXEC(\s|\()/i,
];
```

**Primary Protection: Prisma ORM**
- All database queries use parameterized statements
- No raw SQL concatenation
- Automatic input escaping

**Purpose:**
- Detects SQL injection attempts
- Logs suspicious queries
- Prisma provides built-in protection

---

### 11. **Inactivity Timeout**
**Location:** `frontend/src/hooks/useInactivityTimeout.ts`

**Configuration:** `frontend/src/config/security.config.ts`
```typescript
inactivity: {
  timeout: 7 * 60 * 1000,        // 7 minutes
  warningTime: 0,                 // No warning - direct logout
  throttleInterval: 1000,         // 1 second
  activityEvents: [
    'mousedown', 'mousemove', 'keydown',
    'scroll', 'touchstart', 'click'
  ]
}
```

**Implementation:**
```typescript
export function useInactivityTimeout(options) {
  const handleInactivityLogout = async () => {
    await logout();
    router.push('/auth/login?reason=inactivity');
  };

  const resetTimer = () => {
    clearTimers();
    timeoutIdRef.current = setTimeout(() => {
      handleInactivityLogout();
    }, timeout);
  };

  // Track user activity
  events.forEach(event => {
    document.addEventListener(event, handleActivity);
  });
}
```

**Usage:** `frontend/src/app/layout.tsx`
```typescript
<InactivityMonitor />
```

**Purpose:**
- Automatic logout after inactivity
- Prevents unauthorized access to unattended sessions
- Configurable timeout duration
- Activity tracking across all user interactions

---

### 12. **Refresh Token Expiration**
**Backend:** `backend-nodejs/src/services/auth.service.js`

**Token Lifecycle:**

1. **Access Token**
   - Expiration: 30 minutes
   - Used for: API authentication
   - Storage: Frontend localStorage

2. **Refresh Token**
   - Expiration: 7 hours
   - Used for: Renewing access tokens
   - Storage: Database + Frontend localStorage

**Auto-Refresh Mechanism:**
**Location:** `frontend/src/store/useAuthStore.ts`

```typescript
export const useAutoRefresh = () => {
  useEffect(() => {
    const checkAndRefresh = async () => {
      const timeUntilExpiry = getTimeUntilExpiry();
      const refreshThresholdSeconds = SecurityConfig.jwt.refreshThreshold / 1000;
      
      if (timeUntilExpiry > 0 && timeUntilExpiry < refreshThresholdSeconds) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          await logout();
        }
      }
    };

    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 60000);  // Check every 60s
    return () => clearInterval(interval);
  }, [isAuthenticated]);
};
```

**Refresh Flow:**
1. Frontend checks token expiry every 60 seconds
2. When < 5 minutes remaining, triggers refresh
3. Backend validates refresh token
4. Issues new access + refresh token pair
5. Frontend updates localStorage and state

**Purpose:**
- Seamless user experience (no interruptions)
- Automatic session renewal
- Maximum session duration: 7 hours
- Security: Short-lived access tokens

---

### 13. **Account Lockout & Rate Limiting**
**Location:** `backend-nodejs/src/services/auth.service.js`

**Configuration:**
```javascript
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const MAX_IP_ATTEMPTS_PER_HOUR = 100;
```

**Features:**

#### 1. IP-Based Rate Limiting
```javascript
async shouldBlockIpAddress(ipAddress) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentAttempts = await prisma.loginAttempt.count({
    where: { ipAddress, createdAt: { gte: oneHourAgo } }
  });
  return recentAttempts >= MAX_IP_ATTEMPTS_PER_HOUR;
}
```

#### 2. Progressive Delay
```javascript
async getProgressiveDelay(ipAddress) {
  const recentFailures = await prisma.loginAttempt.count({
    where: { ipAddress, success: false, createdAt: { gte: oneHourAgo } }
  });
  // Returns: 0s, 1s, 2s, 4s, 8s, 16s, 30s based on failures
}
```

#### 3. Account Lockout
```javascript
async lockUserAccount(userId, reason, triggerIpAddress) {
  const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
  await prisma.accountLockout.upsert({
    where: { userId },
    create: { userId, lockedUntil },
    update: { lockedUntil }
  });
  await this.sendSecurityAlert(userId, 'ACCOUNT_LOCKED', triggerIpAddress);
}
```

#### 4. Suspicious Activity Detection
```javascript
async detectSuspiciousActivity(ipAddress) {
  const recentAttempts = await prisma.loginAttempt.count({
    where: {
      ipAddress,
      success: false,
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
    }
  });
  return recentAttempts >= 5;
}
```

**Purpose:**
- Prevents brute force attacks
- Slows down attackers with progressive delays
- Temporary account lockout after repeated failures
- Email alerts for suspicious activity

---

### 14. **Audit Logging**
**Location:** `backend-nodejs/src/middleware/audit.middleware.js`

**Logged Information:**
- User ID
- Action type (CREATE, UPDATE, DELETE, LOGIN, etc.)
- Entity type (USER, HOTEL, BOOKING, etc.)
- Entity ID
- Request details (method, URL, body)
- IP address
- User agent
- Timestamp
- Success/failure status

**Sensitive Data Redaction:**
```javascript
const SENSITIVE_FIELDS = new Set([
  'password', 'passwordhash', 'newpassword',
  'token', 'refreshtoken', 'accesstoken',
  'otp', 'secret', 'apikey',
  'creditcard', 'cvv', 'pin'
]);

function sanitizeBody(obj) {
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    clean[key] = SENSITIVE_FIELDS.has(key.toLowerCase())
      ? '[REDACTED]'
      : sanitizeBody(value);
  }
  return clean;
}
```

**Attack Detection:**
- SQL injection attempts
- XSS attempts
- Logged as `AUTHORIZATION_CHECK` action

**Purpose:**
- Security monitoring
- Compliance (audit trail)
- Incident investigation
- Attack pattern analysis

---

## File Upload Management

### 15. **Supabase Storage Integration**
**Location:** `backend-nodejs/src/services/supabase-storage.service.js`

**Configuration:**
```javascript
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
```

**Upload Function:**
```javascript
async uploadFile(buffer, fileName, bucketName, contentType) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, buffer, {
      contentType,
      upsert: true
    });
  
  return supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName).data.publicUrl;
}
```

**Buckets:**
- `tourism-images` - Tourism place photos
- `hotel-images` - Hotel photos
- `booking-receipts` - Payment receipts

**Purpose:**
- Cloud-based file storage
- CDN delivery
- Scalable storage
- Public URL generation

---

## Email Services

### 16. **Email Validation**
**Location:** `backend-nodejs/src/services/email-validator.service.js`

**Validation Features:**
1. **Format Validation** - RFC 5322 compliance
2. **MX Record Check** - Verifies mail server exists
3. **Disposable Email Detection** - Blocks temporary emails
4. **Typo Detection** - Suggests corrections (gmail.con → gmail.com)
5. **Suspicious Pattern Detection** - Flags unusual patterns

**Usage:**
```javascript
const validation = await emailValidator.validateEmail(email, {
  checkMX: true,
  blockDisposable: true,
  checkSuspicious: false,
  checkTypos: true
});
```

**Purpose:**
- Prevents fake registrations
- Improves email deliverability
- Reduces spam accounts
- User experience (typo suggestions)

---

## Summary Table

| Technology | Package | Version | Primary Use | Location |
|------------|---------|---------|-------------|----------|
| **CORS** | cors | 2.8.5 | Cross-origin security | `backend-nodejs/src/index.js` |
| **bcryptjs** | bcryptjs | 2.4.3 | Password hashing | `backend-nodejs/src/services/auth.service.js` |
| **JWT** | jsonwebtoken | 9.0.2 | Authentication tokens | `backend-nodejs/src/services/auth.service.js` |
| **Multer** | multer | 1.4.5-lts.1 | File uploads | `backend-nodejs/src/controllers/*.js` |
| **Nodemailer** | nodemailer | 6.9.7 | Email service | `backend-nodejs/src/services/email-gmail.service.js` |
| **Rate Limit** | express-rate-limit | 7.1.5 | API rate limiting | Not yet implemented |
| **Zustand** | zustand | 4.5.0 | State management | `frontend/src/store/useAuthStore.ts` |

---

## Security Configuration Files

### Backend Environment Variables
**File:** `backend-nodejs/.env`

```env
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRATION=30m
JWT_REFRESH_EXPIRATION=7h

# Security Limits
MAX_FAILED_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
MAX_IP_ATTEMPTS_PER_HOUR=100

# Email Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
GMAIL_SENDER_NAME=North Wollo Tourism

# CORS
FRONTEND_URL=https://localhost:9000

# Supabase Storage
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
```

### Frontend Security Configuration
**File:** `frontend/src/config/security.config.ts`

```typescript
export const SecurityConfig = {
  jwt: {
    accessTokenExpiration: 30 * 60 * 1000,      // 30 minutes
    refreshTokenExpiration: 7 * 60 * 60 * 1000, // 7 hours
    refreshThreshold: 5 * 60 * 1000,            // 5 minutes
  },
  inactivity: {
    timeout: 7 * 60 * 1000,                     // 7 minutes
    warningTime: 0,                              // No warning
    throttleInterval: 1000,                      // 1 second
  },
};
```

---

## Testing

### Security Tests
**Location:** `backend-nodejs/tests/integration/admin-supporting.integration.test.js`

**Test Cases:**
1. **SEC-08:** XSS - CSP header blocks script injection
2. **SEC-10:** CORS - Unauthorized origin rejected
3. **Token Expiration:** Expired tokens rejected

---

## Recommendations

### Immediate Improvements
1. ✅ Implement `express-rate-limit` on auth endpoints
2. ✅ Add Helmet.js for additional security headers
3. ✅ Implement CSRF protection for state-changing operations
4. ✅ Add request body size limits
5. ✅ Implement API key rotation mechanism

### Future Enhancements
1. Two-factor authentication (2FA)
2. Biometric authentication
3. Session management dashboard
4. Real-time security monitoring
5. Automated threat detection

---

**Last Updated:** May 18, 2026
**Maintained By:** Tourism System Development Team
