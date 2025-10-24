import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    // Calculate stats
    const [totalBookings, totalRevenue] = await Promise.all([
      prisma.booking.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      }),
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      })
    ]);

    const todayDepartures = await prisma.trip.count({
      where: {
        departureDate: { gte: dayStart, lte: dayEnd }
      }
    });

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        trip: {
          select: {
            routeName: true,
            routeOrigin: true,
            routeDestination: true,
          }
        }
      }
    });

    // Get today's trips with bookings
    const todaysTrips = await prisma.trip.findMany({
      where: {
        departureDate: { gte: dayStart, lte: dayEnd }
      },
      include: {
        bookings: {
          select: { seatCount: true }
        }
      }
    });

    // Categorize trips into morning and afternoon
    const morningOccupancy = [];
    const afternoonOccupancy = [];

    for (const trip of todaysTrips) {
      const bookedSeats = trip.bookings.reduce((sum, booking) => sum + booking.seatCount, 0);
      
      // Parse time to determine if it's morning or afternoon
      let hours;
      
      // Check if time includes AM/PM
      if (trip.departureTime.includes('AM') || trip.departureTime.includes('PM')) {
        const [time, modifier] = trip.departureTime.split(' ');
        [hours] = time.split(':').map(Number);
        
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
      } else {
        // Assume 24-hour format
        [hours] = trip.departureTime.split(':').map(Number);
      }
      
      // Determine bus label based on actual hour
      const busLabel = hours < 12 ? 'Morning' : 'Afternoon';
      
      const occupancyData = {
        bus: `Service Bus ${busLabel}`,
        route: `${trip.routeOrigin} to ${trip.routeDestination}`,
        totalSeats: trip.totalSeats,
        bookedSeats,
        departureTime: trip.departureTime
      };

      // Categorize based on time
      if (hours < 12) {
        morningOccupancy.push(occupancyData);
      } else {
        afternoonOccupancy.push(occupancyData);
      }
    }

    return NextResponse.json({
      stats: {
        totalBookings,
        totalRevenue: totalRevenue._sum.totalPrice || 0,
        pendingRequests: 0,
        todayDepartures
      },
      recentBookings,
      morningOccupancy,
      afternoonOccupancy
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}