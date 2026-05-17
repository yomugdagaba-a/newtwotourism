-- Add active column to road_infos table
-- This column was in the Prisma schema but missing from the initial migration

ALTER TABLE "road_infos" ADD COLUMN IF NOT EXISTS "active" BOOLEAN NOT NULL DEFAULT true;
