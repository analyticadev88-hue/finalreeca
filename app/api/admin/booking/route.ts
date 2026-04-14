// app/admin/booking/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';

const prisma = new PrismaClient();

export async function GET() {
  // Verify admin authentication
  const auth = await verifyAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const bookings = await prisma.booking.findMany({
      include: {
        trip: true, // Include trip details
        returnTrip: true, // Include return trip details if applicable
      },
      orderBy: {
        createdAt: 'desc', // Order by creation date, newest first
      },
    });

    // Transform the bookings data to match the expected frontend structure
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      bookingRef: booking.orderId,
      passengerName: booking.userName,
      email: booking.userEmail,
      phone: booking.userPhone || '', // Handle optional phone
      passengers: booking.seatCount,
      route: `${booking.trip?.routeOrigin} to ${booking.trip?.routeDestination}`,
      date: booking.trip?.departureDate || new Date(),
      time: booking.trip?.departureTime || '',
      bus: booking.trip?.routeName || '',
      boardingPoint: booking.boardingPoint,
      droppingPoint: booking.droppingPoint,
      seats: booking.seats.split(','), // Assuming seats are stored as comma-separated values
      totalAmount: booking.totalPrice,
      paymentMethod: booking.paymentMode, // Use actual payment mode from DB
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      specialRequests: '', // Placeholder for special requests, adjust as needed
    }));

    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch bookings',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
