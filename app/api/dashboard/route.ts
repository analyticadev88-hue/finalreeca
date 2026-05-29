import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enrichTripsWithAvailability } from '@/lib/tripAvailability';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    // Calculate stats
    const [
      allTimeBookings, 
      allTimeRevenue,
      monthlyBookings,
      monthlyRevenue,
    ] = await Promise.all([
      // 1. All-time confirmed bookings
      prisma.booking.count({
        where: {
          bookingStatus: { in: ["Confirmed", "Confirmed", "confirmed", "Completed", "completed"] }
        }
      }),
      // 2. All-time confirmed revenue
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          bookingStatus: { in: ["Confirmed", "Confirmed", "confirmed", "Completed", "completed"] }
        }
      }),
      // 3. Monthly confirmed bookings
      prisma.booking.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          bookingStatus: { in: ["Confirmed", "Confirmed", "confirmed", "Completed", "completed"] }
        }
      }),
      // 4. Monthly confirmed revenue
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          bookingStatus: { in: ["Confirmed", "Confirmed", "confirmed", "Completed", "completed"] }
        }
      }),
    ]);

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

    // Get today's trips with full booking data for accurate seat parsing
    const todaysTrips = await prisma.trip.findMany({
      where: {
        departureDate: { gte: dayStart, lte: dayEnd }
      },
      include: {
        bookings: {
          select: { id: true, seats: true, bookingStatus: true }
        },
        returnBookings: {
          select: { id: true, seats: true, returnSeats: true, bookingStatus: true }
        }
      }
    });

    // Use shared availability calculation for consistency with Fleet Management
    const enrichedTrips = await enrichTripsWithAvailability(todaysTrips);
    const todayDepartures = enrichedTrips.length;

    // Categorize trips into morning and afternoon
    const morningOccupancy = [];
    const afternoonOccupancy = [];

    for (const trip of enrichedTrips) {
      const bookedSeats = trip.computedBookedSeats;
      
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
        totalSeats: trip.computedTotalSeats,
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
        totalBookings: allTimeBookings,
        totalRevenue: allTimeRevenue._sum.totalPrice || 0,
        monthlyBookings,
        monthlyRevenue: monthlyRevenue._sum.totalPrice || 0,
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
