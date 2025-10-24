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

    // Create trips in batches to avoid memory issues with large datasets
    const batchSize = 100;
    let createdCount = 0;

    for (let i = 0; i < trips.length; i += batchSize) {
      const batch = trips.slice(i, i + batchSize);
      
      const createdTrips = await prisma.trip.createMany({
        data: batch.map(trip => ({
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
        skipDuplicates: true, // Skip if duplicate exists
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