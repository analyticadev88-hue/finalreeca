import { prisma } from './prisma';

export interface TripInput {
  id: string;
  serviceType?: string;
  routeName?: string;
  routeOrigin?: string;
  routeDestination?: string;
  departureDate: Date | string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  occupiedSeats?: string | null;
  tempLockedSeats?: string | null;
  hasDeparted: boolean;
  parentTripId?: string | null;
  isChartered?: boolean;
  bookings: Array<{
    id?: string;
    seats: string;
    bookingStatus: string;
    paymentStatus?: string;
  }>;
  returnBookings: Array<{
    id?: string;
    seats: string;
    returnSeats?: string | null;
    bookingStatus: string;
    paymentStatus?: string;
  }>;
  [key: string]: any;
}

export interface AvailabilityResult {
  computedAvailableSeats: number;
  computedBookedSeats: number;
  computedReservedSeats: number;
  computedTempLockedSeats: number;
  computedHasDeparted: boolean;
  computedOccupiedSeats: string[];
  computedUnavailableSeats: string[];
  computedTotalSeats: number;
}

/**
 * Computes availability for an array of trips using the same logic as Fleet Management.
 * This ensures Dashboard, Fleet Operations, and Fleet Management all show identical numbers.
 *
 * Calculation:
 * - bookedSeats: parsed from booking.seats and booking.returnSeats for confirmed/completed/pending bookings
 * - reservedSeats: from SeatReservation table (temporary holds during booking flow)
 * - tempLockedSeats: from trip.tempLockedSeats (admin blocked seats)
 * - occupiedSeats: from trip.occupiedSeats JSON
 * - unavailableSeats = union of all above
 * - availableSeats = totalSeats - unavailableSeats
 *
 * Also handles parent/child trip logic for Rustenburg stopovers.
 */
export async function enrichTripsWithAvailability<T extends TripInput>(
  trips: T[]
): Promise<(T & AvailabilityResult)[]> {
  if (trips.length === 0) return [];

  // Fetch parent trips for seat resolution (Rustenburg stopovers)
  const parentIds = trips
    .filter(t => t.parentTripId)
    .map(t => t.parentTripId!);

  const parentTrips = parentIds.length > 0
    ? await prisma.trip.findMany({
        where: { id: { in: parentIds } },
        select: {
          id: true,
          occupiedSeats: true,
          totalSeats: true,
          tempLockedSeats: true,
        },
      })
    : [];
  const parentMap = new Map(parentTrips.map(p => [p.id, p]));

  // Fetch parent trips WITH their bookings for accurate combined counts
  const parentTripsWithBookings = parentIds.length > 0
    ? await prisma.trip.findMany({
        where: { id: { in: parentIds } },
        include: {
          bookings: {
            select: {
              id: true,
              seats: true,
              bookingStatus: true,
              paymentStatus: true,
            },
          },
          returnBookings: {
            select: {
              id: true,
              seats: true,
              returnSeats: true,
              bookingStatus: true,
              paymentStatus: true,
            },
          },
        },
      })
    : [];
  const parentBookingMap = new Map(parentTripsWithBookings.map(p => [p.id, p]));

  // Fetch seat reservations for all trips AND their parents
  const tripIds = trips.map(t => t.id);
  const allRelatedIds = [...new Set([...tripIds, ...parentIds])];

  const seatReservationsAll = allRelatedIds.length > 0
    ? await prisma.seatReservation.findMany({
        where: { tripId: { in: allRelatedIds } },
      })
    : [];

  const seatReservationMap = new Map<string, string[]>();
  for (const r of seatReservationsAll) {
    if (!seatReservationMap.has(r.tripId)) seatReservationMap.set(r.tripId, []);
    if (!seatReservationMap.get(r.tripId)!.includes(r.seatNumber)) {
      seatReservationMap.get(r.tripId)!.push(r.seatNumber);
    }
  }

  return trips.map(trip => {
    // Use parent trip as seat source if this is a child trip
    const seatSource = trip.parentTripId
      ? parentMap.get(trip.parentTripId)
      : trip;

    const effectiveOccupiedSeats = seatSource?.occupiedSeats || trip.occupiedSeats;
    const effectiveTotalSeats = seatSource?.totalSeats || trip.totalSeats;
    const effectiveTempLocked = seatSource?.tempLockedSeats || trip.tempLockedSeats;

    // Parse occupiedSeats JSON
    let occupiedSeats: string[] = [];
    if (effectiveOccupiedSeats) {
      try {
        occupiedSeats = JSON.parse(effectiveOccupiedSeats);
      } catch {
        occupiedSeats = [];
      }
    }

    // Collect booked seats from this trip AND its parent
    const bookedSeats: string[] = [];
    const parentWithBookings = trip.parentTripId
      ? parentBookingMap.get(trip.parentTripId)
      : null;
    const tripsToCheck = [
      trip,
      ...(parentWithBookings ? [parentWithBookings] : []),
    ];

    for (const t of tripsToCheck) {
      // Outbound bookings
      for (const booking of (t as any).bookings || []) {
        const bStatus = booking.bookingStatus?.toLowerCase();
        const pStatus = booking.paymentStatus?.toLowerCase();
        if (
          ['confirmed', 'completed', 'pending'].includes(bStatus) &&
          // If paymentStatus is available, exclude failed/cancelled/timeout payments.
          // If undefined (legacy callers), default to included for backward compat.
          (pStatus === undefined || ['paid', 'pending'].includes(pStatus))
        ) {
          try {
            let seats: string[] = [];
            if (booking.seats.startsWith('[')) {
              seats = JSON.parse(booking.seats);
            } else {
              seats = booking.seats.split(',').filter(Boolean);
            }
            if (Array.isArray(seats)) {
              bookedSeats.push(...seats);
            }
          } catch (e) {
            console.error('Error parsing booking seats:', e);
          }
        }
      }

      // Return bookings
      for (const booking of (t as any).returnBookings || []) {
        const bStatus = booking.bookingStatus?.toLowerCase();
        const pStatus = booking.paymentStatus?.toLowerCase();
        if (
          ['confirmed', 'completed', 'pending'].includes(bStatus) &&
          (pStatus === undefined || ['paid', 'pending'].includes(pStatus))
        ) {
          try {
            const rSeats = booking.returnSeats || booking.seats;
            if (!rSeats) continue;
            let seats: string[] = [];
            if (rSeats.startsWith('[')) {
              seats = JSON.parse(rSeats);
            } else {
              seats = rSeats.split(',').filter(Boolean);
            }
            if (Array.isArray(seats)) {
              bookedSeats.push(...seats);
            }
          } catch (e) {
            console.error('Error parsing return booking seats:', e);
          }
        }
      }
    }

    // Parse tempLockedSeats
    const tempLockedSeats = effectiveTempLocked
      ? effectiveTempLocked.split(',').filter(Boolean)
      : [];

    // Collect reserved seats from SeatReservation table
    const reservedSeatsFromMap = seatReservationMap.get(trip.id) || [];
    const parentReservedSeats = trip.parentTripId
      ? seatReservationMap.get(trip.parentTripId) || []
      : [];

    // Combine all unavailable seats and deduplicate
    const unavailableSeats = Array.from(
      new Set([
        ...occupiedSeats,
        ...bookedSeats,
        ...reservedSeatsFromMap,
        ...parentReservedSeats,
        ...tempLockedSeats,
      ])
    );

    const computedAvailableSeats = Math.max(
      0,
      effectiveTotalSeats - unavailableSeats.length
    );

    // Use the database hasDeparted value directly (respects manual admin overrides)
    // Admin can set this to false to "undeparted" a bus, overriding time-based calculation
    const computedHasDeparted = trip.hasDeparted;

    return {
      ...trip,
      computedAvailableSeats,
      computedBookedSeats: bookedSeats.length,
      computedReservedSeats:
        reservedSeatsFromMap.length + parentReservedSeats.length,
      computedTempLockedSeats: tempLockedSeats.length,
      computedHasDeparted,
      computedOccupiedSeats: occupiedSeats,
      computedUnavailableSeats: unavailableSeats,
      computedTotalSeats: effectiveTotalSeats,
    };
  });
}
