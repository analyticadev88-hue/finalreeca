// app/api/trips/[tripId]/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    console.log(`Fetching bookings for trip ID: ${tripId}`);

    const trip = await prisma.trip.findUnique({
      where: { id: tripId }
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Resolve seat source (parent trip if linked)
    const seatSourceId = trip.parentTripId || tripId;
    const seatSource = seatSourceId !== tripId
      ? await prisma.trip.findUnique({ where: { id: seatSourceId } })
      : trip;

    // Fetch bookings on this trip AND the seat source trip
    const relevantTripIds = [tripId];
    if (seatSourceId !== tripId) {
      relevantTripIds.push(seatSourceId);
    }

    const bookings = await prisma.booking.findMany({
      where: {
        tripId: { in: relevantTripIds },
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

    console.log(`Found ${bookings.length} bookings for trip ID: ${tripId} (including parent)`);
    console.log(`Trip details: ${JSON.stringify(trip)}`);

    // Fetch reserved seats from seat source trip
    const reservations = await prisma.seatReservation.findMany({ where: { tripId: seatSourceId } });
    const reservedSeatNumbers = reservations.map(r => r.seatNumber);

    const tempLockedSeats = seatSource?.tempLockedSeats ? seatSource.tempLockedSeats.split(',').filter(Boolean) : [];
    const totalBookedSeats = bookings.reduce((total, booking) => total + booking.seatCount, 0);

    return NextResponse.json({
      bookings,
      trip: {
        ...trip,
        totalSeats: seatSource?.totalSeats || trip.totalSeats,
        occupiedSeats: seatSource?.occupiedSeats || trip.occupiedSeats,
        tempLockedSeats: seatSource?.tempLockedSeats || trip.tempLockedSeats,
        availableSeats: seatSource?.availableSeats || trip.availableSeats,
      },
      reservedSeatNumbers,
      totalBookings: bookings.length,
      totalBookedSeats,
      totalLockedSeats: tempLockedSeats.length,
      totalOccupied: totalBookedSeats + tempLockedSeats.length,
      lockedSeatNumbers: tempLockedSeats,
      parentTripId: trip.parentTripId,
    });
  } catch (error) {
    console.error('Error fetching trip bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
