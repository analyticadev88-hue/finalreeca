// app/api/maintenance/unblock-date/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { date, blockId } = await request.json();
    
    if (!date) {
      return NextResponse.json({ message: 'Date required' }, { status: 400 });
    }

    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    // If blockId is provided, only unblock that specific maintenance block
    // Otherwise, unblock all maintenance for that date
    const where: any = {
      isChartered: true,
      charterCompany: 'MAINTENANCE',
      departureDate: {
        gte: targetDate,
        lt: nextDay
      }
    };

    if (blockId) {
      where.charterDates = blockId;
    }

    const result = await prisma.trip.updateMany({
      where,
      data: {
        isChartered: false,
        charterCompany: null,
        charterDates: null
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Unblocked ${result.count} trip(s)` 
    });
  } catch (error) {
    console.error('Failed to unblock date:', error);
    return NextResponse.json({ message: 'Failed to unblock date' }, { status: 500 });
  }
}