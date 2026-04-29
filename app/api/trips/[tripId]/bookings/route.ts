// app/api/trips/[tripId]/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    console.log(`Fetching bookings for trip ID: ${tripId}`);

    const bookings = await prisma.booking.findMany({
      where: {
        tripId,
        bookingStatus: 'confirmed',
        paymentStatus: { in: ['paid', 'pending'] },
      },
      select: {
        id: true,
        seats: true,
        seatCount: true,
        bookingStatus: true,
        paymentStatus: true,
        createdAt: true,
        agent: { select: { id: true, name: true, email: true } },
        passengers: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${bookings.length} bookings for trip ID: ${tripId}`);

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: {
        id: true,
        totalSeats: true,
        availableSeats: true,
        occupiedSeats: true,
        tempLockedSeats: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    console.log(`Trip details: ${JSON.stringify(trip)}`);

    // Fetch reserved seats
    const reservations = await prisma.seatReservation.findMany({ where: { tripId } });
    const reservedSeatNumbers = reservations.map(r => r.seatNumber);

    return NextResponse.json({
      bookings,
      trip,
      reservedSeatNumbers,
      totalBookings: bookings.length,
      totalBookedSeats: bookings.reduce((total, booking) => total + booking.seatCount, 0),
    });
  } catch (error) {
    console.error('Error fetching trip bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
