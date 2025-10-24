import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as reservationService from '@/lib/reservationService';

export async function POST() {
  try {
  const result = await reservationService.deleteExpiredReservations();
  // If typed client was unavailable, deleteExpiredReservations returns raw result; normalize
  let deleted: number;
  if (result && typeof result === 'object' && 'count' in result && typeof (result as any).count === 'number') {
    deleted = (result as any).count;
  } else if (typeof result === 'number') {
    deleted = result;
  } else {
    deleted = 0;
  }
  return NextResponse.json({ success: true, deleted });
  } catch (err: any) {
    console.error('Failed to cleanup reservations', err);
    return NextResponse.json({ error: 'Failed to cleanup' }, { status: 500 });
  }
}
