import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBusAvailabilityForTrips } from '@/lib/busAvailability';

// Returns the distinct future departure dates (YYYY-MM-DD) for a route so the
// booking calendar can highlight/book only days that actually have trips.
//
// Availability is computed per physical bus run (seat source + child segment
// trips), never from a trip row's stored availableSeats field — that field
// drifts between writers and previously hid dates for full corridor buses.
//
// Response:
//   dates:       dates with at least one trip that has seats (dot)
//   soldOutDates: dates with trips where every bus run is full (different dot,
//                still selectable so the user sees the Sold Out trip, not a
//                blocked calendar)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
      return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const trips = await prisma.trip.findMany({
      where: {
        routeOrigin: { equals: from, mode: 'insensitive' },
        routeDestination: { equals: to, mode: 'insensitive' },
        departureDate: { gte: today },
        hasDeparted: false,
        isChartered: false,
      },
      select: { id: true, parentTripId: true, availableSeats: true, departureDate: true },
    });

    const availability = await getBusAvailabilityForTrips(trips);

    const availableDates = new Set<string>();
    const soldOutDates = new Set<string>();

    for (const trip of trips) {
      const key = trip.departureDate.toISOString().split('T')[0];
      const a = availability.get(trip.id);

      // totalSeats === 0 means the seat source row was missing (orphaned
      // parentTripId) — fall back to the stored field for that trip only.
      const hasSeats = a && a.totalSeats > 0
        ? a.availableSeats > 0
        : trip.availableSeats > 0;

      if (hasSeats) availableDates.add(key);
      else soldOutDates.add(key);
    }

    // A date with any available trip is an available date, not sold out
    for (const d of availableDates) soldOutDates.delete(d);

    return NextResponse.json({
      dates: Array.from(availableDates).sort(),
      soldOutDates: Array.from(soldOutDates).sort(),
    });
  } catch (error: any) {
    console.error('[AVAILABLE-DATES] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
