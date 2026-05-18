# Tourism System

A full-stack tourism management system for Ethiopia with hotel bookings, tourism sites, horse services, language guiders, and road information.

## 🚀 Quick Start

### Backend (Port 9001)
```bash
cd backend-nodejs
npm install
npm run dev
```
Runs on: `https://localhost:9001`

### Frontend (Port 9000)
```bash
cd frontend
npm install
npm run dev
```
Runs on: `https://localhost:9000`

## 📚 Documentation

- **Architecture:** [`FRONTEND_ARCHITECTURE_AND_FLOW.md`](./FRONTEND_ARCHITECTURE_AND_FLOW.md)
- **Security:** [`SECURITY_AND_LIBRARIES_DOCUMENTATION.md`](./SECURITY_AND_LIBRARIES_DOCUMENTATION.md)
- **Rate Limiting:** [`RATE_LIMITING_DOCUMENTATION.md`](./RATE_LIMITING_DOCUMENTATION.md)
- **Testing:** [`TESTING_GUIDE.md`](./TESTING_GUIDE.md)
- **Cleanup:** [`CLEANUP_SUMMARY.md`](./CLEANUP_SUMMARY.md)

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Maps:** Leaflet + React-Leaflet
- **HTTP Client:** Fetch API
- **Deployment:** Vercel

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (access + refresh tokens)
- **Password Hashing:** Bcrypt
- **File Storage:** Supabase Storage
- **Email:** Nodemailer (Gmail SMTP)
- **Deployment:** Leapcell.io

## ✨ Features

### User Features
- 🔐 User authentication (register, login, email verification)
- 🏨 Browse and book hotels
- 🗺️ Explore tourism places with maps
- 🐴 Book horse services
- 👨‍🏫 Find language guiders
- 🛣️ View road information and routes
- ⭐ Rate and review hotels/tourism places
- 📱 Responsive design for all devices
- 🔒 Auto-logout after 7 minutes of inactivity

### Hotel Owner Features
- 🏨 Manage hotel listings
- 📊 View and manage bookings
- 💬 Communicate with clients via booking messages
- 📸 Upload hotel images
- 📈 View booking statistics

### Admin Features
- 👥 User management (roles, blocking)
- 🏨 Manage all hotels and tourism places
- 📋 Audit log viewer (track all actions)
- 🚨 Security alerts (XSS, SQL injection attempts)
- 🗺️ Manage map points and roads
- 🐴 Manage horse services
- 👨‍🏫 Manage language guiders

### Security Features
- 🔐 JWT authentication with refresh tokens
- 🔒 Bcrypt password hashing
- 🛡️ XSS prevention
- 🛡️ SQL injection protection
- ⏱️ Rate limiting (9 specialized limiters)
- 📝 Comprehensive audit logging
- 🚫 CORS protection
- 🔒 Security headers
- ⏰ Inactivity timeout
- 🚨 Attack detection and logging

## 🌐 Deployment

### Production URLs
- **Backend:** `https://newtwotourism-yomugdagaba9439-uhal9g6y.leapcell.dev/api`
- **Frontend:** `https://newtwotourism.vercel.app`
- **Platform:** Leapcell.io (Backend) + Vercel (Frontend)

### Environment Variables

**Backend (Leapcell)**
```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Server
FRONTEND_URL="https://newtwotourism.vercel.app"
PORT=9001
NODE_ENV="production"

# JWT Authentication
JWT_SECRET="your-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7h"

# Email (Gmail)
GMAIL_USER="abelemanyo58@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"

# Supabase Storage
SUPABASE_URL="https://pjntagdpfguazoongbev.supabase.co"
SUPABASE_SERVICE_KEY="your-key"

# Rate Limiting & Security
LOGOUT_EXPIRATION_MINUTES=15
MAX_FAILED_ATTEMPTS=5
MAX_IP_ATTEMPTS_PER_HOUR=100
MAX_FILE_SIZE=10485760

# Audit
AUDIT_ENABLED=true
AUDIT_RETENTION_DAYS=90

# Uploads
UPLOAD_DIR="uploads"
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL="https://newtwotourism-yomugdagaba9439-uhal9g6y.leapcell.dev/api"
```

**Frontend (.env.production)** - For Vercel
```env
NEXT_PUBLIC_API_URL="https://newtwotourism-yomugdagaba9439-uhal9g6y.leapcell.dev/api"
```

## 📦 Project Structure

```
TourismSystem/
├── backend-nodejs/          # Backend API
│   ├── src/
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, audit, rate limiting
│   │   ├── dto/             # Data validation
│   │   └── index.js         # Server entry (Port 9001)
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── uploads/             # File storage
│
├── frontend/                # Frontend app
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   ├── components/      # UI components
│   │   ├── services/        # API services
│   │   │   └── api.ts       # Main API config
│   │   ├── store/           # Zustand state
│   │   ├── hooks/           # Custom hooks
│   │   └── types/           # TypeScript types
│   └── public/              # Static assets
│
└── Documentation/           # Project docs
```

## 🔑 Key File Locations

| File | Location | Purpose |
|------|----------|---------|
| API Config | `frontend/src/services/api.ts` | Main API configuration |
| Auth Store | `frontend/src/store/useAuthStore.ts` | Authentication state |
| Rate Limiting | `backend-nodejs/src/middleware/rate-limit.middleware.js` | Rate limiters |
| Database Schema | `backend-nodejs/prisma/schema.prisma` | Database structure |
| Server Entry | `backend-nodejs/src/index.js` | Backend server (Port 9001) |

## 🧪 Testing

See [`TESTING_GUIDE.md`](./TESTING_GUIDE.md) for detailed testing procedures.

### Quick Test
```bash
# Backend
cd backend-nodejs
npm run dev

# Frontend
cd frontend
npm run dev

# Access
Frontend: https://localhost:9000
Backend: https://localhost:9001
Admin: https://localhost:9000/admin
```

## 📝 License

MIT

## 👥 Contributors

- Yomugdagaba (Developer)

---

**Status:** ✅ Production-Ready  
**Last Updated:** May 18, 2026

## Project Structure

- `backend-nodejs/` - Node.js/Express backend with Prisma ORM
- `frontend/` - Next.js frontend application

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Backend Setup (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `cd backend-nodejs && npm install && npx prisma generate`
   - **Start Command**: `cd backend-nodejs && npm start`
   - **Root Directory**: Leave empty or set to `/`
4. Add environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Secret key for JWT tokens
   - `PORT` - 3001 (or your preferred port)
   - `NODE_ENV` - production
   - `FRONTEND_URL` - Your Vercel frontend URL

## Frontend Setup (Vercel)

1. Import your GitHub repository to Vercel
2. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` - Your Render backend URL

## Local Development

### Backend
```bash
cd backend-nodejs
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features

- User authentication and authorization
- Hotel management and bookings
- Tourism site listings
- Admin dashboard with audit logs
- Rating and review system
- Map integration for locations

## License

MIT
## Local Development SSL Certificates

Both frontend and backend use self-signed SSL certificates for local HTTPS development.

### Generate certificates (if missing):

**Using mkcert (recommended):**
```bash
# Install mkcert
# Windows: choco install mkcert
# Mac: brew install mkcert

# Generate certificates
mkcert -install
mkcert -key-file backend-nodejs/certificates/localhost-key.pem -cert-file backend-nodejs/certificates/localhost.pem localhost
mkcert -key-file frontend/certificates/localhost-key.pem -cert-file frontend/certificates/localhost.pem localhost
