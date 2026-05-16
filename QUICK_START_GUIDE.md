# Quick Start Guide - Fix Image Display Issue

## 🎯 Problem
Images uploaded from local admin panel are not displaying on the deployed application (Vercel + Leapcell).

## 🔧 Solution
Use Supabase Storage instead of local filesystem storage.

## ⚡ Quick Steps (5 minutes)

### 1. Create Supabase Storage Buckets (2 minutes)

1. Go to: https://supabase.com/dashboard/project/gclzstgdcguzocxxgkdv/storage/buckets
2. Click **New bucket** button
3. Create these 4 buckets (one by one):

   **Bucket 1:**
   - Name: `tourism-images`
   - ✅ Check "Public bucket"
   - Click **Create bucket**

   **Bucket 2:**
   - Name: `hotel-images`
   - ✅ Check "Public bucket"
   - Click **Create bucket**

   **Bucket 3:**
   - Name: `hero-images`
   - ✅ Check "Public bucket"
   - Click **Create bucket**

   **Bucket 4:**
   - Name: `receipts`
   - ✅ Check "Public bucket"
   - Click **Create bucket**

### 2. Add Environment Variables to Leapcell (2 minutes)

1. Go to: https://leapcell.io (your backend dashboard)
2. Select your project: `newtwotourism-yomugdagaba9439-uhal9g6y`
3. Go to **Settings** → **Environment Variables**
4. Add these two variables:

   **Variable 1:**
   ```
   Name: SUPABASE_URL
   Value: https://gclzstgdcguzocxxgkdv.supabase.co
   ```

   **Variable 2:**
   ```
   Name: SUPABASE_SERVICE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjbHpzdGdkY2d1em9jeHhna2R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU4NTMwOSwiZXhwIjoyMDkyMTYxMzA5fQ.QavLtsePUWKR0Qp9ns4yDxoK0Sr9SocUUjWmOq4wwrk
   ```

5. Click **Save**
6. Wait for automatic redeployment (or manually redeploy)

### 3. Test (1 minute)

1. **Verify Configuration:**
   ```
   Open: https://newtwotourism-yomugdagaba9439-uhal9g6y.leapcell.dev/api/debug/env
   ```
   
   Should show:
   ```json
   {
     "supabaseConfigured": true,
     "supabaseUrl": "https://gclzstgdcguzocxxgkdv.supabase.co",
     "hasServiceKey": true
   }
   ```

2. **Test Upload:**
   - Log in to admin panel
   - Create a new tourism place with an image
   - Check that the image displays correctly
   - Image URL should start with: `https://gclzstgdcguzocxxgkdv.supabase.co/`

## ✅ Done!

All new image uploads will now work correctly on the deployed application.

## 📝 Notes

- **Old images** with `/uploads/` URLs will not display (they're on the ephemeral filesystem)
- **New images** will be stored in Supabase Storage and display correctly
- To fix old images: re-upload them through the admin panel

## 🆘 Need Help?

See the detailed guide: `SUPABASE_DEPLOYMENT_CHECKLIST.md`

## 🔗 Important Links

- **Backend**: https://newtwotourism-yomugdagaba9439-uhal9g6y.leapcell.dev
- **Frontend**: https://newtwotourism.vercel.app (or your Vercel URL)
- **Supabase Dashboard**: https://supabase.com/dashboard/project/gclzstgdcguzocxxgkdv
- **Leapcell Dashboard**: https://leapcell.io
- **GitHub Repo**: https://github.com/yomugdagaba-a/newtwotourism
