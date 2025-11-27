import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { bookingId } = await req.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { passengers: true },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    // Allow nullification for any payment status (pending or confirmed)
    // This enables handling cancellations without refunds

    // Free up seats on both trips
    const updateTripSeats = async (tripId: string, seatNumbers: string) => {
      if (!tripId || !seatNumbers) return;
      const trip = await prisma.trip.findUnique({ where: { id: tripId } });
      if (!trip) return;
      const occupied = trip.occupiedSeats ? trip.occupiedSeats.split(',') : [];
      const toFree = seatNumbers.split(',');
      const newOccupied = occupied.filter((seat: string) => !toFree.includes(seat));
      await prisma.trip.update({
        where: { id: tripId },
        data: {
          occupiedSeats: newOccupied.join(','),
          availableSeats: trip.availableSeats + toFree.length
        }
      });
    };
    await updateTripSeats(booking.tripId, booking.seats);
    if (booking.returnTripId && booking.returnSeats) {
      await updateTripSeats(booking.returnTripId, booking.returnSeats);
    }

    // Delete passengers
    await prisma.passenger.deleteMany({ where: { bookingId } });
    // Delete the booking
    await prisma.booking.delete({ where: { id: bookingId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
