import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const lastTrip = await prisma.trip.findFirst({
      orderBy: {
        departureDate: 'desc',
      },
      select: {
        departureDate: true,
      },
    });

    if (!lastTrip) {
      return NextResponse.json({ lastTripDate: null });
    }

    return NextResponse.json({ lastTripDate: lastTrip.departureDate });
  } catch (error) {
    console.error('Error fetching last trip date:', error);
    return NextResponse.json(
      { message: 'Failed to fetch last trip date', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
