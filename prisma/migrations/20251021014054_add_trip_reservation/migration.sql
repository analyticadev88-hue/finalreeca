-- CreateTable
CREATE TABLE "TripReservation" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "seatsReserved" INTEGER NOT NULL,
    "reservedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripReservation_tripId_idx" ON "TripReservation"("tripId");

-- AddForeignKey
ALTER TABLE "TripReservation" ADD CONSTRAINT "TripReservation_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
