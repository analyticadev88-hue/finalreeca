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

    // Find the booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        passengers: true,
        trip: true, // Include trip to get current seat count
        returnTrip: true // Include return trip if exists
      },
    });
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    console.log(`[NULLIFY] Processing booking ${booking.orderId}:`, {
      tripId: booking.tripId,
      returnTripId: booking.returnTripId,
      seats: booking.seats,
      returnSeats: booking.returnSeats,
      passengerCount: booking.passengers.length
    });

    // Helper to parse JSON seats array
    const parseSeatsArray = (seatsString: string | null): string[] => {
      if (!seatsString) return [];
      try {
        const parsed = JSON.parse(seatsString);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Error parsing seats:', e);
        return [];
      }
    };

    // Helper to update trip seats (proper JSON handling)
    const updateTripSeats = async (tripId: string, seatsToRemove: string[]) => {
      if (!tripId || seatsToRemove.length === 0) return;
      
      const trip = await prisma.trip.findUnique({ where: { id: tripId } });
      if (!trip) {
        console.error(`[NULLIFY] Trip ${tripId} not found`);
        return;
      }

      // Resolve seat source (parent trip if linked)
      const seatSourceId = trip.parentTripId || tripId;
      const seatSource = seatSourceId !== tripId
        ? await prisma.trip.findUnique({ where: { id: seatSourceId } })
        : trip;
      
      if (!seatSource) {
        console.error(`[NULLIFY] Seat source trip ${seatSourceId} not found`);
        return;
      }

      // Parse current occupied seats
      const currentOccupied = parseSeatsArray(seatSource.occupiedSeats);
      console.log(`[NULLIFY] Trip ${seatSourceId} current occupied:`, currentOccupied);
      console.log(`[NULLIFY] Seats to remove:`, seatsToRemove);

      // Remove the seats
      const newOccupied = currentOccupied.filter(seat => !seatsToRemove.includes(seat));
      console.log(`[NULLIFY] Trip ${seatSourceId} new occupied:`, newOccupied);

      // Parse temp locked seats
      const tempLockedCount = seatSource.tempLockedSeats ? seatSource.tempLockedSeats.split(',').filter(Boolean).length : 0;

      // Update the seat source trip
      await prisma.trip.update({
        where: { id: seatSourceId },
        data: {
          occupiedSeats: JSON.stringify(newOccupied),
          availableSeats: seatSource.totalSeats - newOccupied.length - tempLockedCount
        }
      });

      console.log(`[NULLIFY] Trip ${seatSourceId} updated successfully`);
    };

    // Get seats from booking (departure)
    const departureSeats = parseSeatsArray(booking.seats);
    console.log(`[NULLIFY] Departure seats to free:`, departureSeats);
    
    // Get return seats if exists
    const returnSeats = parseSeatsArray(booking.returnSeats);
    console.log(`[NULLIFY] Return seats to free:`, returnSeats);

    // Free up seats on departure trip
    if (departureSeats.length > 0) {
      await updateTripSeats(booking.tripId, departureSeats);
    }

    // Free up seats on return trip
    if (booking.returnTripId && returnSeats.length > 0) {
      await updateTripSeats(booking.returnTripId, returnSeats);
    }

    // Delete passengers first (due to foreign key constraint)
    console.log(`[NULLIFY] Deleting ${booking.passengers.length} passengers`);
    await prisma.passenger.deleteMany({ where: { bookingId } });

    // Delete the booking
    console.log(`[NULLIFY] Deleting booking ${booking.orderId}`);
    await prisma.booking.delete({ where: { id: bookingId } });

    // Log successful nullification
    console.log(`[NULLIFY] Successfully nullified booking ${booking.orderId}`);

    return NextResponse.json({ 
      success: true, 
      message: `Booking ${booking.orderId} nullified successfully`,
      freedSeats: {
        departure: departureSeats,
        return: returnSeats
      }
    });
    
  } catch (err: any) {
    console.error('[NULLIFY] Error:', err);
    return NextResponse.json({ 
      error: 'Server error',
      details: err.message 
    }, { status: 500 });
  }
}