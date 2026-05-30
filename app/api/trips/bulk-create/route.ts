// app/api/trips/bulk-create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { trips } = await request.json();

    if (!trips || !Array.isArray(trips) || trips.length === 0) {
      return NextResponse.json({ error: 'Invalid trips data' }, { status: 400 });
    }

    // Validate each trip has required fields
    for (const trip of trips) {
      if (!trip.routeName || !trip.departureDate || !trip.departureTime) {
        return NextResponse.json({ 
          error: 'Each trip must have routeName, departureDate, and departureTime' 
        }, { status: 400 });
      }
    }

    // De-duplicate against existing trips in the database
    const existingTrips = await prisma.trip.findMany({
      where: {
        OR: trips.map((trip: any) => ({
          routeOrigin: trip.routeOrigin,
          routeDestination: trip.routeDestination,
          departureDate: new Date(trip.departureDate),
          departureTime: trip.departureTime,
          serviceType: trip.serviceType,
        })),
      },
      select: {
        routeOrigin: true,
        routeDestination: true,
        departureDate: true,
        departureTime: true,
        serviceType: true,
      },
    });

    const existingKeys = new Set(
      existingTrips.map(
        (t) => `${t.routeOrigin}|${t.routeDestination}|${t.departureDate.toISOString()}|${t.departureTime}|${t.serviceType}`
      )
    );

    const newTrips = trips.filter((trip: any) => {
      const key = `${trip.routeOrigin}|${trip.routeDestination}|${new Date(trip.departureDate).toISOString()}|${trip.departureTime}|${trip.serviceType}`;
      return !existingKeys.has(key);
    });

    // Create trips in batches to avoid memory issues with large datasets
    const batchSize = 100;
    let createdCount = 0;

    for (let i = 0; i < newTrips.length; i += batchSize) {
      const batch = newTrips.slice(i, i + batchSize);
      
      const createdTrips = await prisma.trip.createMany({
        data: batch.map((trip: any) => ({
          serviceType: trip.serviceType,
          routeName: trip.routeName,
          routeOrigin: trip.routeOrigin,
          routeDestination: trip.routeDestination,
          departureDate: new Date(trip.departureDate),
          departureTime: trip.departureTime,
          totalSeats: parseInt(trip.totalSeats) || 60,
          availableSeats: parseInt(trip.availableSeats) || 60,
          fare: parseInt(trip.fare) || 500,
          durationMinutes: parseInt(trip.durationMinutes) || 390,
          boardingPoint: trip.boardingPoint,
          droppingPoint: trip.droppingPoint,
          promoActive: Boolean(trip.promoActive),
          hasDeparted: Boolean(trip.hasDeparted),
        })),
      });

      createdCount += createdTrips.count;
    }

    return NextResponse.json({ 
      success: true, 
      createdCount,
      message: `Successfully created ${createdCount} trips`
    });

  } catch (error) {
    console.error('Error bulk creating trips:', error);
    return NextResponse.json({ 
      error: 'Failed to bulk create trips',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}