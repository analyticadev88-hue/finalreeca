import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to generate seat ids matching client layout
function generateSeatIds(totalSeats = 57) {
  const seats: string[] = [];
  const rows = 14; // same logic as client
  let seatIndex = 0;
  for (let row = 1; row <= rows; row++) {
    if (row < rows) {
      const positions = ['A', 'B', 'C', 'D'];
      for (let i = 0; i < 4; i++) {
        if (seatIndex >= totalSeats - 5) break;
        seats.push(`${row}${positions[i]}`);
        seatIndex++;
      }
    } else {
      const positions = ['A', 'B', 'C', 'D', 'E'];
      for (let i = 0; i < 5; i++) {
        seats.push(`${row}${positions[i]}`);
        seatIndex++;
        if (seatIndex >= totalSeats) break;
      }
    }
  }
  return seats.slice(0, totalSeats);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tripId, clientName, seats, notes, contactPhone, contactEmail, liaisonPerson, company } = body;

    if (!tripId || !clientName || !seats || seats <= 0) {
      return NextResponse.json({ message: 'Missing or invalid input' }, { status: 400 });
    }

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return NextResponse.json({ message: 'Trip not found' }, { status: 404 });

    // Resolve seat source (parent trip if linked)
    const seatSourceId = trip.parentTripId || tripId;
    const seatSource = seatSourceId !== tripId
      ? await prisma.trip.findUnique({ where: { id: seatSourceId } })
      : trip;

    if (!seatSource) return NextResponse.json({ message: 'Seat source trip not found' }, { status: 404 });

    // Determine already occupied and booked seats from seat source
    let occupiedSeats: string[] = [];
    if (seatSource.occupiedSeats) {
      try { occupiedSeats = JSON.parse(seatSource.occupiedSeats); } catch { occupiedSeats = []; }
    }

    const bookings = await prisma.booking.findMany({
      where: { tripId: seatSourceId, bookingStatus: 'confirmed', paymentStatus: 'paid' },
      include: { passengers: true }
    });
    const bookedSeatsFromBookings = bookings.flatMap(b => b.passengers.map(p => p.seatNumber));

    // Also check bookings on the child trip itself
    const childBookings = tripId !== seatSourceId
      ? await prisma.booking.findMany({
          where: { tripId, bookingStatus: 'confirmed', paymentStatus: 'paid' },
          include: { passengers: true }
        })
      : [];
    const childBookedSeats = childBookings.flatMap(b => b.passengers.map(p => p.seatNumber));

    const existingReservations = await prisma.seatReservation.findMany({ where: { tripId: seatSourceId } });
    const existingReservedSeats = existingReservations.map(r => r.seatNumber);

    const allSeatIds = generateSeatIds(seatSource.totalSeats);
    const unavailable = new Set([...occupiedSeats, ...bookedSeatsFromBookings, ...childBookedSeats, ...existingReservedSeats]);
    const availableSeatIds = allSeatIds.filter(s => !unavailable.has(s));

    if (seats > availableSeatIds.length) {
      return NextResponse.json({ message: 'Not enough specific seats available to reserve' }, { status: 400 });
    }

    const seatsToCreate = availableSeatIds.slice(0, seats);

    const tripReservation = await prisma.tripReservation.create({
      data: {
        tripId: seatSourceId,
        reservedClientName: clientName,
        reservedContactPhone: contactPhone || null,
        reservedContactEmail: contactEmail || null,
        reservedLiaisonPerson: liaisonPerson || null,
        reservedCompany: company || null,
        reservedNotes: notes || null,
        reservedSeatsCount: seats,
      }
    });

    const createdReservations = [] as any[];
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    for (const seatNumber of seatsToCreate) {
      const created = await prisma.seatReservation.create({
        data: { tripId: seatSourceId, seatNumber, reservedBy: clientName, expiresAt, tripReservationId: tripReservation.id }
      });
      createdReservations.push(created);
    }

    const allBookings = await prisma.booking.findMany({ where: { tripId: seatSourceId, bookingStatus: 'confirmed', paymentStatus: 'paid' }, include: { passengers: true } });
    const bookedSeatsFromAllBookings = allBookings.flatMap(b => b.passengers.map(p => p.seatNumber));
    const currentReservations = await prisma.seatReservation.findMany({ where: { tripId: seatSourceId } });
    const currentReservedSeats = currentReservations.map(r => r.seatNumber);
    const allUnavailable = new Set([...(JSON.parse(seatSource.occupiedSeats || '[]')), ...bookedSeatsFromAllBookings, ...currentReservedSeats]);
    const recomputedAvailable = Math.max(0, seatSource.totalSeats - allUnavailable.size);
    const updatedTrip = await prisma.trip.update({ where: { id: seatSourceId }, data: { availableSeats: recomputedAvailable } });

    return NextResponse.json({
      success: true,
      tripReservationId: tripReservation.id,
      reservedSeatsCount: existingReservedSeats.length + seatsToCreate.length,
      reservedSeatNumbers: seatsToCreate,
      reservationIds: createdReservations.map(r => r.id),
      availableSeats: updatedTrip.availableSeats,
    });
  } catch (error) {
    console.error('Reserve seats error:', error);
    return NextResponse.json({ message: 'Failed to reserve seats', error: (error as Error).message }, { status: 500 });
  }
}
