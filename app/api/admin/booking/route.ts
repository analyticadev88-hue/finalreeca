// app/admin/booking/route.ts
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme-in-production';

async function verifyConsultantAuth(req: NextRequest) {
  const token = req.cookies.get('consultant_token')?.value;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (!payload?.id) return null;
    const consultant = await prisma.consultant.findUnique({
      where: { id: payload.id },
      select: { id: true, name: true, email: true },
    });
    return consultant;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  // Verify admin or consultant authentication
  const auth = await verifyAdminAuth();
  const consultant = !auth.authorized ? await verifyConsultantAuth(req) : null;
  if (!auth.authorized && !consultant) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin or consultant authentication required.' },
      { status: 401 }
    );
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
      addons: booking.addons,
      returnTrip: booking.returnTrip ? {
        route: `${booking.returnTrip.routeOrigin} to ${booking.returnTrip.routeDestination}`,
        date: booking.returnTrip.departureDate || new Date(),
        time: booking.returnTrip.departureTime || '',
        bus: booking.returnTrip.routeName || '',
        boardingPoint: booking.returnBoardingPoint || '',
        droppingPoint: booking.returnDroppingPoint || '',
        seats: booking.returnSeats ? booking.returnSeats.split(',') : [],
      } : undefined,
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
