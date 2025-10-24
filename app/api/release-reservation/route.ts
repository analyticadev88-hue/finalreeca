import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as reservationService from '@/lib/reservationService';

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const { tripId, seats, reservedBy } = body;
    if (!tripId) {
      return NextResponse.json({ error: 'Missing tripId' }, { status: 400 });
    }

    if (Array.isArray(seats) && seats.length > 0) {
      await reservationService.deleteReservationsByTripSeats(tripId, seats);
      return NextResponse.json({ success: true });
    }

    if (reservedBy) {
      await reservationService.deleteReservationsByReservedBy(tripId, reservedBy);
      return NextResponse.json({ success: true });
    }

    // If neither seats nor reservedBy specified, remove expired reservations for the trip
    await reservationService.deleteExpiredReservations();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Release reservation error:', err);
    return NextResponse.json({ error: 'Failed to release reservations' }, { status: 500 });
  }
}
