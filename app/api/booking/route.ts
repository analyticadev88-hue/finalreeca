import { NextRequest, NextResponse } from 'next/server';
import { createBookingWithRetry } from '@/lib/retrybookingservice';
import { bookingProtection, handleArcjetDecision, logArcjetDecision } from '@/lib/arcjet';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Arcjet protection: bot detection + rate limiting + email validation
    const decision = await bookingProtection.protect(req, {
      email: data.userEmail, // Validate user email
      requested: 1, // Consume 1 token
    });
    logArcjetDecision(decision, "/api/booking");

    const arcjetResult = handleArcjetDecision(decision);
    if (arcjetResult.denied) {
      return NextResponse.json(
        { success: false, error: arcjetResult.message },
        { status: arcjetResult.status }
      );
    }

    // If paymentStatus is not set, default to 'pending' (for bank deposit)
    if (!data.paymentStatus) {
      data.paymentStatus = 'pending';
    }
    let booking;
    try {
      booking = await createBookingWithRetry(data);
    } catch (err: any) {
      console.error('Create booking error:', err);
      if (err?.type === 'UniqueConstraint') {
        return NextResponse.json({ success: false, error: 'One or more seats are already booked for this trip.' }, { status: 409 });
      }
      // Reservation-related errors
      if (err?.message === 'INVALID_RESERVATION_TOKEN' || err?.message === 'RESERVATION_TOKEN_TRIP_MISMATCH') {
        return NextResponse.json({ success: false, error: 'Invalid reservation token.' }, { status: 400 });
      }
      if (err?.message === 'RESERVATION_TOKEN_ALREADY_USED') {
        return NextResponse.json({ success: false, error: 'Reservation token already used.' }, { status: 409 });
      }
      if (err?.message === 'RESERVATION_TOKEN_EXPIRED') {
        return NextResponse.json({ success: false, error: 'Reservation token expired.' }, { status: 410 });
      }
      if (err?.message === 'SELECTED_SEATS_NOT_RESERVED') {
        return NextResponse.json({ success: false, error: 'One or more selected seats are not reserved under the provided token.', detail: err?.detail || null }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: err?.message || 'Booking creation failed' }, { status: 500 });
    }
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking creation failed' }, { status: 500 });
    }
    return NextResponse.json({ success: true, bookingRef: booking.orderId, booking });
  } catch (err: any) {
    console.error('Booking creation error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to create booking' }, { status: 500 });
  }
}
