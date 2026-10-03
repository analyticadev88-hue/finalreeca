import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichTripsWithAvailability } from "@/lib/tripAvailability";

// Case-insensitive status matching to handle both "confirmed" and "Confirmed"
const VALID_BOOKING_STATUSES = [
  "confirmed", "Confirmed",
  "completed", "Completed",
  "pending", "Pending",
];

const VALID_PAYMENT_STATUSES = [
  "paid", "Paid",
  "pending", "Pending",
];

function parseSeatList(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    if (raw.startsWith('[')) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    }
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Create date range for the selected date (UTC to avoid timezone shifts)
    const startDate = new Date(dateStr + 'T00:00:00.000Z');
    const endDate = new Date(dateStr + 'T23:59:59.999Z');

    // Fetch trips with detailed booking and passenger information
    const bookingSelect = {
      id: true,
      seats: true,
      returnTripId: true,
      bookingStatus: true,
      paymentStatus: true,
      totalPrice: true,
      passengers: true,
    } as const;
    const returnBookingSelect = {
      id: true,
      seats: true,
      returnSeats: true,
      returnTripId: true,
      bookingStatus: true,
      paymentStatus: true,
      totalPrice: true,
      passengers: true,
    } as const;

    const trips = await prisma.trip.findMany({
      where: {
        departureDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        bookings: {
          select: bookingSelect,
          where: {
            bookingStatus: { in: VALID_BOOKING_STATUSES },
            paymentStatus: { in: VALID_PAYMENT_STATUSES },
          }
        },
        returnBookings: {
          select: returnBookingSelect,
          where: {
            bookingStatus: { in: VALID_BOOKING_STATUSES },
            paymentStatus: { in: VALID_PAYMENT_STATUSES },
          }
        }
      },
      orderBy: {
        departureTime: 'asc'
      },
    });

    // Also pull child segment trips whose parent departs on this date (they may
    // carry a slightly different timestamp but belong to the same bus run).
    const parentIdsOnDate = trips.filter((t) => !t.parentTripId).map((t) => t.id);
    const linkedChildren = parentIdsOnDate.length > 0
      ? await prisma.trip.findMany({
          where: { parentTripId: { in: parentIdsOnDate } },
          include: {
            bookings: {
              select: bookingSelect,
              where: {
                bookingStatus: { in: VALID_BOOKING_STATUSES },
                paymentStatus: { in: VALID_PAYMENT_STATUSES },
              }
            },
            returnBookings: {
              select: returnBookingSelect,
              where: {
                bookingStatus: { in: VALID_BOOKING_STATUSES },
                paymentStatus: { in: VALID_PAYMENT_STATUSES },
              }
            }
          },
        })
      : [];

    const seenIds = new Set(trips.map((t) => t.id));
    const allTrips = [...trips, ...linkedChildren.filter((t) => !seenIds.has(t.id))];

    // Use shared availability calculation for consistency with Fleet Management
    const enrichedTrips = await enrichTripsWithAvailability(allTrips);

    // Transform the data to match the frontend requirements
    const schedules = enrichedTrips.map((trip) => {
      // Split revenue by leg so round-trip bookings don't inflate both trips
      const outboundBookings = trip.bookings || [];
      const returnBookings = (trip as any).returnBookings || [];

      const outboundRevenue = outboundBookings.reduce((sum, booking) => {
        const price = Number(booking.totalPrice) || 0;
        const returnBookingsCount = (booking.passengers || []).filter((p: any) => p.isReturn).length;
        if (returnBookingsCount === 0 || !booking.returnTripId) return sum + price;
        const outboundCount = (booking.passengers || []).filter((p: any) => !p.isReturn).length;
        const totalCount = outboundCount + returnBookingsCount;
        return sum + price * (outboundCount / totalCount);
      }, 0);

      const returnRevenue = returnBookings.reduce((sum: number, booking: any) => {
        const price = Number(booking.totalPrice) || 0;
        const outboundCount = (booking.passengers || []).filter((p: any) => !p.isReturn).length;
        if (outboundCount === 0 || !booking.returnTripId) return sum + price;
        const returnCount = (booking.passengers || []).filter((p: any) => p.isReturn).length;
        const totalCount = outboundCount + returnCount;
        return sum + price * (returnCount / totalCount);
      }, 0);

      const revenue = outboundRevenue + returnRevenue;
      const allBookings = [...outboundBookings, ...returnBookings];

      // Seats sold on THIS trip row only (used for per-segment counts when grouping)
      const ownSeats = [
        ...outboundBookings.flatMap((b: any) => parseSeatList(b.seats)),
        ...returnBookings.flatMap((b: any) => parseSeatList(b.returnSeats || b.seats)),
      ];

      return {
        id: trip.id,
        busNumber: trip.serviceType, // Using serviceType as bus identifier
        model: trip.routeName, // Using routeName as bus model/type
        routeOrigin: trip.routeOrigin,
        routeDestination: trip.routeDestination,
        departureDate: trip.departureDate.toISOString(),
        departureTime: trip.departureTime,
        totalSeats: trip.computedTotalSeats,
        bookedSeats: trip.computedBookedSeats,
        availableSeats: trip.computedAvailableSeats,
        occupiedSeats: trip.computedOccupiedSeats,
        revenue: revenue,
        status: trip.computedHasDeparted ? "Completed" : "Active",
        hasDeparted: trip.computedHasDeparted,
        passengerCount: trip.computedBookedSeats,
        bookingCount: allBookings.length,
        hasPassengers: trip.computedBookedSeats > 0,
        tempLockedSeats: trip.tempLockedSeats ? trip.tempLockedSeats.split(',').filter(Boolean) : [],
        parentTripId: trip.parentTripId || null,
        // Internal fields for grouping (stripped before responding)
        _ownSeats: Array.from(new Set(ownSeats)),
        _reservedCount: trip.computedReservedSeats,
      };
    });

    // Group trips into physical bus runs: one card per parent trip, with all
    // child segment trips nested under it (they share the parent's seat inventory).
    const byId = new Map(schedules.map((s: any) => [s.id, s]));
    const consumed = new Set<string>();
    const groups: any[] = [];

    for (const s of schedules as any[]) {
      if (consumed.has(s.id)) continue;
      const key = s.parentTripId ?? s.id;
      const parent = byId.get(key);
      const members = parent
        ? [parent, ...schedules.filter((x: any) => x.id !== parent.id && (x.parentTripId ?? x.id) === key)]
        : [s, ...schedules.filter((x: any) => x.id !== s.id && (x.parentTripId ?? x.id) === key)];
      members.forEach((m: any) => consumed.add(m.id));
      groups.push(combineGroup(members));
    }

    // Sort bus runs by departure time
    groups.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''));

    return NextResponse.json(groups);

  } catch (error) {
    console.error('Error fetching bus schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bus schedules' },
      { status: 500 }
    );
  }
}

/**
 * Combine a parent trip and its child segment trips into one bus-run card.
 * Seat inventory (occupied/blocked) lives on the parent, so the combined
 * occupancy is the union of the parent's occupiedSeats and every member's
 * own sold seats. Revenue sums each segment's own booking revenue.
 */
function combineGroup(members: any[]) {
  const parent = members[0];
  const children = members.slice(1);

  // Every seat sold anywhere on the bus (parent occupiedSeats already includes
  // child sales, but union with each member's own seats for safety)
  const soldSeats = new Set<string>();
  for (const seat of parent.occupiedSeats || []) soldSeats.add(String(seat));
  for (const m of members) {
    for (const seat of m._ownSeats || []) soldSeats.add(String(seat));
  }

  const tempLocked = new Set<string>(parent.tempLockedSeats || []);
  for (const seat of tempLocked) soldSeats.add(String(seat));

  const reservedCount = members.reduce((sum, m) => sum + (m._reservedCount || 0), 0);
  const totalSeats = parent.totalSeats;
  const passengerCount = soldSeats.size;
  const availableSeats = Math.max(0, totalSeats - passengerCount - reservedCount);

  const revenue = members.reduce((sum, m) => sum + (m.revenue || 0), 0);
  const bookingCount = members.reduce((sum, m) => sum + (m.bookingCount || 0), 0);

  const childTrips = children.map((c) => ({
    id: c.id,
    routeOrigin: c.routeOrigin,
    routeDestination: c.routeDestination,
    passengerCount: (c._ownSeats || []).length,
    revenue: c.revenue || 0,
  }));

  return {
    id: parent.id,
    busNumber: parent.busNumber,
    model: parent.model,
    routeOrigin: parent.routeOrigin,
    routeDestination: parent.routeDestination,
    departureDate: parent.departureDate,
    departureTime: parent.departureTime,
    totalSeats,
    bookedSeats: passengerCount,
    availableSeats,
    occupiedSeats: Array.from(soldSeats),
    revenue,
    status: parent.status,
    hasDeparted: parent.hasDeparted,
    passengerCount,
    bookingCount,
    hasPassengers: passengerCount > 0,
    tempLockedSeats: Array.from(tempLocked),
    childTrips,
  };
}
