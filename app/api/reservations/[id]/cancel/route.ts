import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params || {};
    if (!id) return NextResponse.json({ message: 'Missing reservation id' }, { status: 400 });

    const reservation = await prisma.tripReservation.findUnique({ where: { id }, include: { seatReservations: true, trip: true } });
    if (!reservation) return NextResponse.json({ message: 'Reservation not found' }, { status: 404 });

    // Delete seat reservations
    const seatIds = reservation.seatReservations.map(s => s.id);
    await prisma.seatReservation.deleteMany({ where: { id: { in: seatIds } } });

    // Mark reservation cancelled
    await prisma.tripReservation.update({ where: { id }, data: { status: 'cancelled' } });

    // Restore trip.availableSeats
    if (reservation.trip) {
      await prisma.trip.update({ where: { id: reservation.tripId }, data: { availableSeats: reservation.trip.availableSeats + (reservation.reservedSeatsCount || 0) } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel reservation error', error);
    return NextResponse.json({ message: 'Failed to cancel reservation' }, { status: 500 });
  }
}
