import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Case-insensitive status matching to handle both "confirmed" and "Confirmed"
const VALID_MANIFEST_STATUSES = [
  "confirmed", "Confirmed",
  "completed", "Completed",
  "pending", "Pending",
];

const VALID_MANIFEST_PAYMENT_STATUSES = [
  "paid", "Paid",
  "pending", "Pending",
];

export async function GET(req: NextRequest, context: { params: { busId: string } }) {
  // Await params as required by Next.js App Router
  const params = await context.params;
  const busId = params.busId;

  const requestedTrip = await prisma.trip.findUnique({ where: { id: busId } });
  if (!requestedTrip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  // Resolve the full bus run: the seat-source (parent) trip plus every child
  // segment trip. Seat inventory lives on the parent (see lib/tripParent.ts),
  // so the manifest for any trip on the bus covers the whole run.
  let parentTrip = requestedTrip;
  if (requestedTrip.parentTripId) {
    const foundParent = await prisma.trip.findUnique({
      where: { id: requestedTrip.parentTripId },
    });
    if (foundParent) parentTrip = foundParent;
  }

  const children = await prisma.trip.findMany({
    where: { parentTripId: parentTrip.id },
    orderBy: [{ routeOrigin: "asc" }, { routeDestination: "asc" }],
  });

  const groupTripIds = [parentTrip.id, ...children.map((c) => c.id)];

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { tripId: { in: groupTripIds } },
        { returnTripId: { in: groupTripIds } }
      ],
      bookingStatus: { in: VALID_MANIFEST_STATUSES },
      paymentStatus: { in: VALID_MANIFEST_PAYMENT_STATUSES }
    },
    include: { agent: true, passengers: true, trip: true, returnTrip: true },
    orderBy: { createdAt: "asc" },
  });

  // Header/seat-inventory trip: the seat source, so occupiedSeats and
  // tempLockedSeats reflect the whole bus regardless of which trip was requested.
  const trip = parentTrip;

  return NextResponse.json({
    bookings,
    trip,
    group: {
      parentId: parentTrip.id,
      tripIds: groupTripIds,
      children,
    },
  });
}
