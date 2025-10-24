-- CreateTable
CREATE TABLE "SeatReservation" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "reservedBy" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeatReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeatReservation_expiresAt_idx" ON "SeatReservation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SeatReservation_tripId_seatNumber_key" ON "SeatReservation"("tripId", "seatNumber");
