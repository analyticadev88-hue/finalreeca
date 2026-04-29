import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as reservationService from '@/lib/reservationService';

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const { tripId } = params || {};
    if (!tripId) return NextResponse.json({ error: 'Missing tripId' }, { status: 400 });

    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { bookings: true } });
    if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

    const occupiedSeatsArray = trip.occupiedSeats ? JSON.parse(trip.occupiedSeats) : [];

    const bookedSeats: string[] = [];
    for (const booking of trip.bookings) {
      if (booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid') {
        try {
          const seats = JSON.parse(booking.seats);
          if (Array.isArray(seats)) {
            bookedSeats.push(...seats);
          }
        } catch (e) {
          console.error('Error parsing booking seats:', e);
        }
      }
    }

    const tempLockedSeats = trip.tempLockedSeats ? trip.tempLockedSeats.split(',').filter(Boolean) : [];
    const reservations = await reservationService.findActiveReservations(tripId);

    return NextResponse.json({ 
      occupiedSeats: occupiedSeatsArray, 
      bookedSeats: Array.from(new Set(bookedSeats)), 
      tempLockedSeats,
      reservations 
    });
  } catch (err: any) {
    console.error('Error fetching trip availability', err);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
