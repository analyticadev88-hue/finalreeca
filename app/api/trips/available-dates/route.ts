import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Returns the distinct future departure dates (YYYY-MM-DD) for a route so the
// booking calendar can highlight/book only days that actually have trips.
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
        availableSeats: { gt: 0 },
      },
      select: { departureDate: true },
    });

    const dates = Array.from(
      new Set(trips.map((t) => t.departureDate.toISOString().split('T')[0]))
    ).sort();

    return NextResponse.json({ dates });
  } catch (error: any) {
    console.error('[AVAILABLE-DATES] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
