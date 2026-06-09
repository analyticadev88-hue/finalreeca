import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Case-insensitive status matching to handle both "confirmed" and "Confirmed"
const VALID_MANIFEST_STATUSES = [
  "confirmed", "Confirmed",
  "completed", "Completed",
  "pending", "Pending",
];

export async function GET(req: NextRequest, context: { params: { busId: string } }) {
  // Await params as required by Next.js App Router
  const params = await context.params;
  const busId = params.busId;

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { tripId: busId },
        { returnTripId: busId }
      ],
      bookingStatus: { in: VALID_MANIFEST_STATUSES }
    },
    include: { agent: true, passengers: true, trip: true, returnTrip: true },
    orderBy: { createdAt: "asc" },
  });

  let trip = bookings.length > 0 ? bookings[0].trip : null;
  if (!trip) {
    trip = await prisma.trip.findUnique({
      where: { id: busId }
    });
  }

  return NextResponse.json({ bookings, trip });
}
