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
    const newTrip = await prisma.trip.create({
      data: {
        serviceType,
        routeName,
        routeOrigin: routeName.split('→')[0]?.trim() || routeName,
        routeDestination: routeName.split('→')[1]?.trim() || routeName,
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
