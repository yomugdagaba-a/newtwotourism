# North Wollo Tourism — Testing Guide

Complete step-by-step guide to run all automated tests from the command terminal.

---

## System Requirements

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | `node --version` to check |
| PostgreSQL | 14+ | Must be running on port 5432 |
| npm | 8+ | Comes with Node.js |

---

## Project Configuration (Already Set Up)

The following files are pre-configured and ready to use:

| File | Purpose |
|---|---|
| `backend-nodejs/.env` | Production backend config (DB: `tourism_nodejs`, CORS: `https://localhost:9000`) |
| `backend-nodejs/.env.test` | Test backend config (DB: `tourism_test`, email redirect to `maryeabebe55@gmail.com`) |
| `frontend/.env.local` | Frontend config (`NEXT_PUBLIC_API_URL=https://localhost:9001/api`) |

---

## Test Summary

| Test Type | Count | Tool | Requires DB | Requires Servers |
|---|---|---|---|---|
| Unit Tests | 47 tests | Jest | No | No |
| Integration Tests | 140 tests | Jest + Supertest | Yes (`tourism_test`) | No |
| E2E / System Tests | 36 tests | Playwright | Yes (`tourism_nodejs`) | Yes (both servers) |

---

## Part 1 — Unit Tests

Unit tests use mocks — no database or running server needed.

```
cd backend-nodejs
npm run test:unit
```

**Expected output:**
```
Test Suites: 5 passed, 5 total
Tests:       47 passed, 47 total
Time:        ~4s
```

**What is tested:**
- `auth.service.test.js` — UT-01 to UT-07: registration, login, OTP, progressive delay, token refresh
- `bookings.service.test.js` — UT-08 to UT-10: booking state machine transitions
- `ratings.service.test.js` — UT-11, UT-12: rating validation (1–5 range)
- `map-points.service.test.js` — UT-13, UT-14: Haversine distance calculation
- `audit.service.test.js` — UT-16, UT-17: audit log resilience and statistics

---

## Part 2 — Integration Tests

Integration tests run against a real PostgreSQL test database (`tourism_test`).

### Step 1 — Verify the test database exists

The test database must exist and have migrations applied. Run this once to check:

```
cd backend-nodejs
node -e "require('dotenv').config({path:'.env.test',override:true}); const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.user.count().then(c=>{console.log('Test DB OK, users:',c);p.$disconnect()}).catch(e=>{console.error('DB ERROR:',e.message);p.$disconnect()})"
```

If you see `Test DB OK, users: 1` — skip to Step 3.

If you see a DB error — run Step 2.

### Step 2 — Set up the test database (first time only)

```
cd backend-nodejs
```

Create the test database (run in PostgreSQL or pgAdmin):
```sql
CREATE DATABASE tourism_test;
```

Apply migrations:
```
set DATABASE_URL=postgresql://postgres:123123Aa@localhost:5432/tourism_test
set DIRECT_URL=postgresql://postgres:123123Aa@localhost:5432/tourism_test
npx prisma migrate deploy
```

If you get "migration 0_init already exists" error, mark it as applied first:
```
npx prisma migrate resolve --applied "0_init"
npx prisma migrate deploy
```

### Step 3 — Run integration tests

```
cd backend-nodejs
npm run test:integration
```

**Expected output:**
```
Test Suites: 3 passed, 3 total
Tests:       140 passed, 140 total
Time:        ~30s
```

**What is tested:**
- `auth.integration.test.js` — IT-01 to IT-03: registration, token refresh, logout, security headers
- `booking.integration.test.js` — IT-04, IT-05, IT-09, IT-10: full booking lifecycle (REQUESTED → APPROVED)
- `admin-supporting.integration.test.js` — IT-06 to IT-12: admin CRUD, roles, hotels, roads, guiders, ratings, audit, security

**Note:** Test emails are automatically redirected to `maryeabebe55@gmail.com` during integration tests. You will receive real emails for each test registration.

---

## Part 3 — E2E / System Tests (Playwright)

E2E tests require both the backend and frontend servers to be running.

### Step 1 — Start the backend server

Open **Terminal 1** and run:

```
cd backend-nodejs
node src/index.js
```

Wait until you see:
```
✓ Booking statuses ready. Total: 6
✅ Email service ready (Resend API key configured)
Backend running on: https://localhost:9001
```

Keep this terminal open.

### Step 2 — Start the frontend server

Open **Terminal 2** and run:

```
cd frontend
set NODE_TLS_REJECT_UNAUTHORIZED=0
npx next dev --experimental-https -p 9000
```

Wait until you see:
```
▲ Next.js 15.x.x
   - Local: https://localhost:9000
✓ Ready in ~13s
```

Keep this terminal open.

### Step 3 — Run E2E tests

Open **Terminal 3** and run:

```
cd frontend
npm run test:e2e
```

**Expected output:**
```
Running 36 tests using 4 workers
  ok  1 … admin can log in and reach admin area
  ok  2 … homepage loads with Get Started button
  ...
  36 passed (3.8m)
```

**What is tested:**

| Spec File | System Tests |
|---|---|
| `st01-registration.spec.ts` | ST-01 (registration), ST-10 (route protection) |
| `st02-tourism-discovery.spec.ts` | ST-02 (tourism discovery), ST-07 (map) |
| `st03-booking-lifecycle.spec.ts` | ST-03 to ST-05, ST-09, ST-11, ST-12 |
| `st06-st18-admin-workflows.spec.ts` | ST-06 to ST-09, ST-13 to ST-18 |

**Admin credentials used by E2E tests:** `username: admin` / `password: admin123`

---

## Run All Tests at Once

To run unit + integration tests together (no servers needed):

```
cd backend-nodejs
npm run test:unit
npm run test:integration
```

To run everything including E2E (servers must be running first — see Part 3 Steps 1 and 2):

```
cd backend-nodejs
npm run test:unit
npm run test:integration
cd ../frontend
npm run test:e2e
```

---

## Troubleshooting

### "Can't reach database server at localhost:5432"
PostgreSQL is not running. Start it:
- Windows: `net start postgresql-x64-18` (or your version)
- Or open Services and start the PostgreSQL service

### "column hotels.latitude does not exist"
The test database is missing the `20260416_add_hotel_coordinates` migration. Run:
```
cd backend-nodejs
set DATABASE_URL=postgresql://postgres:123123Aa@localhost:5432/tourism_test
set DIRECT_URL=postgresql://postgres:123123Aa@localhost:5432/tourism_test
npx prisma migrate deploy
```

### "Environment variable not found: DIRECT_URL"
The `.env.test` file is missing `DIRECT_URL`. It should already be set. Check that `backend-nodejs/.env.test` contains:
```
DIRECT_URL="postgresql://postgres:123123Aa@localhost:5432/tourism_test"
```

### E2E tests fail with "ERR_CONNECTION_REFUSED"
The frontend or backend server is not running. Make sure both servers are started (Part 3 Steps 1 and 2) before running E2E tests.

### E2E tests fail with "admin can log in" timeout
The backend CORS is blocking the frontend. Check that `backend-nodejs/.env` has:
```
FRONTEND_URL="https://localhost:9000"
```

### Integration tests show "Cannot log after tests are done"
This is a harmless warning — fire-and-forget email callbacks complete after Jest exits. All tests still pass.

### Resend email errors during integration tests
Integration tests redirect all emails to `maryeabebe55@gmail.com` via `TEST_EMAIL_OVERRIDE` in `.env.test`. If you see Resend 403 errors, check that `RESEND_API_KEY` is set in `.env.test`.

---

## Environment Files Reference

### `backend-nodejs/.env` (production/E2E)
```
DATABASE_URL="postgresql://postgres:123123Aa@localhost:5432/tourism_nodejs"
DIRECT_URL="postgresql://postgres:123123Aa@localhost:5432/tourism_nodejs"
FRONTEND_URL="https://localhost:9000"
RESEND_API_KEY="re_jAfhNrbo_2Hiqf2fmvhnMmsydgY8tD3Zk"
JWT_SECRET="north-wollo-tourism-jwt-secret-key-2025-..."
NODE_ENV="development"
PORT=9001
```

### `backend-nodejs/.env.test` (unit + integration tests)
```
DATABASE_URL="postgresql://postgres:123123Aa@localhost:5432/tourism_test"
DIRECT_URL="postgresql://postgres:123123Aa@localhost:5432/tourism_test"
RESEND_API_KEY="re_jAfhNrbo_2Hiqf2fmvhnMmsydgY8tD3Zk"
TEST_EMAIL_OVERRIDE="maryeabebe55@gmail.com"
NODE_ENV="test"
PORT=9002
```

### `frontend/.env.local` (frontend)
```
NEXT_PUBLIC_API_URL=https://localhost:9001/api
```

---

## Test Results Summary (Verified)

| Suite | Tests | Status |
|---|---|---|
| Unit — auth.service | 20 | ✅ Pass |
| Unit — bookings.service | 8 | ✅ Pass |
| Unit — ratings.service | 12 | ✅ Pass |
| Unit — map-points.service | 4 | ✅ Pass |
| Unit — audit.service | 3 | ✅ Pass |
| **Unit Total** | **47** | **✅ All Pass** |
| Integration — auth | 14 | ✅ Pass |
| Integration — booking lifecycle | 17 | ✅ Pass |
| Integration — admin & supporting | 109 | ✅ Pass |
| **Integration Total** | **140** | **✅ All Pass** |
| E2E — ST-01 registration | 6 | ✅ Pass |
| E2E — ST-02 tourism discovery | 8 | ✅ Pass |
| E2E — ST-03 to ST-12 booking/auth | 10 | ✅ Pass |
| E2E — ST-06 to ST-18 admin workflows | 12 | ✅ Pass |
| **E2E Total** | **36** | **✅ All Pass** |
| **Grand Total** | **223** | **✅ All Pass** |
