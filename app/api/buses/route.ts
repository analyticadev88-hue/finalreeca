import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Handle GET requests to fetch trips (treated as 'buses' by UI)
export async function GET() {
  try {
    const trips = await prisma.trip.findMany({ orderBy: { departureDate: 'asc' } });
    return NextResponse.json(trips);
  } catch (error: any) {
    console.error('Error fetching trips from database:', error);
    return NextResponse.json({ message: 'Failed to fetch trips', error: error.message }, { status: 500 });
  }
}

// Handle POST requests to create a new Trip (used by admin UI to add a schedule entry)
export async function POST(request: Request) {
  try {
    const { serviceType, routeName, totalSeats, fare, departureDate, departureTime, durationMinutes, promoActive } = await request.json();
    const routeOrigin = routeName.split('→')[0]?.trim() || routeName;
    const routeDestination = routeName.split('→')[1]?.trim() || routeName;

    // Duplicate guard
    const existing = await prisma.trip.findFirst({
      where: {
        routeOrigin,
        routeDestination,
        departureDate: new Date(departureDate),
        departureTime: departureTime || '00:00',
        serviceType: serviceType || 'Standard',
      }
    });
    if (existing) {
      return NextResponse.json({ message: 'Trip already exists for this route, date and time', trip: existing }, { status: 409 });
    }

    const newTrip = await prisma.trip.create({
      data: {
        serviceType: serviceType || 'Standard',
        routeName,
        routeOrigin,
        routeDestination,
        departureDate: new Date(departureDate),
        departureTime: departureTime || '00:00',
        totalSeats: Number(totalSeats) || 0,
        availableSeats: Number(totalSeats) || 0,
        fare: Number(fare) || 0,
        durationMinutes: Number(durationMinutes) || 0,
        boardingPoint: '',
        droppingPoint: '',
        promoActive: !!promoActive,
      }
    });
    return NextResponse.json(newTrip, { status: 201 });
  } catch (error: any) {
    console.error('Error creating trip:', error);
    return NextResponse.json({ message: 'Failed to create trip', error: error.message }, { status: 500 });
  }
}
