import { NextRequest, NextResponse } from 'next/server';
import { deduplicateRequest } from '@/utils/requestDeduplication';
import { createBookingWithRetry } from '@/lib/retrybookingservice';
import { createToken } from '@/lib/dpoService';
import { prisma } from '@/lib/prisma';
import * as reservationService from '@/lib/reservationService';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const AGENT_JWT_SECRET = process.env.JWT_SECRET || "topo123";
const CONSULTANT_JWT_SECRET = process.env.JWT_SECRET || "changeme-in-production";

export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();
    const { totalPrice, userName, userEmail, selectedSeats, tripId } = body;

    if (!tripId || !totalPrice || !userName || !userEmail || !selectedSeats?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const orderId = body.orderId || Math.floor(100000 + Math.random() * 900000).toString();
    const bookingData = {
      ...body,
      orderId,
    };

    const cookieStore = await cookies();
    const agentToken = cookieStore.get('agent_token')?.value;
    const consultantToken = cookieStore.get('consultant_token')?.value;

    let agentId: string | null = null;
    let consultantId: string | null = null;

    if (agentToken) {
      try {
        const payload: any = jwt.verify(agentToken, AGENT_JWT_SECRET);
        agentId = payload?.id || null;
      } catch {
        agentId = null;
      }
    }
    if (consultantToken) {
      try {
        const payload: any = jwt.verify(consultantToken, CONSULTANT_JWT_SECRET);
        consultantId = payload?.id || null;
      } catch {
        consultantId = null;
      }
    }

    bookingData.agentId = agentId;
    bookingData.consultantId = consultantId;

    // If skipDPO is true (consultant paid in cash), just mark as paid and return success
    if (body.skipDPO && body.paymentMode === "Cash") {
      const booking = await createBookingWithRetry(bookingData);
      if (!booking) {
        return NextResponse.json({ error: 'Booking creation failed. Please try again.' }, { status: 500 });
      }
      // Mark as paid in DB
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "paid",
          paymentMode: "Cash",
        },
      });
      return NextResponse.json({ success: true, orderId });
    }

    // Reserve seats optimistically to reduce race conditions (10 minute expiry)
    try {
      const seatsArray = Array.isArray(selectedSeats)
        ? selectedSeats.map((s: any) => (typeof s === 'object' ? s?.seatNumber ?? s : s))
        : [];
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      for (const seat of seatsArray) {
        try {
          await reservationService.createReservation({ tripId, seatNumber: String(seat), reservedBy: orderId, expiresAt });
        } catch (err: any) {
          if (err?.code === 'P2002' || /unique/i.test(err?.message || '')) {
            return NextResponse.json({ error: `Seat ${seat} is no longer available. Please refresh and try again.` }, { status: 409 });
          }
          throw err;
        }
      }
    } catch (err: any) {
      console.error('Seat reservation error:', err);
      return NextResponse.json({ error: 'Failed to reserve seats. Please try again.' }, { status: 500 });
    }

    // Create booking in DB (pending payment)
    let booking;
    try {
      booking = await createBookingWithRetry(bookingData);
    } catch (err: any) {
      console.error('DPO create booking error:', err);
      if (err?.type === 'UniqueConstraint') {
        return NextResponse.json({ error: 'One or more seats are already booked for this trip. Please review your seats and try again.' }, { status: 409 });
      }
      if (err?.message === 'INVALID_RESERVATION_TOKEN' || err?.message === 'RESERVATION_TOKEN_TRIP_MISMATCH') {
        return NextResponse.json({ error: 'Invalid reservation token.' }, { status: 400 });
      }
      if (err?.message === 'RESERVATION_TOKEN_ALREADY_USED') {
        return NextResponse.json({ error: 'Reservation token already used.' }, { status: 409 });
      }
      if (err?.message === 'RESERVATION_TOKEN_EXPIRED') {
        return NextResponse.json({ error: 'Reservation token expired.' }, { status: 410 });
      }
      if (err?.message === 'SELECTED_SEATS_NOT_RESERVED') {
        return NextResponse.json({ error: 'One or more selected seats are not reserved under the provided token.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Booking creation failed. Please try again.' }, { status: 500 });
    }
    if (!booking) {
      return NextResponse.json({ error: 'Booking creation failed. Please try again.' }, { status: 500 });
    }

    // Create DPO token
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?order_id=${orderId}`;
    const backUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?order_id=${orderId}`;
    const dpoResponse = await createToken({
      ...body,
      orderId,
      redirectUrl,
      backUrl,
    });

    if (!dpoResponse.success || !dpoResponse.paymentUrl) {
      return NextResponse.json({ error: dpoResponse.error || 'Failed to create DPO payment session' }, { status: 500 });
    }

    // Save transactionToken to booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        transactionToken: dpoResponse.transactionToken,
      },
    });

    // Consume / remove reservations for this order (they are now booked)
    try {
      await reservationService.deleteReservationsByReservedBy(tripId, orderId);
    } catch (err: any) {
      console.warn('Failed to clean up seat reservations for order', orderId, err);
    }

    return NextResponse.json({
      url: dpoResponse.paymentUrl,
      orderId,
      transactionToken: dpoResponse.transactionToken,
    });
  } catch (error: any) {
    console.error('DPO Session Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
