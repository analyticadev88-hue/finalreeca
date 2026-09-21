import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    const tripIds = idsParam.split(',');

    // Get all trips with their current seat availability
    const trips = await prisma.trip.findMany({
      where: {
        id: {
          in: tripIds
        }
      },
      select: {
        id: true,
        totalSeats: true,
        availableSeats: true,
        occupiedSeats: true,
      }
    });

    // Return available seats directly from the Trip record
    const result = trips.map(trip => ({
      id: trip.id,
      availableSeats: Math.max(0, trip.availableSeats),
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching trip seats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip seats' },
      { status: 500 }
    );
  }
}
