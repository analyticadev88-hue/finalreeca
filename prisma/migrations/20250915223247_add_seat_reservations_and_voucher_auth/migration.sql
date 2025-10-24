-- CreateTable
CREATE TABLE "VoucherAuthorization" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminEmail" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherAuthorization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VoucherAuthorization_token_key" ON "VoucherAuthorization"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherAuthorization_bookingId_key" ON "VoucherAuthorization"("bookingId");

-- AddForeignKey
ALTER TABLE "VoucherAuthorization" ADD CONSTRAINT "VoucherAuthorization_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
