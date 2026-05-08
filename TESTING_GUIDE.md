# 🧪 Testing Guide - North Wollo Tourism System

Complete guide for running all tests manually from the command line.

---

## 📋 Test Summary

| Test Type | Count | Status |
|-----------|-------|--------|
| Unit Tests | 47 | ✅ PASSING |
| Integration Tests | 140 | ✅ PASSING |
| Playwright E2E | 36 | ✅ PASSING |
| **TOTAL** | **223** | **✅ ALL PASSING** |

---

## 🔧 Prerequisites

Before running tests, ensure you have:

1. **Node.js** installed (v18 or higher)
2. **PostgreSQL** database running locally
3. **Dependencies installed**:
   ```bash
   cd backend-nodejs
   npm install
   
   cd ../frontend
   npm install
   ```

4. **Test database configured** in `backend-nodejs/.env.test`:
   ```
   DATABASE_URL="postgresql://postgres:123123Aa@localhost:5432/tourism_test"
   ```

---

## 🧪 Running Tests

### 1️⃣ Unit Tests (47 tests)

**Location**: `backend-nodejs/tests/unit/`

**Command**:
```bash
cd backend-nodejs
npm run test:unit
```

**What it tests**:
- Authentication service logic
- Booking service logic
- Rating validation
- Audit logging
- Map point distance calculations

**Expected output**:
```
Test Suites: 5 passed, 5 total
Tests:       47 passed, 47 total
Time:        ~3s
```

---

### 2️⃣ Integration Tests (140 tests)

**Location**: `backend-nodejs/tests/integration/`

**Command**:
```bash
cd backend-nodejs
npm run test:integration
```

**What it tests**:
- Full API endpoints
- Database operations
- Authentication flows
- Admin operations
- Booking lifecycle
- Security features
- Email notifications

**Expected output**:
```
Test Suites: 3 passed, 3 total
Tests:       140 passed, 140 total
Time:        ~60-90s
```

**Note**: You may see email timeout warnings - this is normal in test environment.

---

### 3️⃣ Playwright E2E Tests (36 tests)

**Location**: `frontend/tests/e2e/`

**⚠️ IMPORTANT**: Requires both servers running!

#### Step 1: Start Backend Server

Open **Terminal 1**:
```bash
cd backend-nodejs
npm start
```

Wait for: `Backend running on: https://localhost:9001`

#### Step 2: Start Frontend Server

Open **Terminal 2**:
```bash
cd frontend
npm run dev
```

Wait for: `Ready in ~5s` and `Local: https://localhost:9000`

#### Step 3: Run Playwright Tests

Open **Terminal 3**:
```bash
cd frontend
npm run test:e2e
```

**What it tests**:
- User registration and login
- Tourism place discovery
- Booking lifecycle
- Admin workflows
- Hotel management
- Map functionality
- Rating system

**Expected output**:
```
36 passed (3-4 minutes)
```

**Note**: Some tests may be "flaky" (fail first time, pass on retry) - this is normal for E2E tests.

#### Step 4: Stop Servers

After tests complete:
- Press `Ctrl+C` in Terminal 1 (backend)
- Press `Ctrl+C` in Terminal 2 (frontend)

---

## 🚀 Quick Test All

Run all tests in sequence:

```bash
# Terminal 1: Run backend tests
cd backend-nodejs
npm run test:unit && npm run test:integration

# Terminal 2: Start servers and run E2E tests
cd backend-nodejs
npm start

# Terminal 3 (wait for backend to start):
cd frontend
npm run dev

# Terminal 4 (wait for frontend to start):
cd frontend
npm run test:e2e
```

---

## 📊 Test Coverage

### Unit Tests Coverage:
- ✅ Authentication (20 tests)
- ✅ Ratings (12 tests)
- ✅ Bookings (8 tests)
- ✅ Audit (3 tests)
- ✅ Map Points (4 tests)

### Integration Tests Coverage:
- ✅ Admin operations (30+ tests)
- ✅ Authentication flows (14 tests)
- ✅ Booking lifecycle (17 tests)
- ✅ Security features (15+ tests)
- ✅ Tourism management (20+ tests)
- ✅ User management (10+ tests)
- ✅ Validation & error handling (10+ tests)

### E2E Tests Coverage:
- ✅ Registration & email verification
- ✅ Tourism discovery & search
- ✅ Booking lifecycle
- ✅ Admin workflows
- ✅ Hotel management
- ✅ Map & routing
- ✅ Rating system
- ✅ Hero image carousel

---

## 🐛 Troubleshooting

### Unit/Integration Tests Fail

**Problem**: Database connection error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
1. Ensure PostgreSQL is running
2. Check database credentials in `.env.test`
3. Create test database:
   ```sql
   CREATE DATABASE tourism_test;
   ```

---

### Playwright Tests Fail

**Problem**: `ERR_CONNECTION_REFUSED`

**Solution**:
1. Ensure both servers are running
2. Check ports 9000 and 9001 are not in use
3. Wait 10-15 seconds after starting servers

**Problem**: Certificate errors

**Solution**: Tests use self-signed certificates - this is normal and handled by test configuration.

---

### Email Warnings in Tests

**Warning**: `⚠️ Verification email may not have sent`

**Explanation**: This is normal in test environment. Tests use `DISABLE_EMAIL_VALIDATION=true` and auto-verify emails.

---

## 📝 Test Scripts Reference

All available test commands:

```bash
# Backend tests
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only

# Frontend tests
npm run test:e2e          # Playwright E2E tests
npm run test:e2e:ui       # Playwright with UI mode
```

---

## ✅ Success Criteria

All tests passing means:
- ✅ All business logic working correctly
- ✅ All API endpoints functioning
- ✅ Database operations successful
- ✅ Authentication & authorization working
- ✅ Email system configured
- ✅ Frontend UI working end-to-end
- ✅ Security features active

---

## 🎯 CI/CD Integration

These tests can be run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Unit Tests
  run: cd backend-nodejs && npm run test:unit

- name: Run Integration Tests
  run: cd backend-nodejs && npm run test:integration

- name: Run E2E Tests
  run: |
    cd backend-nodejs && npm start &
    cd frontend && npm run dev &
    sleep 15
    cd frontend && npm run test:e2e
```

---

## 📞 Support

If tests fail unexpectedly:
1. Check all prerequisites are met
2. Ensure database is running
3. Verify environment variables
4. Check server logs for errors
5. Review test output for specific error messages

---

**Last Updated**: May 8, 2026
**Test Status**: ✅ ALL 223 TESTS PASSING
