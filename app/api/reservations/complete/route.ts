import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;
    if (!token) return NextResponse.json({ message: 'Missing token' }, { status: 400 });

    const link = await prisma.reservationLink.findUnique({ where: { token }, include: { tripReservation: true } });
    if (!link) return NextResponse.json({ message: 'Invalid token' }, { status: 404 });

    if (link.used) return NextResponse.json({ message: 'Token already used' }, { status: 410 });

    // Check trip hasn't departed
    const reservation = await prisma.tripReservation.findUnique({ where: { id: link.tripReservationId }, include: { trip: true } });
    if (reservation?.trip?.departureDate) {
      const tripDate = new Date(reservation.trip.departureDate);
      if (tripDate <= new Date()) {
        return NextResponse.json({ message: 'Trip has already departed, cannot complete reservation' }, { status: 410 });
      }
    }

    // Mark link used and reservation converted
    await prisma.$transaction([
      prisma.reservationLink.update({ where: { id: link.id }, data: { used: true } }),
      prisma.tripReservation.update({ where: { id: link.tripReservationId }, data: { status: 'converted' } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete reservation error', error);
    return NextResponse.json({ message: 'Failed to complete reservation' }, { status: 500 });
  }
}
