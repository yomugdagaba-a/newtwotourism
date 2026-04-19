-- Add latitude and longitude to hotels table for map integration
ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "hotels" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
