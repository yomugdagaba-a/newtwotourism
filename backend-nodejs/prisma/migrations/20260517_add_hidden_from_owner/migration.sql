-- Add hiddenFromOwner column to hotel_bookings table
ALTER TABLE "hotel_bookings" ADD COLUMN IF NOT EXISTS "hiddenFromOwner" BOOLEAN NOT NULL DEFAULT false;
