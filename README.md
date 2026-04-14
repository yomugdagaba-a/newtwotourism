# North Wollo Tourism Management System

**Woldia University · Institute of Technology · Software Engineering · 2025 E.C · Group 6**

A full-stack web application for managing tourism destinations, hotels, and bookings in the North Wollo Zone of Ethiopia.

![Node.js](https://img.shields.io/badge/Node.js-20_LTS-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tests](https://img.shields.io/badge/Tests-223%2F223_PASS-brightgreen)

---

## Overview

The North Wollo Tourism Management System is a web platform that:

- Showcases tourism destinations with images, maps, road access, and language guides
- Enables hotel discovery and a complete booking workflow (request → accept → payment → approval)
- Connects tourists with horse transport services and local language guides
- Provides an interactive Leaflet map with geographic coordinates
- Manages all content through a full admin dashboard with audit logging and security monitoring

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express.js, Prisma ORM |
| Database | PostgreSQL 18 |
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| State | Zustand, React Query |
| Maps | Leaflet.js |
| Auth | JWT (access 15 min + refresh 7 days), bcryptjs |
| Email | Nodemailer (SMTP) |

---

## System Architecture

```
Browser
  └── Next.js Frontend (https://localhost:9000)
        └── API Proxy (rewrites)
              └── Express Backend (https://localhost:9001)
                    └── Prisma ORM
                          └── PostgreSQL (tourism_nodejs)
```

---

## Getting Started

### Prerequisites

- Node.js 20 LTS
- PostgreSQL 18
- npm 9+

### 1. Clone

```bash
git clone https://github.com/abebe55/Group6_webservice_project.git
cd Group6_webservice_project
```

### 2. Database

```sql
CREATE DATABASE tourism_nodejs;
```

### 3. Backend

```bash
cd backend-nodejs
npm install
copy .env.example .env   # then fill in your values
npx prisma migrate deploy
node prisma/seed.js
```

Minimum `.env` values:

```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tourism_nodejs"
JWT_SECRET="your-strong-secret-key"
PORT=9001
MAIL_HOST="smtp.gmail.com"
MAIL_USER="your-email@gmail.com"
MAIL_PASSWORD="your-app-password"
```

### 4. Frontend

```bash
cd frontend
npm install
```

---

## Running the Application

```bash
# Terminal 1 — Backend
cd backend-nodejs
npm run dev
# → https://localhost:9001

# Terminal 2 — Frontend (Windows)
cd frontend
npm run dev:win
# → https://localhost:9000
```

> The app uses self-signed SSL certificates. On first visit your browser will show a security warning — click Advanced and proceed.

**Default admin account** (after seeding):
- Username: `admin`
- Password: `admin123`

---

## Features

### Public
- Browse and search tourism places by keyword, category, wereda, or kebele
- View place details: images, road access, horse services, language guides, interactive map
- View hotel listings and details

### Registered Client
- Submit hotel booking requests and track status
- Upload payment receipts and message hotel owners
- Rate and review tourism places and hotels

### Hotel Owner
- Accept/reject bookings, propose costs, approve after payment
- Communicate with guests via booking message thread

### Admin
- Full CRUD: tourism places, hotels, roads, horse services, language guides, map points
- User management: roles, activation, password reset
- Hero image carousel management
- Booking oversight and problem resolution
- Audit log viewer with search, export, and suspicious activity detection
- Security controls: account lockout, IP blocking

---

## Project Structure

```
north-wollo-tourism/
├── backend-nodejs/
│   ├── src/
│   │   ├── controllers/     # 12 route handler files
│   │   ├── services/        # 13 business logic files
│   │   ├── middleware/       # Auth, audit, validation
│   │   └── index.js         # App entry point
│   ├── prisma/
│   │   ├── schema.prisma    # 22 database models
│   │   └── seed.js          # Database seeder
│   ├── tests/
│   │   ├── unit/            # 47 unit tests
│   │   ├── integration/     # 140 integration tests
│   │   └── postman/         # Postman collection (100+ requests)
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages (App Router)
│   │   │   ├── auth/        # Login, register, reset password
│   │   │   ├── tourisms/    # Tourism place pages
│   │   │   ├── hotels/      # Hotel pages
│   │   │   ├── bookings/    # Client booking pages
│   │   │   ├── hotel-owner/ # Owner dashboard
│   │   │   └── admin/       # Admin dashboard (10 sections)
│   │   ├── components/      # Reusable UI components
│   │   ├── services/        # API service functions
│   │   └── store/           # Zustand auth store
│   ├── tests/e2e/           # 36 Playwright E2E tests
│   └── package.json
│
└── README.md
```

---

## API

The backend exposes **189 REST endpoints** across 12 modules.

| Module | Endpoints | Access |
|---|---|---|
| Authentication | 15 | Public |
| User Profile | 4 | AUTH |
| Tourism Places | 15 | Public / ADMIN |
| Hotels | 13 | Public / ADMIN |
| Bookings | 14 | AUTH / ADMIN |
| Ratings | 8 | Public / AUTH |
| Roads & Transport | 11 | Public / ADMIN |
| Map Points | 8 | Public / AUTH |
| Language Guides | 8 | Public / ADMIN |
| Security & Audit | 10 | ADMIN |
| Admin Dashboard | 5 | ADMIN |

---

## Testing

**223 automated tests — all passing.**

| Layer | Tool | Tests |
|---|---|---|
| Unit | Jest | 47 |
| Integration | Jest + Supertest | 140 |
| E2E / System | Playwright | 36 |
| **Total** | | **223** |

### Setup test database (one time)

```sql
CREATE DATABASE tourism_test;
```

Create `backend-nodejs/.env.test` with `DATABASE_URL` pointing to `tourism_test`.

### Run tests

```bash
# Unit tests (no database needed)
cd backend-nodejs
npm run test:unit

# Integration tests (requires tourism_test DB)
npm run test:integration

# E2E tests (requires both servers running)
cd frontend
npm run test:e2e
```

> Tests always use `tourism_test` — the production `tourism_nodejs` database is never touched.

---

## Security

| Feature | Detail |
|---|---|
| Password hashing | bcryptjs, cost factor 10 |
| JWT tokens | Access 15 min · Refresh 7 days |
| Account lockout | After 5 failed attempts (15 min) |
| IP rate limiting | 100 requests/hour per IP |
| Progressive delays | Up to 30s on repeated failures |
| Email OTP | 6-digit, 15 min expiry, max 3 attempts |
| Audit logging | All mutations logged with user, IP, timestamp |
| Security headers | X-Frame-Options, CSP, HSTS, Referrer-Policy |
| SQL injection | Prevented by Prisma parameterized queries |

---

## Team Members

| Name | Student ID | GitHub |
|---|---|---|
| Abebe Marye | 1306166 | [@abebe55](https://github.com/abebe55) |
| Alemeu Mola | — | — |
| Debala | — | [@dabala390-cmd](https://github.com/dabala390-cmd) |
| Ashenafi | — | [@ashe0123](https://github.com/ashe0123) |
| Mohammed | — | [@wassie49](https://github.com/wassie49) |

---

<p align="center">
  North Wollo Tourism Management System &nbsp;·&nbsp; Woldia University &nbsp;·&nbsp; 2025 E.C
</p>
