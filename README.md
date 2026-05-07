# Tourism System

A full-stack tourism management system with hotel bookings, tourism sites, and administrative features.

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
