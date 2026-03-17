-- Fix the TourismCategory enum to match the original Spring Boot backend
-- This script updates the database to use the correct category values

-- Step 1: Create a new enum type with the correct values
CREATE TYPE "TourismCategory_new" AS ENUM ('HERITAGE', 'HIGHLAND', 'CAVERN', 'AQUATICS', 'CULTURE', 'MODERN');

-- Step 2: Update the tourism_places table to use the new enum
ALTER TABLE "tourism_places" 
  ALTER COLUMN "category" TYPE "TourismCategory_new" USING "category"::text::"TourismCategory_new";

-- Step 3: Drop the old enum
DROP TYPE "TourismCategory";

-- Step 4: Rename the new enum to the original name
ALTER TYPE "TourismCategory_new" RENAME TO "TourismCategory";
