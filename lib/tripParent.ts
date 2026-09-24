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

// ---------------------------------------------------------------------------
// Gaborone ↔ Maun corridor
// One physical bus per date + direction. Every trip row for that bus must
// share one seat inventory via parentTripId (whole-trip locking: one seat sold
// = locked for the entire route, no segment resale).
// ---------------------------------------------------------------------------

export const NORTH_STOPS = [
  'Gaborone', 'Kumakwane', 'Thamaga', 'Moshupa', 'Kanye',
  'Jwaneng', 'Kang', 'Ghanzi', "D'Kar", 'Sandfire',
  'Sehithwa', 'Toteng', 'Maun',
] as const;

export const SOUTH_STOPS = [
  'Maun', 'Toteng', 'Sehithwa', 'Sandfire', "D'Kar",
  'Ghanzi', 'Kang', 'Jwaneng', 'Kanye', 'Moshupa',
  'Thamaga', 'Kumakwane', 'Gaborone',
] as const;

const ALL_CORRIDOR_STOPS = new Set<string>([...NORTH_STOPS, ...SOUTH_STOPS]);

export type CorridorDirection = 'north' | 'south';

export function corridorDirectionFor(origin: string, destination: string): CorridorDirection | null {
  const norm = (s: string) => (s || '').trim().toLowerCase();
  const o = norm(origin);
  const d = norm(destination);
  const nO = (NORTH_STOPS as readonly string[]).map(norm).indexOf(o);
  const nD = (NORTH_STOPS as readonly string[]).map(norm).indexOf(d);
  const sO = (SOUTH_STOPS as readonly string[]).map(norm).indexOf(o);
  const sD = (SOUTH_STOPS as readonly string[]).map(norm).indexOf(d);
  // Most corridor stops appear on BOTH lists, so membership alone is
  // ambiguous — direction is determined by stop ORDER.
  if (nO !== -1 && nD !== -1 && nO < nD) return 'north';
  if (sO !== -1 && sD !== -1 && sO < sD) return 'south';
  return null;
}

export function isCorridorStop(stop: string): boolean {
  return ALL_CORRIDOR_STOPS.has(stop);
}

/**
 * Find the parent (full-route) trip for a corridor child trip:
 * northbound → Gaborone → Maun, southbound → Maun → Gaborone, same departure date.
 * Returns null if no parent exists yet for that date/direction.
 */
export async function findCorridorParentTripId(
  client: any,
  args: { routeOrigin: string; routeDestination: string; departureDate: Date }
): Promise<string | null> {
  const direction = corridorDirectionFor(args.routeOrigin, args.routeDestination);
  if (!direction) return null;
  const parentOrigin = direction === 'north' ? 'Gaborone' : 'Maun';
  const parentDestination = direction === 'north' ? 'Maun' : 'Gaborone';

  // Match the whole calendar day, tolerating timezone offsets on the stored timestamp
  const dayStart = new Date(args.departureDate);
  dayStart.setHours(0, 0, 0, 0);
  const start = new Date(dayStart.getTime() - 12 * 60 * 60 * 1000);
  const end = new Date(dayStart.getTime() + 36 * 60 * 60 * 1000);

  const parent = await client.trip.findFirst({
    where: {
      routeOrigin: { equals: parentOrigin, mode: 'insensitive' },
      routeDestination: { equals: parentDestination, mode: 'insensitive' },
      departureDate: { gte: start, lte: end },
    },
    select: { id: true },
    orderBy: { departureTime: 'asc' },
  });
  return parent?.id || null;
}

// ---------------------------------------------------------------------------
// Seat conflict enforcement (whole-trip locking on the shared seat source)
// ---------------------------------------------------------------------------

type Tx = any; // Prisma transaction client or the base client

function parseSeats(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Lock the seat-source trip row (SELECT ... FOR UPDATE) so concurrent bookings
 * for the same physical bus serialize on it. Must be called inside a transaction.
 */
export async function lockSeatSource(tx: Tx, seatSourceId: string): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "Trip" WHERE "id" = ${seatSourceId} FOR UPDATE`;
}

export interface SeatConflict {
  seatNumber: string;
  source: 'passenger' | 'reservation';
}

/**
 * Find seats on the given trip's physical bus (seat source + all its children)
 * that are already sold (passenger rows on non-cancelled bookings) or actively
 * held (non-expired reservations on the seat source).
 */
export async function findSeatConflicts(
  tx: Tx,
  tripId: string,
  seatNumbers: string[],
  opts: { excludeReservedBy?: string } = {}
): Promise<SeatConflict[]> {
  if (!seatNumbers.length) return [];
  const trip = await tx.trip.findUnique({
    where: { id: tripId },
    select: { id: true, parentTripId: true },
  });
  if (!trip) throw new Error(`Trip ${tripId} not found`);
  const seatSourceId = trip.parentTripId || trip.id;

  const children = await tx.trip.findMany({
    where: { parentTripId: seatSourceId },
    select: { id: true },
  });
  const tripGroupIds = [seatSourceId, ...children.map((c: any) => c.id)];

  const conflicts = new Map<string, SeatConflict>();

  const passengers = await tx.passenger.findMany({
    where: {
      tripId: { in: tripGroupIds },
      seatNumber: { in: seatNumbers },
      booking: {
        bookingStatus: { notIn: ['cancelled', 'nullified'] },
        paymentStatus: { notIn: ['cancelled', 'failed', 'refunded'] },
      },
    },
    select: { seatNumber: true },
  });
  for (const p of passengers) conflicts.set(p.seatNumber, { seatNumber: p.seatNumber, source: 'passenger' });

  const reservations = await tx.seatReservation.findMany({
    where: {
      tripId: seatSourceId,
      seatNumber: { in: seatNumbers },
      expiresAt: { gt: new Date() },
      ...(opts.excludeReservedBy ? { reservedBy: { not: opts.excludeReservedBy } } : {}),
    },
    select: { seatNumber: true },
  });
  for (const r of reservations) {
    if (!conflicts.has(r.seatNumber)) {
      conflicts.set(r.seatNumber, { seatNumber: r.seatNumber, source: 'reservation' });
    }
  }

  return Array.from(conflicts.values());
}

/**
 * Serialize on the seat source row, then throw if any seat is already sold/held.
 * Call inside a transaction, before writing passengers or reservations.
 */
export async function assertSeatsFree(
  tx: Tx,
  tripId: string,
  seatNumbers: string[],
  opts: { excludeReservedBy?: string } = {}
): Promise<void> {
  if (!seatNumbers.length) return;
  const trip = await tx.trip.findUnique({
    where: { id: tripId },
    select: { id: true, parentTripId: true },
  });
  if (!trip) throw new Error(`Trip ${tripId} not found`);
  // Serialize concurrent bookings for this physical bus
  await lockSeatSource(tx, trip.parentTripId || trip.id);

  const conflicts = await findSeatConflicts(tx, tripId, seatNumbers, opts);
  if (conflicts.length > 0) {
    const err: any = new Error(
      `Seat(s) ${conflicts.map((c) => c.seatNumber).join(', ')} already booked or held on this bus`
    );
    err.code = 'SEATS_UNAVAILABLE';
    err.seats = conflicts.map((c) => c.seatNumber);
    throw err;
  }
}

/**
 * Record seats as occupied on the seat source and recompute availableSeats.
 * All corridor bookings must write here — never to a child trip's own row.
 */
export async function markSeatsOccupied(tx: Tx, tripId: string, seats: string[]): Promise<void> {
  if (!seats.length) return;
  const trip = await tx.trip.findUnique({
    where: { id: tripId },
    select: { id: true, parentTripId: true },
  });
  if (!trip) throw new Error(`Trip ${tripId} not found`);
  const seatSourceId = trip.parentTripId || trip.id;
  const seatSource = await tx.trip.findUnique({ where: { id: seatSourceId } });
  if (!seatSource) throw new Error(`Seat source trip ${seatSourceId} not found`);

  const currentOccupied = parseSeats(seatSource.occupiedSeats);
  const newOccupied = Array.from(new Set([...currentOccupied, ...seats]));
  await tx.trip.update({
    where: { id: seatSourceId },
    data: {
      occupiedSeats: JSON.stringify(newOccupied),
      availableSeats:
        (seatSource.totalSeats || 0) -
        newOccupied.length -
        (seatSource.tempLockedSeats ? seatSource.tempLockedSeats.split(',').filter(Boolean).length : 0),
    },
  });
}
