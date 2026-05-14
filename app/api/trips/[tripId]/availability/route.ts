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

    // Resolve seat source (parent trip if linked)
    const seatSourceId = trip.parentTripId || tripId;
    const seatSource = seatSourceId !== tripId
      ? await prisma.trip.findUnique({ where: { id: seatSourceId }, include: { bookings: true } })
      : trip;

    const occupiedSeatsArray = seatSource?.occupiedSeats ? JSON.parse(seatSource.occupiedSeats) : [];

    const bookedSeats: string[] = [];
    // Check bookings on both the requested trip and the seat source trip
    const tripsToCheck = [trip, ...(seatSource && seatSource.id !== trip.id ? [seatSource] : [])];
    for (const t of tripsToCheck) {
      for (const booking of t.bookings || []) {
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
    }

    const tempLockedSeats = seatSource?.tempLockedSeats ? seatSource.tempLockedSeats.split(',').filter(Boolean) : [];
    const reservations = await reservationService.findActiveReservations(seatSourceId);

    return NextResponse.json({ 
      occupiedSeats: occupiedSeatsArray, 
      bookedSeats: Array.from(new Set(bookedSeats)), 
      tempLockedSeats,
      reservations,
      parentTripId: trip.parentTripId,
      totalSeats: seatSource?.totalSeats || trip.totalSeats,
    });
  } catch (err: any) {
    console.error('Error fetching trip availability', err);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
