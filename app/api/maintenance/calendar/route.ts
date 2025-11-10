// app/api/maintenance/calendar/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface MaintenanceBlock {
  id: string;
  buses: Set<string>;
  startDate: string;
  durationDays: number;
  affectedRoutes: Set<string>;
}

interface BlockedDay {
  date: string;
  blocks: Map<string, MaintenanceBlock>;
}

interface BlockedDayResponse {
  date: string;
  blocks: {
    id: string;
    buses: string[];
    startDate: string;
    durationDays: number;
    affectedRoutes: string[];
  }[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    
    if (!month) {
      return NextResponse.json({ message: 'Month parameter required' }, { status: 400 });
    }

    const start = startOfMonth(parseISO(month));
    const end = endOfMonth(parseISO(month));

    // Get maintenance trips for the month
    const maintenanceTrips = await prisma.trip.findMany({
      where: {
        isChartered: true,
        charterCompany: 'MAINTENANCE',
        departureDate: {
          gte: start,
          lte: end
        }
      },
      select: {
        id: true,
        routeOrigin: true,
        routeDestination: true,
        departureDate: true,
        departureTime: true,
        charterDates: true
      }
    });

    // Group by date and maintenance block
    const blockedDaysMap = new Map<string, BlockedDay>();

    maintenanceTrips.forEach(trip => {
      const dateStr = trip.departureDate.toISOString().split('T')[0];
      const blockKey = trip.charterDates || 'unknown';

      if (!blockedDaysMap.has(dateStr)) {
        blockedDaysMap.set(dateStr, {
          date: dateStr,
          blocks: new Map<string, MaintenanceBlock>()
        });
      }

      const day = blockedDaysMap.get(dateStr);
      
      if (day && !day.blocks.has(blockKey)) {
        const [startDate, , durationDays] = (trip.charterDates || '').split(' + ');
        const days = durationDays ? parseInt(durationDays.replace('d', '')) : 1;
        
        day.blocks.set(blockKey, {
          id: blockKey,
          buses: new Set<string>(),
          startDate: startDate || '',
          durationDays: days,
          affectedRoutes: new Set<string>()
        });
      }

      const block = day?.blocks.get(blockKey);
      if (block) {
        const routeStr = `${trip.routeOrigin} → ${trip.routeDestination} (${trip.departureTime})`;
        block.affectedRoutes.add(routeStr);
        
        // Determine bus from route time
        if (trip.departureTime.startsWith('07:00') || trip.departureTime.startsWith('17:00')) {
          block.buses.add('Morning Bus');
        }
        if (trip.departureTime.startsWith('15:00') || trip.departureTime.startsWith('08:00')) {
          block.buses.add('Afternoon Bus');
        }
      }
    });

    // Convert to final format
    const blockedDays: BlockedDayResponse[] = Array.from(blockedDaysMap.values()).map(day => ({
      date: day.date,
      blocks: Array.from(day.blocks.values()).map(block => ({
        id: block.id,
        buses: Array.from(block.buses),
        startDate: block.startDate,
        durationDays: block.durationDays,
        affectedRoutes: Array.from(block.affectedRoutes)
      }))
    }));

    return NextResponse.json({ blockedDays });
  } catch (error) {
    console.error('Failed to fetch calendar data:', error);
    return NextResponse.json({ message: 'Failed to fetch calendar' }, { status: 500 });
  }
}