# Supabase Storage Deployment Checklist

## ✅ Code Changes (COMPLETED)

All code has been updated to use Supabase Storage for image uploads:

- ✅ Tourism gallery images
- ✅ Tourism main images
- ✅ Hotel gallery images
- ✅ Hotel main images
- ✅ Hero images
- ✅ Receipt uploads

## 📋 Deployment Steps

### Step 1: Create Supabase Storage Buckets

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `gclzstgdcguzocxxgkdv`
3. Navigate to **Storage** in the left sidebar
4. Create the following **PUBLIC** buckets:

   | Bucket Name | Public | Description |
   |------------|--------|-------------|
   | `tourism-images` | ✅ Yes | Tourism place images |
   | `hotel-images` | ✅ Yes | Hotel images |
   | `hero-images` | ✅ Yes | Homepage hero images |
   | `receipts` | ✅ Yes | Booking receipts |

5. For each bucket, click **Create bucket** and:
   - Enter the bucket name
   - Check **Public bucket**
   - Click **Create bucket**

### Step 2: Add Environment Variables to Leapcell

1. Go to [Leapcell Dashboard](https://leapcell.io)
2. Select your backend project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:

   ```
   SUPABASE_URL=https://gclzstgdcguzocxxgkdv.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjbHpzdGdkY2d1em9jeHhna2R2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU4NTMwOSwiZXhwIjoyMDkyMTYxMzA5fQ.QavLtsePUWKR0Qp9ns4yDxoK0Sr9SocUUjWmOq4wwrk
   ```

5. Save the changes
6. Redeploy the backend (or it will auto-deploy)

### Step 3: Verify Deployment

1. **Check Environment Variables**:
   ```bash
   curl https://newtwotourism-yomugdagaba9439-uhal9g6y.leapcell.dev/api/debug/env
   ```
   
   Expected response:
   ```json
   {
     "supabaseConfigured": true,
     "supabaseUrl": "https://gclzstgdcguzocxxgkdv.supabase.co",
     "hasServiceKey": true
   }
   ```

2. **Test Image Upload**:
   - Log in to admin panel
   - Create or edit a tourism place
   - Upload an image
   - Check that the image URL starts with: `https://gclzstgdcguzocxxgkdv.supabase.co/storage/v1/object/public/`

3. **Verify Image Display**:
   - Visit the tourism place page
   - Confirm images are visible
   - Check browser console for any 404 errors

### Step 4: Clean Up Old Images (Optional)

After confirming new uploads work:

1. Old images in the database will still have `/uploads/` URLs
2. These will not display (404 errors)
3. You can either:
   - **Option A**: Re-upload all images through the admin panel
   - **Option B**: Keep old images as-is (they won't display but won't break anything)

## 🔍 Troubleshooting

### Images Not Displaying

**Check 1: Environment Variables**
```bash
curl https://newtwotourism-yomugdagaba9439-uhal9g6y.leapcell.dev/api/debug/env
```

If `supabaseConfigured: false`:
- Verify environment variables are set in Leapcell
- Redeploy the backend

**Check 2: Bucket Permissions**

1. Go to Supabase Dashboard → Storage
2. Click on each bucket
3. Verify **Public** is enabled
4. Check bucket policies allow public read access

**Check 3: Image URLs**

Inspect the image URL in the database:
- ✅ Correct: `https://gclzstgdcguzocxxgkdv.supabase.co/storage/v1/object/public/tourism-images/...`
- ❌ Wrong: `/uploads/tourism-images/...` (old local storage)
- ❌ Wrong: `https://newtwotourism-yomugdagaba9439-uhal9g6y.leapcell.dev/uploads/...` (won't work)

**Check 4: Backend Logs**

Look for these messages in Leapcell logs:
- ✅ `✓ Uploaded to Supabase Storage: https://...`
- ⚠️ `⚠️  Using local storage (Supabase not configured)`

### Upload Fails

**Error: "Supabase client not initialized"**
- Environment variables not set
- Add `SUPABASE_SERVICE_KEY` to Leapcell

**Error: "Failed to upload file"**
- Bucket doesn't exist
- Create the bucket in Supabase Dashboard
- Ensure bucket name matches exactly

**Error: "Permission denied"**
- Using wrong key (anon key instead of service key)
- Verify you're using the **service_role** key, not the **anon** key

## 📊 Expected Behavior

### Before Supabase Setup
- ⚠️ Console warning: `⚠️  SUPABASE_SERVICE_KEY not set. File uploads will fail.`
- ⚠️ Upload warning: `⚠️  Using local storage (Supabase not configured)`
- ❌ Images don't display on deployed site

### After Supabase Setup
- ✅ Console message: `✓ Uploaded to Supabase Storage: https://...`
- ✅ Images display correctly
- ✅ Image URLs start with `https://gclzstgdcguzocxxgkdv.supabase.co/`

## 🔐 Security Notes

- The **service_role** key has full access to your Supabase project
- Never expose this key in frontend code
- Only use it in backend environment variables
- The key is safe in Leapcell environment variables (server-side only)

## 📝 Summary

1. ✅ Code is ready (all upload methods updated)
2. ⏳ Create 4 public buckets in Supabase
3. ⏳ Add environment variables to Leapcell
4. ⏳ Test image uploads
5. ⏳ Verify images display correctly

Once steps 2-5 are complete, all new image uploads will work correctly on the deployed application!
