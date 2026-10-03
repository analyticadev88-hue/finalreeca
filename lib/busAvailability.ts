import { prisma } from './prisma';

// ---------------------------------------------------------------------------
// Bus-run level availability.
//
// Seat inventory is shared across a whole physical bus run: the parent trip
// (seat source) plus every child segment trip linked via parentTripId. Any
// computation based on a single trip row's stored availableSeats field can
// disagree with the true bus-level count (writers update different rows and
// use different status filters), so availability shown to customers must be
// computed on the fly from the seat source, never read from the stored field.
// ---------------------------------------------------------------------------

export interface BusAvailability {
  totalSeats: number;
  availableSeats: number;
  soldOut: boolean;
  unavailableSeats: string[];
}

function parseSeats(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Compute true availability for the physical bus run each given trip belongs
 * to. Returns a map from every requested trip id to its bus run's availability
 * (all trips on the same bus share the same numbers).
 */
export async function getBusAvailabilityForTrips(
  trips: Array<{ id: string; parentTripId: string | null }>
): Promise<Map<string, BusAvailability>> {
  const result = new Map<string, BusAvailability>();
  if (trips.length === 0) return result;

  const seatSourceIds = Array.from(new Set(trips.map(t => t.parentTripId || t.id)));

  const seatSources = await prisma.trip.findMany({
    where: { id: { in: seatSourceIds } },
    select: { id: true, totalSeats: true, occupiedSeats: true, tempLockedSeats: true },
  });
  const sourceMap = new Map(seatSources.map(s => [s.id, s]));

  const children = await prisma.trip.findMany({
    where: { parentTripId: { in: seatSourceIds } },
    select: { id: true, parentTripId: true },
  });
  const childrenByParent = new Map<string, string[]>();
  for (const c of children) {
    const list = childrenByParent.get(c.parentTripId!) || [];
    list.push(c.id);
    childrenByParent.set(c.parentTripId!, list);
  }

  // Map every trip on the bus to its seat source
  const seatSourceOf = new Map<string, string>();
  for (const id of seatSourceIds) {
    seatSourceOf.set(id, id);
    for (const childId of childrenByParent.get(id) || []) {
      seatSourceOf.set(childId, id);
    }
  }

  const groupTripIds = Array.from(seatSourceOf.keys());

  // Every seat sold anywhere on the bus (same status semantics as
  // lib/tripParent.findSeatConflicts)
  const passengers = await prisma.passenger.findMany({
    where: {
      tripId: { in: groupTripIds },
      booking: {
        bookingStatus: { notIn: ['cancelled', 'nullified'] },
        paymentStatus: { notIn: ['cancelled', 'failed', 'refunded'] },
      },
    },
    select: { tripId: true, seatNumber: true },
  });

  const reservations = await prisma.seatReservation.findMany({
    where: { tripId: { in: seatSourceIds }, expiresAt: { gt: new Date() } },
    select: { tripId: true, seatNumber: true },
  });

  const availabilityBySource = new Map<string, BusAvailability>();
  for (const sourceId of seatSourceIds) {
    const src = sourceMap.get(sourceId);
    if (!src) continue;

    const unavailable = new Set<string>([
      ...parseSeats(src.occupiedSeats),
      ...(src.tempLockedSeats ? src.tempLockedSeats.split(',').map(s => s.trim()).filter(Boolean) : []),
      ...reservations.filter(r => r.tripId === sourceId).map(r => String(r.seatNumber)),
      ...passengers
        .filter(p => seatSourceOf.get(p.tripId) === sourceId)
        .map(p => String(p.seatNumber)),
    ]);

    const totalSeats = src.totalSeats || 0;
    const availableSeats = Math.max(0, totalSeats - unavailable.size);
    availabilityBySource.set(sourceId, {
      totalSeats,
      availableSeats,
      soldOut: availableSeats === 0,
      unavailableSeats: Array.from(unavailable),
    });
  }

  for (const trip of trips) {
    const sourceId = trip.parentTripId || trip.id;
    const availability = availabilityBySource.get(sourceId);
    // Unknown seat source (orphaned parentTripId) — treat as unknown rather
    // than available; callers fall back to their own logic.
    result.set(trip.id, availability || {
      totalSeats: 0,
      availableSeats: 0,
      soldOut: false,
      unavailableSeats: [],
    });
  }

  return result;
}
