# Rate Limiting Implementation Documentation

## Overview

This document describes the comprehensive rate limiting implementation in the Tourism System to protect against:
- **Brute force attacks** (login attempts)
- **DDoS attacks** (overwhelming the server)
- **API abuse** (excessive requests)
- **Resource exhaustion** (spam creation)
- **Email flooding** (verification/reset spam)

---

## Table of Contents
1. [Implementation Summary](#implementation-summary)
2. [Rate Limiter Types](#rate-limiter-types)
3. [Configuration Details](#configuration-details)
4. [Applied Endpoints](#applied-endpoints)
5. [Testing Rate Limits](#testing-rate-limits)
6. [Monitoring & Logging](#monitoring--logging)
7. [Customization Guide](#customization-guide)

---

## Implementation Summary

### Technology Stack
- **Package:** `express-rate-limit@^7.1.5`
- **Strategy:** IP-based rate limiting
- **Storage:** In-memory (default)
- **Headers:** Standard `RateLimit-*` headers

### Key Features
✅ Multiple rate limiters for different endpoint types
✅ IP-based tracking
✅ Automatic retry-after headers
✅ Customizable error messages
✅ Skip successful requests for auth endpoints
✅ Production-ready configuration

---

## Rate Limiter Types

### 1. **Global API Limiter**
**Purpose:** Prevent general API abuse across all endpoints

```javascript
windowMs: 15 minutes
max: 1000 requests per IP
message: "Too many requests from this IP, please try again later."
```

**Applied to:** All `/api/*` routes

**Use case:** Prevents a single IP from overwhelming the entire API

---

### 2. **Authentication Rate Limiters**

#### a) Login Limiter
**Purpose:** Prevent brute force password attacks

```javascript
windowMs: 15 minutes
max: 5 login attempts
skipSuccessfulRequests: true
message: "Too many login attempts. Please try again after 15 minutes."
```

**Applied to:** `POST /api/auth/login`

**Use case:** Limits failed login attempts while allowing successful logins

---

#### b) Registration Limiter
**Purpose:** Prevent spam account creation

```javascript
windowMs: 1 hour
max: 3 registrations per IP
message: "Too many accounts created from this IP. Please try again after an hour."
```

**Applied to:** `POST /api/auth/register`

**Use case:** Prevents automated bot registration

---

#### c) Password Reset Limiter
**Purpose:** Prevent email flooding via password reset

```javascript
windowMs: 1 hour
max: 3 password reset requests
message: "Too many password reset requests. Please try again after an hour."
```

**Applied to:** `POST /api/auth/reset-password`

**Use case:** Limits password reset email spam

---

#### d) Email Verification Limiter
**Purpose:** Prevent verification email flooding

```javascript
windowMs: 15 minutes
max: 5 verification emails
message: "Too many verification requests. Please try again after 15 minutes."
```

**Applied to:**
- `POST /api/auth/send-verification`
- `POST /api/auth/resend-verification`

**Use case:** Prevents email service abuse

---

### 3. **Resource Creation Rate Limiters**

#### a) Booking Creation Limiter
**Purpose:** Prevent spam bookings

```javascript
windowMs: 1 hour
max: 10 bookings per IP
message: "Too many booking requests. Please try again later."
```

**Applied to:** `POST /api/bookings`

**Use case:** Prevents fake booking spam that could overwhelm hotel owners

---

#### b) File Upload Limiter
**Purpose:** Prevent storage abuse

```javascript
windowMs: 15 minutes
max: 20 file uploads
message: "Too many file uploads. Please try again later."
```

**Applied to:**
- `POST /api/bookings/:id/receipt/upload`
- Admin file upload endpoints

**Use case:** Prevents storage exhaustion attacks

---

#### c) Rating Creation Limiter
**Purpose:** Prevent spam reviews

```javascript
windowMs: 1 hour
max: 10 ratings per IP
message: "Too many rating submissions. Please try again later."
```

**Applied to:**
- `POST /api/ratings/tourism`
- `POST /api/ratings/hotel`
- `POST /api/ratings/tourism/:id`
- `POST /api/ratings/hotel/:id`

**Use case:** Prevents fake review spam

---

### 4. **Admin Operation Limiter**
**Purpose:** More lenient limits for authenticated admins

```javascript
windowMs: 15 minutes
max: 500 requests per IP
message: "Too many admin requests. Please try again later."
```

**Applied to:** All `/api/admin/*` routes

**Use case:** Allows admins to perform bulk operations while still preventing abuse

---

### 5. **Public Read Limiter**
**Purpose:** Lenient limits for browsing

```javascript
windowMs: 15 minutes
max: 500 requests per IP
message: "Too many requests. Please try again later."
```

**Applied to:** Public read endpoints (optional, not currently applied)

**Use case:** Allows normal browsing while preventing scraping

---

## Configuration Details

### Standard Configuration
All rate limiters share these settings:

```javascript
{
  standardHeaders: true,      // Return RateLimit-* headers
  legacyHeaders: false,        // Disable X-RateLimit-* headers
  skipSuccessfulRequests: false, // Count all requests (except auth)
  skipFailedRequests: false,   // Count all requests
  
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
}
```

### Response Headers
When rate limit is exceeded, the following headers are returned:

```
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1621234567
Retry-After: 900
```

---

## Applied Endpoints

### Authentication Endpoints

| Endpoint | Method | Rate Limiter | Limit |
|----------|--------|--------------|-------|
| `/api/auth/login` | POST | loginLimiter | 5 per 15 min |
| `/api/auth/register` | POST | registerLimiter | 3 per hour |
| `/api/auth/reset-password` | POST | passwordResetLimiter | 3 per hour |
| `/api/auth/send-verification` | POST | emailVerificationLimiter | 5 per 15 min |
| `/api/auth/resend-verification` | POST | emailVerificationLimiter | 5 per 15 min |

### Booking Endpoints

| Endpoint | Method | Rate Limiter | Limit |
|----------|--------|--------------|-------|
| `/api/bookings` | POST | bookingCreationLimiter | 10 per hour |
| `/api/bookings/:id/receipt/upload` | POST | fileUploadLimiter | 20 per 15 min |

### Rating Endpoints

| Endpoint | Method | Rate Limiter | Limit |
|----------|--------|--------------|-------|
| `/api/ratings/tourism` | POST | ratingCreationLimiter | 10 per hour |
| `/api/ratings/hotel` | POST | ratingCreationLimiter | 10 per hour |
| `/api/ratings/tourism/:id` | POST | ratingCreationLimiter | 10 per hour |
| `/api/ratings/hotel/:id` | POST | ratingCreationLimiter | 10 per hour |

### Admin Endpoints

| Endpoint | Method | Rate Limiter | Limit |
|----------|--------|--------------|-------|
| `/api/admin/*` | ALL | adminLimiter | 500 per 15 min |

### Global Limiter

| Endpoint | Method | Rate Limiter | Limit |
|----------|--------|--------------|-------|
| `/api/*` | ALL | globalLimiter | 1000 per 15 min |

---

## Testing Rate Limits

### Manual Testing

#### 1. Test Login Rate Limit
```bash
# Make 6 login attempts with wrong password
for i in {1..6}; do
  curl -X POST http://localhost:9001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
  echo "\nAttempt $i"
done

# Expected: First 5 succeed (with 401), 6th returns 429
```

#### 2. Test Registration Rate Limit
```bash
# Try to register 4 accounts from same IP
for i in {1..4}; do
  curl -X POST http://localhost:9001/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"user$i\",\"email\":\"user$i@test.com\",\"password\":\"Test123!\",\"fullName\":\"User $i\"}"
  echo "\nRegistration $i"
done

# Expected: First 3 succeed, 4th returns 429
```

#### 3. Test Booking Creation Rate Limit
```bash
# Try to create 11 bookings
for i in {1..11}; do
  curl -X POST http://localhost:9001/api/bookings?userId=1 \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d "{\"hotelId\":1,\"checkIn\":\"2026-06-01\",\"checkOut\":\"2026-06-05\",\"numberOfGuests\":2}"
  echo "\nBooking $i"
done

# Expected: First 10 succeed, 11th returns 429
```

#### 4. Test Global API Rate Limit
```bash
# Make 1001 requests to any endpoint
for i in {1..1001}; do
  curl http://localhost:9001/api/tourisms
  echo "\nRequest $i"
done

# Expected: First 1000 succeed, 1001st returns 429
```

### Automated Testing

Create a test file: `backend-nodejs/tests/integration/rate-limit.test.js`

```javascript
const request = require('supertest');
const app = require('../../src/index');

describe('Rate Limiting', () => {
  
  test('Login rate limit - blocks after 5 attempts', async () => {
    // Make 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'wrong' });
    }
    
    // 6th attempt should be rate limited
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'wrong' });
    
    expect(res.status).toBe(429);
    expect(res.body.error).toBe('Too many requests');
  });
  
  test('Registration rate limit - blocks after 3 attempts', async () => {
    // Make 3 registration attempts
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: `user${i}`,
          email: `user${i}@test.com`,
          password: 'Test123!',
          fullName: `User ${i}`
        });
    }
    
    // 4th attempt should be rate limited
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'user4',
        email: 'user4@test.com',
        password: 'Test123!',
        fullName: 'User 4'
      });
    
    expect(res.status).toBe(429);
  });
  
});
```

---

## Monitoring & Logging

### Response Headers
Check rate limit status in response headers:

```javascript
// Client-side monitoring
fetch('/api/auth/login', { method: 'POST', ... })
  .then(response => {
    console.log('Rate Limit:', response.headers.get('RateLimit-Limit'));
    console.log('Remaining:', response.headers.get('RateLimit-Remaining'));
    console.log('Reset:', response.headers.get('RateLimit-Reset'));
  });
```

### Server-side Logging
Add logging to rate limit middleware:

```javascript
// In rate-limit.middleware.js
const RATE_LIMIT_CONFIG = {
  // ... existing config
  
  handler: (req, res) => {
    console.warn(`⚠️ Rate limit exceeded: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
};
```

### Audit Trail
Rate limit violations are automatically logged by the audit middleware:

```javascript
// Audit log entry
{
  userId: null,
  action: 'AUTHORIZATION_CHECK',
  entityType: 'AUTH',
  details: {
    attackType: 'RATE_LIMIT_EXCEEDED',
    url: '/api/auth/login',
    status: 429
  },
  ipAddress: '192.168.1.100',
  timestamp: '2026-05-18T10:30:00Z'
}
```

---

## Customization Guide

### Adjusting Limits

#### Make Login More Strict
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,  // Changed from 5 to 3
  skipSuccessfulRequests: true,
  message: 'Too many login attempts. Please try again after 15 minutes.',
  ...RATE_LIMIT_CONFIG
});
```

#### Make Booking More Lenient
```javascript
const bookingCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,  // Changed from 10 to 20
  message: 'Too many booking requests. Please try again later.',
  ...RATE_LIMIT_CONFIG
});
```

### Using Redis for Distributed Systems

For production with multiple servers, use Redis:

```bash
npm install rate-limit-redis redis
```

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

const loginLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:login:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5,
  ...RATE_LIMIT_CONFIG
});
```

### Custom Key Generator (User-based)

Rate limit by user ID instead of IP:

```javascript
const userBasedLimiter = rateLimit({
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.userId?.toString() || req.ip || 'unknown';
  },
  windowMs: 15 * 60 * 1000,
  max: 100,
  ...RATE_LIMIT_CONFIG
});
```

### Whitelist IPs

Skip rate limiting for trusted IPs:

```javascript
const TRUSTED_IPS = ['127.0.0.1', '::1', '10.0.0.1'];

const loginLimiter = rateLimit({
  skip: (req) => TRUSTED_IPS.includes(req.ip),
  windowMs: 15 * 60 * 1000,
  max: 5,
  ...RATE_LIMIT_CONFIG
});
```

---

## Environment Variables

Add these to `.env` for customization:

```env
# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=1000         # Global limit
RATE_LIMIT_LOGIN_MAX=5               # Login attempts
RATE_LIMIT_REGISTER_MAX=3            # Registrations per hour
RATE_LIMIT_BOOKING_MAX=10            # Bookings per hour
RATE_LIMIT_ADMIN_MAX=500             # Admin requests

# Redis (for distributed systems)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

Then update the middleware:

```javascript
const RATE_LIMIT_CONFIG = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  // ... rest of config
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 5,
  // ... rest of config
});
```

---

## Best Practices

### 1. **Layered Defense**
✅ Use multiple rate limiters (global + specific)
✅ Combine with authentication middleware
✅ Add CAPTCHA for sensitive endpoints
✅ Monitor audit logs for patterns

### 2. **User Experience**
✅ Provide clear error messages
✅ Include `Retry-After` header
✅ Show remaining attempts in UI
✅ Don't count successful requests for auth

### 3. **Production Considerations**
✅ Use Redis for multi-server deployments
✅ Monitor rate limit violations
✅ Adjust limits based on traffic patterns
✅ Whitelist trusted IPs (admin, monitoring)

### 4. **Security**
✅ Don't reveal exact limits to attackers
✅ Log rate limit violations
✅ Combine with IP blocking for persistent abuse
✅ Use progressive delays for repeated violations

---

## Frontend Integration

### Handling 429 Responses

```typescript
// frontend/src/services/api.ts
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const seconds = retryAfter ? parseInt(retryAfter) : 60;
    
    throw new Error(
      `Too many requests. Please try again in ${Math.ceil(seconds / 60)} minutes.`
    );
  }
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }
  
  return response.json();
};
```

### Display Rate Limit Info

```typescript
// Show remaining attempts
const checkRateLimit = async () => {
  const response = await fetch('/api/auth/login', {
    method: 'HEAD'  // Check without making actual request
  });
  
  const limit = response.headers.get('RateLimit-Limit');
  const remaining = response.headers.get('RateLimit-Remaining');
  
  console.log(`${remaining} of ${limit} attempts remaining`);
};
```

### Retry Logic

```typescript
// Automatic retry with exponential backoff
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3) => {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 429 && retries > 0) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      console.log(`Rate limited. Retrying in ${retryAfter} seconds...`);
      
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};
```

---

## Troubleshooting

### Issue: Rate limit too strict for legitimate users

**Solution:** Increase limits or use user-based rate limiting instead of IP-based

```javascript
// Change from IP-based to user-based
keyGenerator: (req) => {
  return req.user?.userId?.toString() || req.ip || 'unknown';
}
```

### Issue: Shared IP (corporate network) hits limit quickly

**Solution:** Whitelist known corporate IPs or use authentication-based limiting

```javascript
const CORPORATE_IPS = ['203.0.113.0/24'];

const loginLimiter = rateLimit({
  skip: (req) => {
    return CORPORATE_IPS.some(range => ipInRange(req.ip, range));
  },
  // ... rest of config
});
```

### Issue: Rate limit not working in development

**Solution:** Ensure you're not using `localhost` or `127.0.0.1` which may be whitelisted

```javascript
// Check if rate limiting is active
console.log('Rate limiting active:', process.env.NODE_ENV !== 'test');
```

### Issue: Rate limit persists after window expires

**Solution:** Clear in-memory store or check Redis connection

```javascript
// Manual reset (for testing only)
app.get('/api/debug/reset-rate-limit', (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    // Reset logic here
    res.json({ message: 'Rate limits reset' });
  } else {
    res.status(403).json({ error: 'Not allowed in production' });
  }
});
```

---

## Summary

### Implemented Rate Limiters

| Limiter | Window | Max Requests | Applied To |
|---------|--------|--------------|------------|
| Global | 15 min | 1000 | All `/api/*` |
| Login | 15 min | 5 | `/api/auth/login` |
| Register | 1 hour | 3 | `/api/auth/register` |
| Password Reset | 1 hour | 3 | `/api/auth/reset-password` |
| Email Verification | 15 min | 5 | Verification endpoints |
| Booking Creation | 1 hour | 10 | `/api/bookings` |
| File Upload | 15 min | 20 | Upload endpoints |
| Rating Creation | 1 hour | 10 | Rating endpoints |
| Admin | 15 min | 500 | `/api/admin/*` |

### Files Modified

1. ✅ `backend-nodejs/src/middleware/rate-limit.middleware.js` - Created
2. ✅ `backend-nodejs/src/index.js` - Added global limiter
3. ✅ `backend-nodejs/src/controllers/auth.controller.js` - Added auth limiters
4. ✅ `backend-nodejs/src/controllers/bookings.controller.js` - Added booking limiters
5. ✅ `backend-nodejs/src/controllers/ratings.controller.js` - Added rating limiters
6. ✅ `backend-nodejs/src/controllers/admin.controller.js` - Added admin limiter

### Next Steps

1. ✅ Test rate limits in development
2. ✅ Monitor rate limit violations in production
3. ✅ Adjust limits based on real traffic patterns
4. ✅ Consider Redis for multi-server deployments
5. ✅ Add CAPTCHA for critical endpoints (optional)

---

**Last Updated:** May 18, 2026
**Maintained By:** Tourism System Development Team
