import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

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

export async function GET(request: Request) {
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
      // Create date range for the entire day in UTC
      const startDate = new Date(departureDate + 'T00:00:00.000Z');
      const endDate = new Date(departureDate + 'T23:59:59.999Z');
      
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
        const returnStartDate = new Date(returnDate + 'T00:00:00.000Z');
        const returnEndDate = new Date(returnDate + 'T23:59:59.999Z');
        
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
        bookings: {
          include: {
            passengers: true, // <-- Add this
          },
        },
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

    // Fetch all seat reservations for these trips (so reserved seats count toward unavailable seats)
    const tripIds = trips.map(t => t.id);
    const seatReservationsAll = tripIds.length > 0 ? await prisma.seatReservation.findMany({ where: { tripId: { in: tripIds } } }) : [];
    const seatReservationMap = new Map<string, string[]>();
    for (const r of seatReservationsAll) {
      if (!seatReservationMap.has(r.tripId)) seatReservationMap.set(r.tripId, []);
      seatReservationMap.get(r.tripId)!.push(r.seatNumber);
    }

    const tripsWithAvailability = trips.map(trip => {
      // Parse occupiedSeats from trip
      let occupiedSeats: string[] = [];
      if (trip.occupiedSeats) {
        try {
          occupiedSeats = JSON.parse(trip.occupiedSeats);
        } catch {
          occupiedSeats = [];
        }
      }

      // Collect all booked seats from bookings
      const bookedSeats: string[] = [];
      for (const booking of trip.bookings) {
        if (booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid') {
          for (const passenger of booking.passengers) {
            if (!passenger.isReturn) { // Only count for departure trip
              bookedSeats.push(passenger.seatNumber);
            }
          }
        }
      }

      // Collect reserved seats from seatReservationMap
      const reservedSeatsFromMap = seatReservationMap.get(trip.id) || [];

  // Combine and deduplicate (include reserved seats)
  const unavailableSeats = Array.from(new Set([...occupiedSeats, ...bookedSeats, ...reservedSeatsFromMap]));
  const availableSeats = Math.max(0, trip.totalSeats - unavailableSeats.length);

      // Calculate hasDeparted
      let hasDeparted = false;
      if (trip.departureDate && trip.departureTime) {
        const depDate = new Date(trip.departureDate);
        const [hours, minutes] = trip.departureTime.split(":").map(Number);
        depDate.setHours(hours, minutes, 0, 0);
        hasDeparted = depDate < new Date();
      }

      let departureDateISO = "";
      if (isValidDate(trip.departureDate)) {
        departureDateISO = new Date(trip.departureDate).toISOString();
      } else {
        console.warn("Invalid departureDate for trip:", trip.id, trip.departureDate);
      }

      return {
        ...trip,
        availableSeats,
        departureDate: departureDateISO,
        hasDeparted,
        reservedSeatsCount: 0, // default, may be overwritten below if Prisma supports TripReservation
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

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const tripData = {
      ...data,
      // Ensure totalSeats matches availableSeats for new trips
      totalSeats: data.totalSeats || data.availableSeats,
      // Properly format departure date
      departureDate: new Date(data.departureDate)
    };

    const newTrip = await prisma.trip.create({
      data: tripData
    });
    
    return NextResponse.json(newTrip, { status: 201 });
  } catch (error) {
    console.error('Error creating trip:', error);
    return NextResponse.json(
      { message: 'Failed to create trip', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();

    // Ensure numeric fields are numbers
    if (typeof data.fare === "string") data.fare = parseFloat(data.fare);
    if (typeof data.durationMinutes === "string") data.durationMinutes = parseInt(data.durationMinutes, 10);
    if (typeof data.totalSeats === "string") data.totalSeats = parseInt(data.totalSeats, 10);
    if (typeof data.availableSeats === "string") data.availableSeats = parseInt(data.availableSeats, 10);

    // Remove fields that are not part of the Trip model (like bookings, returnBookings)
    delete data.bookings;
    delete data.returnBookings;

    const updatedTrip = await prisma.trip.update({
      where: { id: data.id },
      data: data,
    });
    return NextResponse.json(updatedTrip);
  } catch (error) {
    console.error('Error updating trip:', error);
    return NextResponse.json(
      { message: 'Failed to update trip', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.trip.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { message: 'Failed to delete trip', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}