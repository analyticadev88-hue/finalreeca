import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const { id } = params || {};
    if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 });

    const r = await prisma.tripReservation.findUnique({ where: { id }, include: { seatReservations: true, trip: true, reservationLinks: true } });
    if (!r) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    return NextResponse.json(r);
  } catch (err) {
    console.error('Fetch reservation error', err);
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}
