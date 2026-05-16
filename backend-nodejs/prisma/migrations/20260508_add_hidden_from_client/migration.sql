-- Add hiddenFromClient column to hotel_bookings table
ALTER TABLE "hotel_bookings" ADD COLUMN "hiddenFromClient" BOOLEAN NOT NULL DEFAULT false;
