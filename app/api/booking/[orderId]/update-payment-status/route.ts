import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Extract orderId from the URL pathname
    const url = req.nextUrl;
    const segments = url.pathname.split('/');
    const orderId = segments[segments.indexOf('booking') + 1];
    const { paymentStatus } = await req.json();
    if (!orderId || !paymentStatus) {
      return NextResponse.json({ error: 'Missing orderId or paymentStatus' }, { status: 400 });
    }

    // Update booking paymentStatus and bookingStatus using orderId (booking reference)
    const booking = await prisma.booking.update({
      where: { orderId },
      data: {
        paymentStatus,
        bookingStatus: paymentStatus === 'Paid' ? 'Confirmed' : undefined,
      },
    });

    return NextResponse.json({ success: true, booking });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
  }
}
