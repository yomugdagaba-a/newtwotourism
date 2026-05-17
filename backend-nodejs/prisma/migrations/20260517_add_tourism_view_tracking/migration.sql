-- CreateTable
CREATE TABLE IF NOT EXISTS "TourismView" (
    "id" SERIAL NOT NULL,
    "tourismPlaceId" INTEGER NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourismView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TourismView_tourismPlaceId_idx" ON "TourismView"("tourismPlaceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TourismView_sessionId_idx" ON "TourismView"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TourismView_viewedAt_idx" ON "TourismView"("viewedAt");

-- AddForeignKey
ALTER TABLE "TourismView" ADD CONSTRAINT "TourismView_tourismPlaceId_fkey" FOREIGN KEY ("tourismPlaceId") REFERENCES "TourismPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
