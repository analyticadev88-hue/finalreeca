import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import { enrichTripsWithAvailability } from '@/lib/tripAvailability';
import { getServiceTypeFromDepartureTime } from '@/lib/busRoutes';
import { findCorridorParentTripId, isCorridorRoute, isCorridorStop } from '@/lib/tripParent';

function isValidDate(date: any): date is Date | string {
  return date && !isNaN(new Date(date).getTime());
}

function toISODateString(date: Date | string | null | undefined): string {
  if (!date || !isValidDate(date)) return "";
  try {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  } catch {
    return "";
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const departureDate = searchParams.get('departureDate');
    const returnDate = searchParams.get('returnDate');

    console.log('API received params:', { from, to, departureDate, returnDate });

    // Build filter conditions - Fixed logic
    let whereConditions: any = {};

    // If we have specific search criteria, use them
    if (from && to && departureDate) {
      // Create date range - add buffer for timezone offsets (±12 hours)
      const date = new Date(departureDate);
      const startDate = new Date(date.getTime() - 12 * 60 * 60 * 1000); // 12 hours earlier
      const endDate = new Date(date.getTime() + 36 * 60 * 60 * 1000);   // 36 hours later (covers next day)

      console.log('Outbound date range:', { startDate, endDate });

      // Use AND conditions for main search - this was the key issue
      whereConditions = {
        AND: [
          { routeOrigin: { equals: from, mode: 'insensitive' } },
          { routeDestination: { equals: to, mode: 'insensitive' } },
          { departureDate: { gte: startDate } },
          { departureDate: { lte: endDate } }
        ]
      };

      // If we also have return date, we need OR logic for both directions
      if (returnDate) {
        const returnDateObj = new Date(returnDate);
        const returnStartDate = new Date(returnDateObj.getTime() - 12 * 60 * 60 * 1000);
        const returnEndDate = new Date(returnDateObj.getTime() + 36 * 60 * 60 * 1000);

        console.log('Return date range:', { returnStartDate, returnEndDate });

        whereConditions = {
          OR: [
            // Outbound trip
            {
              AND: [
                { routeOrigin: { equals: from, mode: 'insensitive' } },
                { routeDestination: { equals: to, mode: 'insensitive' } },
                { departureDate: { gte: startDate } },
                { departureDate: { lte: endDate } }
              ]
            },
            // Return trip
            {
              AND: [
                { routeOrigin: { equals: to, mode: 'insensitive' } },
                { routeDestination: { equals: from, mode: 'insensitive' } },
                { departureDate: { gte: returnStartDate } },
                { departureDate: { lte: returnEndDate } }
              ]
            }
          ]
        };
      }
    } else if (departureDate) {
      // If only date is provided, filter by date only
      const startDate = new Date(departureDate + 'T00:00:00.000Z');
      const endDate = new Date(departureDate + 'T23:59:59.999Z');

      whereConditions = {
        AND: [
          { departureDate: { gte: startDate } },
          { departureDate: { lte: endDate } }
        ]
      };
    }
    // If no search params, return all trips (you might want to limit this)

    console.log('Prisma query conditions:', JSON.stringify(whereConditions, null, 2));

    const trips = await prisma.trip.findMany({
      where: Object.keys(whereConditions).length > 0 ? whereConditions : undefined,
      include: {
        bookings: true,
        returnBookings: true,
      },
      orderBy: [
        { departureDate: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    console.log('Found trips:', trips.map(t => ({
      id: t.id,
      date: t.departureDate,
      time: t.departureTime,
      route: `${t.routeOrigin} → ${t.routeDestination}`
    })));

    // Use shared availability calculation for consistency across Dashboard and Fleet Ops
    const enrichedTrips = await enrichTripsWithAvailability(trips);

    const tripsWithAvailability = enrichedTrips.map(trip => {
      let departureDateISO = "";
      if (isValidDate(trip.departureDate)) {
        departureDateISO = new Date(trip.departureDate).toISOString();
      } else {
        console.warn("Invalid departureDate for trip:", trip.id, trip.departureDate);
      }

      return {
        ...trip,
        totalSeats: trip.computedTotalSeats,
        availableSeats: trip.computedAvailableSeats,
        occupiedSeats: JSON.stringify(trip.computedOccupiedSeats),
        tempLockedSeats: trip.tempLockedSeats || '',
        departureDate: departureDateISO,
        hasDeparted: trip.computedHasDeparted,
        reservedSeatsCount: 0,
        parentTripId: trip.parentTripId,
      } as any;
    });

    // Try to compute reserved counts per trip (best-effort)
    try {
      const tripIds = tripsWithAvailability.map((t: any) => t.id);
      if (tripIds.length > 0) {
        const reservations = await prisma.tripReservation.groupBy({
          by: ['tripId'],
          where: { tripId: { in: tripIds } },
          _sum: { reservedSeatsCount: true }
        });
        const reservedMap = new Map(reservations.map(r => [r.tripId, (r._sum && (r._sum as any).reservedSeatsCount) || 0]));
        tripsWithAvailability.forEach((t: any) => {
          t.reservedSeatsCount = reservedMap.get(t.id) || 0;
        });
      }
    } catch (e) {
      // ignore - feature will be available after migration
      console.warn('Could not compute reserved counts (migration may be pending):', e);
    }

    console.log('Returning trips with availability:', tripsWithAvailability.length);
    return NextResponse.json(tripsWithAvailability);
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json(
      { message: 'Failed to fetch trips', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Fields that exist on frontend-enriched trip objects but are NOT real DB columns.
// Always strip these before any Prisma create/update call.
const COMPUTED_FIELDS = [
  'computedAvailableSeats',
  'computedBookedSeats',
  'computedReservedSeats',
  'computedTempLockedSeats',
  'computedHasDeparted',
  'computedOccupiedSeats',
  'computedUnavailableSeats',
  'computedTotalSeats',
  'reservedSeatsCount',
  // frontend-only helpers
  'isRustenburgStopover',
  'rustenburgFare',
  'endDate',
  // relations returned by GET – not writable
  'bookings',
  'returnBookings',
  'passengers',
  'reservations',
];

function stripNonDbFields(data: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(data).filter(([key]) => !COMPUTED_FIELDS.includes(key))
  );
}

export async function POST(request: NextRequest) {
  try {
    // Admin authentication required
    await requireAdminAuth(request);

    const raw = await request.json();
    const data = stripNonDbFields(raw);

    // Ensure numeric fields are numbers
    if (typeof data.fare === "string") data.fare = parseFloat(data.fare);
    if (typeof data.durationMinutes === "string") data.durationMinutes = parseInt(data.durationMinutes, 10);
    if (typeof data.totalSeats === "string") data.totalSeats = parseInt(data.totalSeats, 10);
    if (typeof data.availableSeats === "string") data.availableSeats = parseInt(data.availableSeats, 10);

    const derivedServiceType = getServiceTypeFromDepartureTime(data.departureTime || '00:00');

    const tripData: any = {
      ...data,
      routeName: data.routeName || `${data.routeOrigin} to ${data.routeDestination}`,
      routeOrigin: data.routeOrigin,
      routeDestination: data.routeDestination,
      departureTime: data.departureTime || '00:00',
      serviceType: data.serviceType && data.serviceType !== 'Standard' ? data.serviceType : derivedServiceType,
      totalSeats: data.totalSeats || data.availableSeats,
      departureDate: new Date(data.departureDate),
      parentTripId: data.parentTripId && data.parentTripId.trim() ? data.parentTripId : null,
    };

    // The corridor is a single night run per direction — segment trips boarding
    // after midnight must not be stored as "Morning Bus".
    if (isCorridorRoute(tripData.routeOrigin, tripData.routeDestination)) {
      tripData.serviceType = 'Night Bus';
    }

    // Auto-link corridor segment trips to the same-date full-route parent so
    // every trip row of a physical bus shares one seat inventory.
    const isFullCorridorRoute =
      (tripData.routeOrigin === 'Gaborone' && tripData.routeDestination === 'Maun') ||
      (tripData.routeOrigin === 'Maun' && tripData.routeDestination === 'Gaborone');
    if (!tripData.parentTripId && !isFullCorridorRoute &&
        isCorridorStop(tripData.routeOrigin) && isCorridorStop(tripData.routeDestination)) {
      const parentId = await findCorridorParentTripId(prisma, {
        routeOrigin: tripData.routeOrigin,
        routeDestination: tripData.routeDestination,
        departureDate: tripData.departureDate,
      });
      if (parentId) {
        tripData.parentTripId = parentId;
      } else {
        console.warn(
          `No corridor parent trip found for ${tripData.routeOrigin} → ${tripData.routeDestination} on ${tripData.departureDate}; ` +
          `create the Gaborone ↔ Maun full-route trip first, then re-run scripts/link-corridor-trips.js`
        );
      }
    }

    // Duplicate guard
    const existing = await prisma.trip.findFirst({
      where: {
        routeOrigin: tripData.routeOrigin,
        routeDestination: tripData.routeDestination,
        departureDate: tripData.departureDate,
        departureTime: tripData.departureTime || '00:00',
        serviceType: tripData.serviceType || 'Standard',
      }
    });
    if (existing) {
      return NextResponse.json({ message: 'Trip already exists for this route, date and time', trip: existing }, { status: 409 });
    }

    const newTrip = await prisma.trip.create({
      data: tripData
    });

    return NextResponse.json(newTrip, { status: 201 });
  } catch (error: any) {
    console.error('Error creating trip:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { message: 'Failed to create trip', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Admin authentication required
    await requireAdminAuth(request);

    const raw = await request.json();
    const data = stripNonDbFields(raw);

    // Ensure numeric fields are numbers
    if (typeof data.fare === "string") data.fare = parseFloat(data.fare);
    if (typeof data.durationMinutes === "string") data.durationMinutes = parseInt(data.durationMinutes, 10);
    if (typeof data.totalSeats === "string") data.totalSeats = parseInt(data.totalSeats, 10);
    if (typeof data.availableSeats === "string") data.availableSeats = parseInt(data.availableSeats, 10);

    const normalizedData: any = {
      ...data,
      serviceType: data.serviceType && data.serviceType !== 'Standard'
        ? data.serviceType
        : getServiceTypeFromDepartureTime(data.departureTime || '00:00')
    };

    const updatedTrip = await prisma.trip.update({
      where: { id: data.id },
      data: normalizedData as any,
    });
    return NextResponse.json(updatedTrip);
  } catch (error: any) {
    console.error('Error updating trip:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { message: 'Failed to update trip', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Admin authentication required
    await requireAdminAuth(request);

    const { id } = await request.json();
    await prisma.trip.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting trip:', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(
      { message: 'Failed to delete trip', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}