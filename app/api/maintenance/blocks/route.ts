// app/api/maintenance/blocks/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays, format } from 'date-fns';

interface MaintenanceBlock {
  id: string;
  buses: string[];
  startDate: string;
  durationDays: number;
  affectedRoutes: string[];
  createdAt: string;
  allDates: string[];
}

export async function GET() {
  try {
    // Find trips that are chartered for maintenance
    const maintenanceTrips = await prisma.trip.findMany({
      where: {
        isChartered: true,
        charterCompany: 'MAINTENANCE'
      },
      select: {
        id: true,
        routeOrigin: true,
        routeDestination: true,
        departureDate: true,
        departureTime: true,
        charterDates: true
      },
      orderBy: {
        departureDate: 'desc'
      }
    });

    // Group by maintenance block (using charterDates as block identifier)
    const blocksMap = new Map<string, {
      id: string;
      buses: string[];
      startDate: string;
      durationDays: number;
      affectedRoutes: Set<string>;
      createdAt: string;
      allDates: string[];
    }>();

    maintenanceTrips.forEach(trip => {
      const blockKey = trip.charterDates || 'unknown';
      
      if (!blocksMap.has(blockKey)) {
        const [startDate, , durationDays] = (trip.charterDates || '').split(' + ');
        const days = durationDays ? parseInt(durationDays.replace('d', '')) : 1;
        
        // Generate all dates for this block
        const allDates: string[] = [];
        const start = new Date(startDate || trip.departureDate);
        for (let i = 0; i < days; i++) {
          const date = addDays(start, i);
          allDates.push(format(date, 'yyyy-MM-dd'));
        }
        
        blocksMap.set(blockKey, {
          id: blockKey,
          buses: [], // We'll reconstruct this from routes
          startDate: startDate || '',
          durationDays: days,
          affectedRoutes: new Set<string>(),
          createdAt: trip.departureDate.toISOString(),
          allDates
        });
      }

      const block = blocksMap.get(blockKey);
      if (block) {
        const routeStr = `${trip.routeOrigin} → ${trip.routeDestination} (${trip.departureTime})`;
        block.affectedRoutes.add(routeStr);
      }
    });

    // Convert to array and determine buses from routes
    const blocks: MaintenanceBlock[] = Array.from(blocksMap.values()).map(block => {
      const routes = Array.from(block.affectedRoutes);
      const buses = determineBusesFromRoutes(routes);
      
      return {
        ...block,
        buses,
        affectedRoutes: routes
      };
    });

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error('Failed to fetch maintenance blocks:', error);
    return NextResponse.json({ message: 'Failed to fetch blocks' }, { status: 500 });
  }
}

function determineBusesFromRoutes(routes: string[]): string[] {
  const buses = new Set<string>();
  
  routes.forEach(route => {
    if (route.includes('07:00') || route.includes('17:00')) {
      buses.add('Morning Bus');
    }
    if (route.includes('15:00') || route.includes('08:00')) {
      buses.add('Afternoon Bus');
    }
  });

  return Array.from(buses);
}