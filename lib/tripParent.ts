import { prisma } from "./prisma";

/**
 * For segment trips (child trips linked to a parent), seat inventory lives on the parent.
 * This helper resolves the "seat source" trip ID for any given trip.
 */
export async function resolveSeatSourceTripId(tripId: string): Promise<string> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { parentTripId: true },
  });
  return trip?.parentTripId || tripId;
}

/**
 * Get the occupiedSeats and totalSeats from the seat source trip (follows parent link).
 */
export async function getSeatSourceTrip(tripId: string) {
  const sourceId = await resolveSeatSourceTripId(tripId);
  return prisma.trip.findUnique({
    where: { id: sourceId },
    select: {
      id: true,
      occupiedSeats: true,
      totalSeats: true,
      availableSeats: true,
      tempLockedSeats: true,
    },
  });
}
