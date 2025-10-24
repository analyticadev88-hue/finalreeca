import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as reservationService from '@/lib/reservationService';

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const { tripId, seats, reservedBy } = body;
    if (!tripId || !Array.isArray(seats) || seats.length === 0) {
      return NextResponse.json({ error: 'Missing tripId or seats' }, { status: 400 });
    }

    // expiry: 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const created: any[] = [];
    for (const seat of seats) {
      try {
        const res = await reservationService.createReservation({ tripId, seatNumber: seat, reservedBy: reservedBy || null, expiresAt });
        created.push(res);
      } catch (err: any) {
        // detect unique constraint either from prisma error or SQL error message
        if (err?.code === 'P2002' || /unique/i.test(err?.message || '')) {
          return NextResponse.json({ error: `Seat ${seat} is already reserved or booked` }, { status: 409 });
        }
        throw err;
      }
    }

    return NextResponse.json({ success: true, reserved: created.map((c) => c.seatNumber), expiresAt });
  } catch (err: any) {
    console.error('Reserve seat error:', err);
    return NextResponse.json({ error: 'Failed to reserve seats' }, { status: 500 });
  }
}
