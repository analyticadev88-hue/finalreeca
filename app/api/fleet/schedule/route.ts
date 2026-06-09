import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichTripsWithAvailability } from "@/lib/tripAvailability";

// Case-insensitive status matching to handle both "confirmed" and "Confirmed"
const VALID_BOOKING_STATUSES = [
  "confirmed", "Confirmed",
  "completed", "Completed",
  "pending", "Pending",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Create date range for the selected date (UTC to avoid timezone shifts)
    const startDate = new Date(dateStr + 'T00:00:00.000Z');
    const endDate = new Date(dateStr + 'T23:59:59.999Z');

    // Fetch trips with detailed booking and passenger information
    const trips = await prisma.trip.findMany({
      where: {
        departureDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        bookings: {
          select: {
            id: true,
            seats: true,
            bookingStatus: true,
            totalPrice: true,
            passengers: true,
          },
          where: {
            bookingStatus: { in: VALID_BOOKING_STATUSES }
          }
        },
        returnBookings: {
          select: {
            id: true,
            seats: true,
            returnSeats: true,
            bookingStatus: true,
            totalPrice: true,
            passengers: true,
          },
          where: {
            bookingStatus: { in: VALID_BOOKING_STATUSES }
          }
        }
      },
      orderBy: {
        departureTime: 'asc'
      },
    });

    // Use shared availability calculation for consistency with Fleet Management
    const enrichedTrips = await enrichTripsWithAvailability(trips);

    // Transform the data to match the frontend requirements
    const schedules = enrichedTrips.map((trip) => {
      // Split revenue by leg so round-trip bookings don't inflate both trips
      const outboundBookings = trip.bookings || [];
      const returnBookings = (trip as any).returnBookings || [];

      const outboundRevenue = outboundBookings.reduce((sum, booking) => {
        const price = Number(booking.totalPrice) || 0;
        const returnBookingsCount = (booking.passengers || []).filter((p: any) => p.isReturn).length;
        if (returnBookingsCount === 0 || !booking.returnTripId) return sum + price;
        const outboundCount = (booking.passengers || []).filter((p: any) => !p.isReturn).length;
        const totalCount = outboundCount + returnBookingsCount;
        return sum + price * (outboundCount / totalCount);
      }, 0);

      const returnRevenue = returnBookings.reduce((sum, booking) => {
        const price = Number(booking.totalPrice) || 0;
        const outboundCount = (booking.passengers || []).filter((p: any) => !p.isReturn).length;
        if (outboundCount === 0 || !booking.returnTripId) return sum + price;
        const returnCount = (booking.passengers || []).filter((p: any) => p.isReturn).length;
        const totalCount = outboundCount + returnCount;
        return sum + price * (returnCount / totalCount);
      }, 0);

      const revenue = outboundRevenue + returnRevenue;
      const allBookings = [...outboundBookings, ...returnBookings];

      return {
        id: trip.id,
        busNumber: trip.serviceType, // Using serviceType as bus identifier
        model: trip.routeName, // Using routeName as bus model/type
        routeOrigin: trip.routeOrigin,
        routeDestination: trip.routeDestination,
        departureDate: trip.departureDate.toISOString(),
        departureTime: trip.departureTime,
        totalSeats: trip.computedTotalSeats,
        bookedSeats: trip.computedBookedSeats,
        availableSeats: trip.computedAvailableSeats,
        occupiedSeats: trip.computedOccupiedSeats,
        revenue: revenue,
        status: trip.computedHasDeparted ? "Completed" : "Active",
        hasDeparted: trip.computedHasDeparted,
        passengerCount: trip.computedBookedSeats,
        bookingCount: allBookings.length,
        hasPassengers: trip.computedBookedSeats > 0,
        tempLockedSeats: trip.tempLockedSeats ? trip.tempLockedSeats.split(',') : []
      };
    });

    return NextResponse.json(schedules);
    
  } catch (error) {
    console.error('Error fetching bus schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bus schedules' },
      { status: 500 }
    );
  }
}
