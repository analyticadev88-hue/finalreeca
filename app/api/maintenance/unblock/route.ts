// app/api/maintenance/unblock/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { dates, blockIds } = await request.json();
    
    if (!Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json({ message: 'No dates selected' }, { status: 400 });
    }

    if (!Array.isArray(blockIds) || blockIds.length === 0) {
      return NextResponse.json({ message: 'No blocks selected' }, { status: 400 });
    }

    // Unblock trips for specific dates and blocks
    let totalUnblocked = 0;

    for (const dateStr of dates) {
      const targetDate = new Date(dateStr);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);

      for (const blockId of blockIds) {
        const where: any = {
          isChartered: true,
          charterCompany: 'MAINTENANCE',
          charterDates: blockId,
          departureDate: {
            gte: targetDate,
            lt: nextDay
          }
        };

        const result = await prisma.trip.updateMany({
          where,
          data: {
            isChartered: false,
            charterCompany: null,
            charterDates: null
          }
        });

        totalUnblocked += result.count;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Unblocked ${totalUnblocked} trip(s) across ${dates.length} date(s)` 
    });
  } catch (error) {
    console.error('Failed to unblock maintenance:', error);
    return NextResponse.json({ message: 'Failed to unblock' }, { status: 500 });
  }
}