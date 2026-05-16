# Supabase Storage Setup Guide

## Why Supabase Storage?

Leapcell's filesystem is **ephemeral** - files uploaded to local storage are lost on container restart and cannot be served via HTTP. Supabase Storage provides:
- ✅ Persistent, reliable storage
- ✅ Public URLs that work from anywhere
- ✅ Free tier (1GB storage)
- ✅ CDN-backed for fast delivery

## Step 1: Create Storage Buckets in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `tourism`
3. Go to **Storage** in the left sidebar
4. Create the following buckets (click "New bucket"):

### Buckets to Create:

| Bucket Name | Public | Description |
|------------|--------|-------------|
| `tourism-images` | ✅ Yes | Tourism place images |
| `hotel-images` | ✅ Yes | Hotel images |
| `hero-images` | ✅ Yes | Homepage hero images |
| `receipts` | ✅ Yes | Booking receipt uploads |

**Important:** Make sure to check "Public bucket" when creating each bucket!

## Step 2: Add Environment Variables to Leapcell

Go to your Leapcell service → **Env Variables** and add:

```
SUPABASE_URL=https://gclzstgdcguzocxxgkdv.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjbHpzdGdkY2d1em9jeHhna2R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU4NTMwOSwiZXhwIjoyMDkyMTYxMzA5fQ.QavLtsePUWKR0Qp9ns4yDxoK0Sr9SocUUjWmOq4wwrk
```

Then click **"Save & Deploy Env"**

## Step 3: Test Image Upload

After Leapcell redeploys (1-2 minutes):

1. Go to your admin panel
2. Create a new tourism place or hotel
3. Upload an image
4. The image should now be stored in Supabase Storage and display correctly!

## How It Works

### Before (Local Storage - Doesn't Work on Leapcell):
```
Upload → /app/backend-nodejs/uploads/tourism-images/abc123.jpg
URL → https://backend.leapcell.dev/uploads/tourism-images/abc123.jpg ❌ (404 Error)
```

### After (Supabase Storage - Works Everywhere):
```
Upload → Supabase Storage bucket
URL → https://gclzstgdcguzocxxgkdv.supabase.co/storage/v1/object/public/tourism-images/abc123.jpg ✅
```

## Current Implementation Status

✅ **Completed:**
- Supabase Storage service created
- Tourism gallery image upload integrated
- Multer configured for memory storage (required for Supabase)
- Environment variable configuration

⏳ **Remaining (Optional - can be done later):**
- Update hotel image uploads to use Supabase
- Update hero image uploads to use Supabase
- Update receipt uploads to use Supabase
- Migration script to move existing images from database URLs to Supabase

## Verification

After setup, check:
1. Upload a new tourism image
2. Check the database - the `imageUrl` should start with `https://gclzstgdcguzocxxgkdv.supabase.co/`
3. The image should display correctly on the frontend

## Troubleshooting

### Images still not showing?
1. Check Leapcell logs for errors
2. Verify buckets are created and set to **Public**
3. Verify environment variables are set correctly
4. Check browser console for 404 errors on image URLs

### "Supabase client not initialized" error?
- Make sure `SUPABASE_SERVICE_KEY` is set in Leapcell environment variables
- Redeploy after adding the variable

## Next Steps

Once images are working:
1. Re-upload any existing images (or run migration script)
2. Consider implementing image optimization (resize, compress)
3. Add image deletion when records are deleted
