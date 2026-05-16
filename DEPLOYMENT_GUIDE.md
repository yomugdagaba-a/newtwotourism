# Tourism System - Deployment Guide for Leapcell.io

## Project Overview
This is a full-stack Tourism Management System with:
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Repository**: https://github.com/abebe55/tourisms.git

## Pre-Deployment Checklist ✅

### Completed Cleanup Tasks:
- ✅ Removed empty/unwanted files (Untitled-1.txt)
- ✅ Deleted obsolete documentation files
- ✅ Cleaned up unused audit dashboard pages
- ✅ Removed duplicate README files
- ✅ All code changes committed and pushed to GitHub
- ✅ Database migrations are up to date
- ✅ .gitignore and .leapcellignore properly configured

## Leapcell Deployment Steps

### 1. Backend Deployment (Node.js Service)

#### Service Configuration:
```yaml
name: tourism-backend
type: nodejs
buildCommand: cd backend-nodejs && npm install && npx prisma generate
startCommand: cd backend-nodejs && npm start
port: 3001
```

#### Required Environment Variables:
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/tourism_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.leapcell.app

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000
SESSION_TIMEOUT=900000
```

#### Database Setup:
1. Create PostgreSQL database on Leapcell
2. Run migrations:
   ```bash
   cd backend-nodejs
   npx prisma migrate deploy
   npx prisma db seed
   ```

### 2. Frontend Deployment (Next.js Service)

#### Service Configuration:
```yaml
name: tourism-frontend
type: nextjs
buildCommand: cd frontend && npm install && npm run build
startCommand: cd frontend && npm start
port: 3000
```

#### Required Environment Variables:
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.leapcell.app
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend-domain.leapcell.app
```

### 3. File Storage Configuration

The system uses local file storage for uploads. For production:
- Backend uploads folder: `backend-nodejs/uploads/`
- Ensure persistent volume is mounted at `/app/backend-nodejs/uploads`

### 4. Post-Deployment Tasks

1. **Verify Database Connection**:
   - Check backend logs for successful Prisma connection
   - Test API endpoint: `GET /api/health`

2. **Test Authentication**:
   - Register a new user
   - Verify email functionality
   - Test login/logout

3. **Create Admin User**:
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
   ```

4. **Upload Initial Data**:
   - Login as admin
   - Add tourism places
   - Upload images
   - Add hotels, roads, guiders

## Important Notes

### Security:
- ✅ All sensitive data in environment variables
- ✅ JWT tokens with short expiration
- ✅ Password hashing with bcrypt
- ✅ Email verification required
- ✅ Account lockout after failed attempts
- ✅ Audit logging enabled
- ✅ Inactivity timeout (15 minutes)

### Performance:
- Images are served through Next.js image proxy
- Database queries optimized with Prisma
- Frontend uses React Server Components where possible

### Monitoring:
- Check `/admin/audit` for security events
- Monitor `/admin/audit/management` for system health
- Review audit logs regularly

## Troubleshooting

### Common Issues:

1. **Database Connection Failed**:
   - Verify DATABASE_URL format
   - Check PostgreSQL service is running
   - Ensure database exists

2. **Email Not Sending**:
   - Verify Gmail App Password (not regular password)
   - Check GMAIL_USER and GMAIL_APP_PASSWORD
   - Enable "Less secure app access" if needed

3. **Images Not Loading**:
   - Check uploads folder permissions
   - Verify NEXT_PUBLIC_API_URL is correct
   - Check image proxy route `/api/image-proxy`

4. **CORS Errors**:
   - Verify FRONTEND_URL in backend .env
   - Check CORS configuration in backend/src/index.js

## Support

For issues or questions:
- Repository: https://github.com/abebe55/tourisms.git
- Check TESTING_GUIDE.md for test scenarios
- Review backend logs for detailed error messages

## Version Information

- Node.js: 18.x or higher
- PostgreSQL: 14.x or higher
- Next.js: 15.1.3
- Prisma: 6.2.1

---

**Deployment Date**: May 16, 2026
**Last Updated**: May 16, 2026
**Status**: ✅ Ready for Production Deployment
