import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Fetch real data from the database using Prisma
    const bookings = await prisma.booking.findMany({
      include: {
        trip: {
          select: {
            routeName: true,
            routeOrigin: true,
            routeDestination: true,
            departureDate: true,
            departureTime: true,
          },
        },
      },
    });

    // Format the data as needed
    const reports = bookings.map((booking) => ({
      id: booking.id,
      routeName: booking.trip.routeName,
      route: `${booking.trip.routeOrigin} to ${booking.trip.routeDestination}`,
      date: booking.trip.departureDate.toISOString().split('T')[0],
      departureTime: booking.trip.departureTime,
      totalPrice: booking.totalPrice,
      bookingStatus: booking.bookingStatus,
    }));

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports data" },
      { status: 500 }
    );
  }
}
