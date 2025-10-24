import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const { token } = params || {};
    if (!token) return NextResponse.json({ message: 'Missing token' }, { status: 400 });

    const link = await prisma.reservationLink.findUnique({ where: { token }, include: { tripReservation: { include: { seatReservations: true, trip: true } } } });
    if (!link) return NextResponse.json({ message: 'Invalid token' }, { status: 404 });

    if (link.used) return NextResponse.json({ message: 'Token already used' }, { status: 410 });
    if (new Date(link.expiresAt) < new Date()) return NextResponse.json({ message: 'Token expired' }, { status: 410 });

    // Reject consume if the underlying trip has departed already
    const trip = link.tripReservation?.trip;
    if (trip) {
      const tripDate = trip.departureDate ? new Date(trip.departureDate) : null;
      if (tripDate && tripDate <= new Date()) {
        return NextResponse.json({ message: 'Trip has already departed, reservation invalid' }, { status: 410 });
      }
    }

    const reservation = link.tripReservation;
    return NextResponse.json({
      token: link.token,
      prepaid: link.prepaid,
      reservation: {
        id: reservation.id,
        trip: reservation.trip,
        reservedSeatNumbers: reservation.seatReservations.map(s => s.seatNumber),
        reservedClientName: reservation.reservedClientName,
        reservedContactEmail: reservation.reservedContactEmail,
        reservedContactPhone: reservation.reservedContactPhone,
      }
    });
  } catch (error) {
    console.error('Consume link error', error);
    return NextResponse.json({ message: 'Failed to consume token' }, { status: 500 });
  }
}
