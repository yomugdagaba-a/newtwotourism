# Database Migration Fix

## Issue
The `tourism_views` table is missing from the production database.

## Solution

Run this SQL command on your Supabase database:

```sql
-- Create tourism_views table
CREATE TABLE IF NOT EXISTS "public"."tourism_views" (
    "id" SERIAL PRIMARY KEY,
    "tourismPlaceId" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "tourism_views_tourismPlaceId_fkey" 
        FOREIGN KEY ("tourismPlaceId") 
        REFERENCES "public"."tourism_places"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS "tourism_views_tourismPlaceId_sessionId_viewedAt_idx" 
    ON "public"."tourism_views"("tourismPlaceId", "sessionId", "viewedAt");
```

## How to Run

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `gclzstgdcguzocxxgkdv`
3. Go to **SQL Editor**
4. Paste the SQL above
5. Click **Run**

## Alternative: Run Prisma Migration

If you prefer to use Prisma migrations:

```bash
# In your local backend-nodejs directory
npx prisma migrate deploy
```

This will apply all pending migrations to your production database.
