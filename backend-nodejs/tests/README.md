# North Wollo Tourism — Complete Test Suite

## Coverage Map (Chapter 6 → Test Files)

| Chapter 6 Section | Test IDs | File |
|---|---|---|
| Unit Tests (6.2.2) | UT-01 to UT-17 | `tests/unit/*.test.js` |
| Integration Tests (6.2.3) | IT-01 to IT-12 | `tests/integration/*.test.js` |
| Functional Tests (6.2.4) | FT-AUTH-*, FT-TRM-*, FT-BKG-*, FT-ADM-*, FT-HTL-*, FT-RD-*, FT-HS-*, FT-GD-*, FT-MAP-*, FT-RT-*, FT-USR-* | Postman Collection |
| System Tests (6.2.5) | ST-01 to ST-18 | `frontend/tests/e2e/*.spec.ts` |
| Security Tests (6.2.7) | SEC-01 to SEC-15 | Postman Collection + Integration tests |
| Formal Test Cases (6.4) | TC-AUTH-*, TC-TRM-*, TC-HTL-*, TC-BKG-*, TC-ADM-*, TC-MAP-*, TC-RD-*, TC-GD-*, TC-RT-*, TC-HS-*, TC-USR-*, TC-AUD-*, TC-VAL-*, TC-SEC-HDR-*, TC-ERR-* | All test files |

---

## Quick Start

### 1. Install dependencies
```bash
cd backend-nodejs && npm install
cd ../frontend && npm install && npx playwright install
```

---

## Unit Tests (no database needed)

Covers: UT-01 to UT-17 (all 17 unit test cases from chapter 6)

```bash
cd backend-nodejs
npm run test:unit
```

| File | Covers |
|---|---|
| `tests/unit/auth.service.test.js` | UT-01 to UT-07, UT-04 (OTP), TC-AUTH-01 to TC-AUTH-14, FT-AUTH-09 |
| `tests/unit/bookings.service.test.js` | UT-08 to UT-10, TC-BKG-09, TC-BKG-10 |
| `tests/unit/ratings.service.test.js` | UT-11, UT-12, FT-RT-07, FT-RT-08, TC-RT-04, TC-RT-05 |
| `tests/unit/map-points.service.test.js` | UT-13, UT-14 |
| `tests/unit/audit.service.test.js` | UT-16, UT-17 |

---

## Integration Tests (requires test database)

Covers: IT-01 to IT-12, all TC-* formal test cases

### Setup
```bash
# 1. Create test database
createdb tourism_test

# 2. Run migrations
DATABASE_URL="postgresql://user:pass@localhost:5432/tourism_test" npx prisma migrate deploy

# 3. Seed admin user (username: admin, password: Admin123!)
DATABASE_URL="postgresql://user:pass@localhost:5432/tourism_test" node prisma/seed.js
```

```bash
cd backend-nodejs
DATABASE_URL="postgresql://user:pass@localhost:5432/tourism_test" npm run test:integration
```

| File | Covers |
|---|---|
| `tests/integration/auth.integration.test.js` | IT-01, IT-02, IT-03, TC-AUTH-*, SEC-03, SEC-07, SEC-09, SEC-15 |
| `tests/integration/booking.integration.test.js` | IT-04, IT-05, IT-09, IT-10, TC-BKG-01 to TC-BKG-16 |
| `tests/integration/admin-supporting.integration.test.js` | IT-06, IT-07, IT-08, IT-11, IT-12, TC-ADM-01 to TC-ADM-24, TC-MAP-*, TC-RD-*, TC-GD-*, TC-RT-*, TC-HS-*, TC-USR-*, TC-AUD-*, TC-VAL-*, TC-SEC-HDR-*, TC-ERR-*, SEC-04, SEC-06, SEC-08, SEC-10, SEC-12 |

---

## Postman Collection (functional + security tests)

Covers: All FT-* functional tests, SEC-01, SEC-03, SEC-07, SEC-09, SEC-11, SEC-15

### Setup
1. Open Postman → Import → `tests/postman/NorthWolloTourism.postman_collection.json`
2. Set `baseUrl` variable to your backend URL (default: `https://localhost:8080`)
3. Run "Login ADMIN" first to populate `adminToken`
4. Use Collection Runner → Run All → all requests run in order

### Variable flow (auto-set by earlier requests)
`adminToken` → `clientToken` → `tourismId` → `hotelId` → `bookingId` → `roadId` → etc.

---

## E2E Tests (requires running frontend + backend)

Covers: ST-01 to ST-18 (all 18 system test cases from chapter 6)

### Setup
```bash
# Terminal 1 — start backend
cd backend-nodejs && npm run dev

# Terminal 2 — start frontend
cd frontend && npm run dev:win

# Terminal 3 — run E2E tests
cd frontend && npm run test:e2e
```

| File | Covers |
|---|---|
| `tests/e2e/st01-registration.spec.ts` | ST-01, ST-10 |
| `tests/e2e/st02-tourism-discovery.spec.ts` | ST-02, ST-07 |
| `tests/e2e/st03-booking-lifecycle.spec.ts` | ST-03, ST-04, ST-05, ST-09, ST-11, ST-12 |
| `tests/e2e/st06-st18-admin-workflows.spec.ts` | ST-06, ST-07b, ST-08, ST-13, ST-14, ST-15, ST-16, ST-17, ST-18 |

---

## Security Tests Reference

| Test ID | Method | Where |
|---|---|---|
| SEC-01 Rate limiting (100+ requests) | Postman Collection Runner | Postman — section 10 |
| SEC-02 Account lockout after 5 failures | Integration test | `admin-supporting.integration.test.js` |
| SEC-03 Tampered JWT → 401 | Integration + Postman | Both |
| SEC-04 Expired token → 401 | Integration test | `admin-supporting.integration.test.js` |
| SEC-05 OTP brute force (3 attempts) | Unit test | `auth.service.test.js` (UT-04) |
| SEC-06 OTP resend cooldown → 400 | Integration test | `admin-supporting.integration.test.js` |
| SEC-07 SQL injection → safe response | Integration + Postman | Both |
| SEC-08 XSS — CSP header present | Integration test | `admin-supporting.integration.test.js` |
| SEC-09 Clickjacking — X-Frame-Options | Integration + Postman | Both |
| SEC-10 CORS — unauthorized origin rejected | Integration test | `admin-supporting.integration.test.js` |
| SEC-11 Vertical privilege escalation → 403 | Integration + Postman | Both |
| SEC-12 Horizontal privilege escalation → 403 | Integration test | `admin-supporting.integration.test.js` |
| SEC-13 HTTPS enforcement (HSTS) | Manual / BurpSuite | Check response headers in production |
| SEC-14 User enumeration prevention | Unit + Integration | `auth.service.test.js`, `auth.integration.test.js` |
| SEC-15 Refresh token reuse after logout | Integration + Postman | Both |

---

## Performance Tests (k6)

Chapter 6 section 6.2.6 defines 4 load scenarios. Run with k6:

```bash
# Install k6: https://k6.io/docs/getting-started/installation/
k6 run --vus 50 --duration 30s tests/performance/public-browsing.js
```

Performance test scripts are not auto-generated (require k6 installation).
The acceptance criteria from chapter 6 are:
- Public tourism search: < 300ms at 50 concurrent users
- Authenticated dashboard: < 400ms at 20 concurrent users
- Admin operations: < 500ms at 5 concurrent users
- Login endpoint: rate limiting engages at threshold
