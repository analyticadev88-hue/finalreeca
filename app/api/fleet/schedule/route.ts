import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Create date range for the selected date
    const startDate = new Date(dateStr);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(dateStr);
    endDate.setHours(23, 59, 59, 999);

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
          include: {
            passengers: true,
          },
          where: {
            bookingStatus: { in: ["confirmed", "completed", "pending"] }
          }
        },
        returnBookings: {
          include: {
            passengers: true,
          },
          where: {
            bookingStatus: { in: ["confirmed", "completed", "pending"] }
          }
        }
      },
      orderBy: {
        departureTime: 'asc'
      },
    });

    // Transform the data to match the frontend requirements
    const schedules = trips.map((trip) => {
      const confirmedBookings = trip.bookings;
      const returnBookings = (trip as any).returnBookings || [];
      const allBookings = [...confirmedBookings, ...returnBookings];

      // Sum passengers for this specific trip
      const passengerCount = (confirmedBookings || []).reduce((sum, b) => 
        sum + (Array.isArray(b.passengers) ? b.passengers.filter((p: any) => !p.isReturn).length : 0), 0
      ) + (returnBookings || []).reduce((sum: number, b: any) => 
        sum + (Array.isArray(b.passengers) ? b.passengers.filter((p: any) => p.isReturn).length : 0), 0
      );

      const revenue = allBookings.reduce((sum, booking) => 
        sum + (Number(booking.totalPrice) || 0), 0
      );
      
      // Parse occupied seats to get actual seat data
      const occupiedSeatsArray = trip.occupiedSeats ? JSON.parse(trip.occupiedSeats) : [];
      
      return {
        id: trip.id,
        busNumber: trip.serviceType, // Using serviceType as bus identifier
        model: trip.routeName, // Using routeName as bus model/type
        routeOrigin: trip.routeOrigin,
        routeDestination: trip.routeDestination,
        departureDate: trip.departureDate.toISOString(),
        departureTime: trip.departureTime,
        totalSeats: trip.totalSeats,
        bookedSeats: passengerCount,
        availableSeats: trip.totalSeats - passengerCount,
        occupiedSeats: occupiedSeatsArray,
        revenue: revenue,
        status: trip.hasDeparted ? "Completed" : "Active",
        hasDeparted: trip.hasDeparted,
        passengerCount: passengerCount,
        bookingCount: allBookings.length,
        hasPassengers: passengerCount > 0,
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
