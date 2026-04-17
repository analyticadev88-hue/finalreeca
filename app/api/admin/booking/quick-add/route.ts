// app/api/admin/booking/quick-add/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { createBookingWithRetry } from '@/lib/retrybookingservice';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const data = await req.json();
    
    // Generate a unique order ID if not provided
    // Using a shorter prefix + uuid for walk-ins
    if (!data.orderId) {
      data.orderId = `WLK-${uuidv4().substring(0, 8).toUpperCase()}`;
    }

    // Admins can add bookings regardless of trip departure status
    // and they usually confirm payment immediately for cash/swipe
    data.bookingStatus = 'confirmed';
    if (data.paymentMode === 'Cash' || data.paymentMode === 'Swipe in Person') {
        data.paymentStatus = 'paid';
    }

    const booking = await createBookingWithRetry(data);

    if (!booking) {
      throw new Error('Booking creation failed');
    }

    return NextResponse.json({ 
      success: true, 
      bookingRef: booking.orderId, 
      booking 
    });
  } catch (error: any) {
    console.error('Quick add booking error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to create quick booking' 
    }, { status: 500 });
  }
}
