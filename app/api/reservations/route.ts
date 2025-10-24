import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // By default, exclude reservations that were cancelled so admin lists show active items.
    // Provide ?includeCancelled=true to include cancelled reservations when needed.
    const url = new URL(request.url);
    const includeCancelled = url.searchParams.get('includeCancelled') === 'true';

    // Always exclude TripReservations that belong to corporate charters from the regular reservations API.
    const baseWhere = includeCancelled ? {} : { status: { not: 'cancelled' } };
    const where = {
      AND: [
        baseWhere,
        { trip: { serviceType: { not: 'Corporate Charter' } } }
      ]
    };

    const reservations = await prisma.tripReservation.findMany({
      where,
      include: {
        trip: true,
        seatReservations: true,
        reservationLinks: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const payload = reservations.map(r => ({
      id: r.id,
      reservedClientName: r.reservedClientName,
      reservedContactPhone: r.reservedContactPhone,
      reservedContactEmail: r.reservedContactEmail,
      reservedLiaisonPerson: r.reservedLiaisonPerson,
      reservedCompany: r.reservedCompany,
      reservedNotes: r.reservedNotes,
      reservedSeatsCount: r.reservedSeatsCount,
      reservationDate: r.reservationDate,
      status: r.status,
      trip: r.trip,
      reservedSeatNumbers: r.seatReservations.map(s => s.seatNumber),
      links: r.reservationLinks.map(l => ({ id: l.id, token: l.token, expiresAt: l.expiresAt, used: l.used }))
    }));

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Fetch reservations error', error);
    return NextResponse.json({ message: 'Failed to fetch reservations' }, { status: 500 });
  }
}
