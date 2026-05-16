# 🚀 Leapcell Deployment Checklist

## ✅ Pre-Deployment (COMPLETED)

- [x] Code cleaned and optimized
- [x] Unwanted files removed
- [x] All changes committed to Git
- [x] Pushed to GitHub repository: https://github.com/abebe55/tourisms.git
- [x] Deployment documentation created
- [x] Environment variables documented
- [x] Database migrations ready

## 📝 Leapcell Deployment Steps

### Step 1: Create Leapcell Account
- [ ] Go to https://leapcell.io
- [ ] Sign up or log in
- [ ] Verify your email

### Step 2: Create PostgreSQL Database
- [ ] Click "Databases" in Leapcell dashboard
- [ ] Click "Create Database"
- [ ] Select PostgreSQL 14+
- [ ] Name: `tourism-db` (or your preferred name)
- [ ] Copy the `DATABASE_URL` connection string
- [ ] Save it securely (you'll need it for backend)

### Step 3: Deploy Backend Service

#### 3.1 Create Backend Service
- [ ] Click "Services" → "New Service"
- [ ] Select "Import from GitHub"
- [ ] Connect your GitHub account
- [ ] Select repository: `abebe55/tourisms`
- [ ] Branch: `main`
- [ ] Root directory: `backend-nodejs`

#### 3.2 Configure Backend Build
- [ ] Build Command: `npm install && npx prisma generate`
- [ ] Start Command: `npm start`
- [ ] Port: `3001`
- [ ] Health Check Path: `/health`

#### 3.3 Add Backend Environment Variables
Copy these from your `.env` file and add to Leapcell:

```env
DATABASE_URL=postgresql://user:password@host:5432/tourism_db
DIRECT_URL=postgresql://user:password@host:5432/tourism_db
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-url.leapcell.app
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000
SESSION_TIMEOUT=900000
```

**Important Notes**:
- Replace `DATABASE_URL` with the one from Step 2
- Generate a strong `JWT_SECRET` (min 32 characters)
- Use Gmail App Password (not regular password)
- Update `FRONTEND_URL` after deploying frontend

#### 3.4 Deploy Backend
- [ ] Click "Deploy"
- [ ] Wait for build to complete (3-5 minutes)
- [ ] Check logs for any errors
- [ ] Copy the backend URL (e.g., `https://tourism-backend.leapcell.app`)

### Step 4: Run Database Migrations

#### 4.1 Access Backend Terminal
- [ ] In Leapcell dashboard, go to your backend service
- [ ] Click "Terminal" or "Console"

#### 4.2 Run Migrations
```bash
cd backend-nodejs
npx prisma migrate deploy
npx prisma db seed
```

- [ ] Verify migrations completed successfully
- [ ] Check that seed data was inserted

### Step 5: Deploy Frontend Service

#### 5.1 Create Frontend Service
- [ ] Click "Services" → "New Service"
- [ ] Select "Import from GitHub"
- [ ] Select repository: `abebe55/tourisms`
- [ ] Branch: `main`
- [ ] Root directory: `frontend`

#### 5.2 Configure Frontend Build
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npm start`
- [ ] Port: `3000`

#### 5.3 Add Frontend Environment Variables
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.leapcell.app
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend-url.leapcell.app
```

**Important**:
- Replace `NEXT_PUBLIC_API_URL` with backend URL from Step 3.4
- `NEXT_PUBLIC_FRONTEND_URL` will be your frontend URL (update after deployment)

#### 5.4 Deploy Frontend
- [ ] Click "Deploy"
- [ ] Wait for build to complete (5-10 minutes)
- [ ] Copy the frontend URL

### Step 6: Update Backend FRONTEND_URL

- [ ] Go back to backend service settings
- [ ] Update `FRONTEND_URL` environment variable with actual frontend URL
- [ ] Redeploy backend service

### Step 7: Post-Deployment Testing

#### 7.1 Test Backend Health
- [ ] Visit: `https://your-backend-url.leapcell.app/health`
- [ ] Should return: `{"status":"ok"}`

#### 7.2 Test Frontend
- [ ] Visit: `https://your-frontend-url.leapcell.app`
- [ ] Homepage should load correctly
- [ ] Check that images load
- [ ] Test navigation

#### 7.3 Test Authentication
- [ ] Click "Register" on frontend
- [ ] Create a new account
- [ ] Check email for verification link
- [ ] Verify email
- [ ] Login with credentials
- [ ] Test logout

#### 7.4 Create Admin User
- [ ] Access database (Leapcell database console)
- [ ] Run SQL:
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
```
- [ ] Logout and login again
- [ ] Verify admin menu appears

#### 7.5 Test Admin Features
- [ ] Login as admin
- [ ] Go to `/admin`
- [ ] Add a tourism place
- [ ] Upload images
- [ ] Add a hotel
- [ ] Test all CRUD operations

### Step 8: Configure Custom Domain (Optional)

- [ ] Go to service settings in Leapcell
- [ ] Click "Domains"
- [ ] Add your custom domain
- [ ] Update DNS records as instructed
- [ ] Update environment variables with new domain
- [ ] Redeploy services

### Step 9: Set Up Monitoring

- [ ] Enable Leapcell monitoring
- [ ] Set up alerts for:
  - Service downtime
  - High error rates
  - Database connection issues
- [ ] Check logs regularly at `/admin/audit`

### Step 10: Backup Strategy

- [ ] Set up automated database backups in Leapcell
- [ ] Test backup restoration process
- [ ] Document backup schedule

## 🔍 Troubleshooting

### Backend Won't Start
1. Check environment variables are set correctly
2. Verify DATABASE_URL format
3. Check build logs for errors
4. Ensure Prisma migrations ran successfully

### Frontend Can't Connect to Backend
1. Verify NEXT_PUBLIC_API_URL is correct
2. Check CORS settings in backend
3. Ensure backend is running and healthy
4. Check browser console for errors

### Database Connection Failed
1. Verify DATABASE_URL is correct
2. Check database service is running
3. Ensure database exists
4. Check firewall/network settings

### Email Not Sending
1. Verify Gmail App Password (not regular password)
2. Check GMAIL_USER and GMAIL_APP_PASSWORD
3. Test with a different email service if needed
4. Check backend logs for email errors

### Images Not Loading
1. Check uploads folder exists
2. Verify image proxy route works: `/api/image-proxy`
3. Check NEXT_PUBLIC_API_URL is correct
4. Verify backend can serve static files

## 📊 Success Criteria

Your deployment is successful when:
- [ ] Backend health check returns OK
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] Email verification works
- [ ] Login/logout works
- [ ] Admin can add tourism places
- [ ] Images upload and display correctly
- [ ] Maps display correctly
- [ ] Booking system works
- [ ] All pages are accessible
- [ ] No console errors
- [ ] Mobile responsive design works

## 🎉 Deployment Complete!

Once all checkboxes are marked:
1. Share the frontend URL with users
2. Monitor logs for first 24 hours
3. Gather user feedback
4. Plan for future updates

## 📞 Support Resources

- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Testing Guide**: `TESTING_GUIDE.md`
- **Repository**: https://github.com/abebe55/tourisms.git
- **Leapcell Docs**: https://docs.leapcell.io

---

**Good luck with your deployment! 🚀**
