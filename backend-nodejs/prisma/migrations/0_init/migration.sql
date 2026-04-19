-- CreateEnum
CREATE TYPE "TourismCategory" AS ENUM ('HERITAGE', 'HIGHLAND', 'CAVERN', 'AQUATICS', 'CULTURE', 'MODERN');

-- CreateEnum
CREATE TYPE "PlaceStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'OWNER_ACCEPTED', 'COST_PROPOSED', 'PAID', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MapPointType" AS ENUM ('TOURISM_PLACE', 'HOTEL', 'ROAD');

-- CreateEnum
CREATE TYPE "RoadType" AS ENUM ('CAR', 'FOOT', 'HORSE', 'PLANE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_CONFIRM', 'EMAIL_VERIFICATION_SEND', 'EMAIL_VERIFICATION_CONFIRM', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'AUTHORIZATION_CHECK', 'TOKEN_REFRESH', 'SESSION_EXPIRED', 'EXPORT', 'IMPORT');

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "ipAddress" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_lockouts" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "lockedUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "account_lockouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tourism_places" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categories" "TourismCategory"[] DEFAULT ARRAY[]::"TourismCategory"[],
    "description" TEXT NOT NULL,
    "wereda" TEXT NOT NULL,
    "kebele" TEXT NOT NULL,
    "bestTime" TEXT,
    "peaceInfo" TEXT,
    "visitTime" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PlaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "viewersCount" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tourism_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tourism_images" (
    "id" SERIAL NOT NULL,
    "tourismPlaceId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tourism_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tourism_ratings" (
    "id" SERIAL NOT NULL,
    "tourismPlaceId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tourism_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" SERIAL NOT NULL,
    "tourismPlaceId" INTEGER,
    "ownerId" INTEGER,
    "name" TEXT NOT NULL,
    "starRating" INTEGER NOT NULL,
    "contactInfo" TEXT NOT NULL,
    "policies" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_images" (
    "id" SERIAL NOT NULL,
    "hotelId" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hotel_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_ratings" (
    "id" SERIAL NOT NULL,
    "hotelId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hotel_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_statuses" (
    "id" SERIAL NOT NULL,
    "name" "BookingStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "booking_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_bookings" (
    "id" SERIAL NOT NULL,
    "hotelId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "numberOfGuests" INTEGER NOT NULL,
    "numberOfRooms" INTEGER,
    "specialRequests" TEXT,
    "clientPhone" TEXT,
    "clientEmail" TEXT,
    "totalCost" DECIMAL(10,2),
    "receiptImageUrl" TEXT,
    "rejectionReason" TEXT,
    "problemReport" TEXT,
    "problemReported" BOOLEAN NOT NULL DEFAULT false,
    "statusId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hotel_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_messages" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "isFromOwner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "booking_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horse_services" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricePerHour" DECIMAL(10,2) NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "roadInfoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "horse_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "language_guiders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "languages" TEXT[],
    "experience" TEXT,
    "contactInfo" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tourismPlaceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "language_guiders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "map_points" (
    "id" SERIAL NOT NULL,
    "tourismPlaceId" INTEGER,
    "name" TEXT NOT NULL,
    "type" "MapPointType" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "map_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "road_infos" (
    "id" SERIAL NOT NULL,
    "tourismPlaceId" INTEGER,
    "name" TEXT NOT NULL,
    "type" "RoadType" NOT NULL,
    "description" TEXT,
    "condition" TEXT,
    "distance" DOUBLE PRECISION,
    "distanceByCar" DOUBLE PRECISION,
    "distanceByFoot" DOUBLE PRECISION,
    "distanceByHorse" DOUBLE PRECISION,
    "distanceByPlane" DOUBLE PRECISION,
    "totalDistance" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "road_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_images" (
    "id" SERIAL NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hero_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log_entries" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER,
    "changes" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable (join table for User <-> Role)
CREATE TABLE "_RoleToUser" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON "_RoleToUser"("A", "B");
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser"("B");

-- Unique constraints
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");
CREATE UNIQUE INDEX "account_lockouts_userId_key" ON "account_lockouts"("userId");
CREATE UNIQUE INDEX "tourism_ratings_tourismPlaceId_userId_key" ON "tourism_ratings"("tourismPlaceId", "userId");
CREATE UNIQUE INDEX "hotel_ratings_hotelId_userId_key" ON "hotel_ratings"("hotelId", "userId");
CREATE UNIQUE INDEX "booking_statuses_name_key" ON "booking_statuses"("name");

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "account_lockouts" ADD CONSTRAINT "account_lockouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tourism_images" ADD CONSTRAINT "tourism_images_tourismPlaceId_fkey" FOREIGN KEY ("tourismPlaceId") REFERENCES "tourism_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tourism_ratings" ADD CONSTRAINT "tourism_ratings_tourismPlaceId_fkey" FOREIGN KEY ("tourismPlaceId") REFERENCES "tourism_places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tourism_ratings" ADD CONSTRAINT "tourism_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_tourismPlaceId_fkey" FOREIGN KEY ("tourismPlaceId") REFERENCES "tourism_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hotel_images" ADD CONSTRAINT "hotel_images_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hotel_ratings" ADD CONSTRAINT "hotel_ratings_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hotel_ratings" ADD CONSTRAINT "hotel_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "booking_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "booking_messages" ADD CONSTRAINT "booking_messages_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "hotel_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_messages" ADD CONSTRAINT "booking_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "horse_services" ADD CONSTRAINT "horse_services_roadInfoId_fkey" FOREIGN KEY ("roadInfoId") REFERENCES "road_infos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "language_guiders" ADD CONSTRAINT "language_guiders_tourismPlaceId_fkey" FOREIGN KEY ("tourismPlaceId") REFERENCES "tourism_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "map_points" ADD CONSTRAINT "map_points_tourismPlaceId_fkey" FOREIGN KEY ("tourismPlaceId") REFERENCES "tourism_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "road_infos" ADD CONSTRAINT "road_infos_tourismPlaceId_fkey" FOREIGN KEY ("tourismPlaceId") REFERENCES "tourism_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_RoleToUser" ADD CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
