import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBusAvailabilityForTrips } from '@/lib/busAvailability';

// Lightweight seat-count refresh used by the booking search list's periodic
// polling. Counts are computed per physical bus run (seat source + children),
// so the parent route and every child segment always agree with each other
// and with the initial search payload.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        { error: 'ids parameter is required' },
        { status: 400 }
      );
    }

    const tripIds = idsParam.split(',').filter(Boolean);

    const trips = await prisma.trip.findMany({
      where: { id: { in: tripIds } },
      select: { id: true, parentTripId: true, availableSeats: true },
    });

    const availability = await getBusAvailabilityForTrips(trips);

    const result = trips.map(trip => {
      const a = availability.get(trip.id);
      // Unknown seat source (orphaned parentTripId): keep the stored count so
      // the UI doesn't jump to a bogus value.
      if (!a || a.totalSeats === 0) {
        return { id: trip.id, availableSeats: trip.availableSeats, soldOut: trip.availableSeats <= 0 };
      }
      return { id: trip.id, availableSeats: a.availableSeats, soldOut: a.soldOut };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching trip seats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip seats' },
      { status: 500 }
    );
  }
}
