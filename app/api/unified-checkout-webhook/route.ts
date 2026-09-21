import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as reservationService from '@/lib/reservationService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // In a production environment, you should:
    // 1. Verify the payload signature from Cybersource if this is a true webhook
    // 2. OR if this is called from the frontend, verify the transaction status
    //    by querying Cybersource API using the transactionId from paymentResult.
    
    const { orderId, paymentResult, status } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: { orderId },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Release the held seats in every outcome: consumed by a paid booking,
    // or no longer needed after a cancel/failure.
    try {
      await reservationService.deleteReservationsByReservedBy(booking.tripId, orderId);
    } catch (err: any) {
      console.warn('Failed to clean up seat reservations for order', orderId, err);
    }

    const outcome = status || 'success';

    if (outcome === 'success') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: 'paid',
          paymentMode: 'Cybersource',
        },
      });
      return NextResponse.json({ success: true, message: 'Payment recorded successfully' });
    }

    // Payment was cancelled or failed — mark it and keep the seats released.
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentStatus: outcome === 'cancelled' ? 'cancelled' : 'failed',
      },
    });

    return NextResponse.json({ success: true, message: `Payment ${outcome}; seats released` });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
