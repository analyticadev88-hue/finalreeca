import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRouteDescriptors } from '@/lib/busRoutes';

function parseRoute(routeStr: string) {
  // Expect format: "Origin → Destination (HH:MM)" or "Origin → Destination"
  const timeMatch = routeStr.match(/\((\d{1,2}:\d{2})\)/);
  const time = timeMatch ? timeMatch[1] : null;
  const namePart = routeStr.split('(')[0].trim();
  const parts = namePart.split('→').map(s => s.trim());
  const origin = parts[0] || namePart;
  const destination = parts[1] || '';
  return { origin, destination, time };
}

export async function POST(request: Request) {
  try {
    const { buses, startDate, durationDays } = await request.json();
    if (!Array.isArray(buses) || buses.length === 0) return NextResponse.json({ message: 'No buses selected' }, { status: 400 });
    if (!startDate) return NextResponse.json({ message: 'Missing start date' }, { status: 400 });
    const days = Number(durationDays) || 1;
    if (days < 1 || days > 30) return NextResponse.json({ message: 'Duration must be 1-30 days' }, { status: 400 });

  // getRouteDescriptors returns structured descriptors; convert to display strings
  const descriptors = getRouteDescriptors(buses as string[]);
  const routes = descriptors.map(d => d.display);
    const start = new Date(startDate);

    const conflicts: Array<{ date: string; route: string }> = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      for (const routeStr of routes) {
        const { origin, destination, time } = parseRoute(routeStr);

        // Match by date range (start of day <= departureDate < next day) to avoid time component mismatches
        const startOfDay = new Date(d);
        startOfDay.setHours(0,0,0,0);
        const nextDay = new Date(startOfDay);
        nextDay.setDate(nextDay.getDate() + 1);

        const where: any = {
          routeOrigin: origin,
          routeDestination: destination,
          departureDate: { gte: startOfDay, lt: nextDay },
          isChartered: false,
        };
        if (time) where.departureTime = { startsWith: time };

        const updated = await prisma.trip.updateMany({ where, data: { isChartered: true, charterCompany: 'MAINTENANCE', charterDates: `${startDate} + ${days}d` } });

        if (updated.count === 0) {
          conflicts.push({ date: d.toISOString().slice(0, 10), route: routeStr });
        }
      }
    }

    return NextResponse.json({ ok: true, conflicts });
  } catch (error) {
    console.error('Maintenance block error', error);
    return NextResponse.json({ message: 'Failed to block' }, { status: 500 });
  }
}
