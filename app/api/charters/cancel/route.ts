import { NextRequest, NextResponse } from 'next/server';
import { prisma, executeWithRetry } from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  try {
    // Admin authentication required
    await requireAdminAuth(request);

    const { reservationId } = await request.json();
    if (!reservationId) {
      return NextResponse.json({ message: 'Missing reservationId' }, { status: 400 });
    }

    const reservation = await prisma.tripReservation.findUnique({
      where: { id: reservationId },
      include: { trip: true }
    });

    if (!reservation) {
      return NextResponse.json({ message: 'Reservation not found' }, { status: 404 });
    }

    const charterTrip = reservation.trip;
    if (!charterTrip) {
      return NextResponse.json({ message: 'Charter trip not found' }, { status: 404 });
    }

    const charterCompany = reservation.reservedCompany || reservation.reservedClientName || charterTrip.charterCompany;
    const charterTripId = charterTrip.id;

    // FIXED: Use the explicit charter dates from the trip record
    const startDate = charterTrip.charterStartDate || reservation.reservationDate || new Date(charterTrip.departureDate);
    const endDate = charterTrip.charterEndDate || startDate;

    const report = {
      unmarkedCount: 0,
      deletedReplacementsCount: 0,
      reservationCancelled: false,
      charterTripDeleted: false
    };

    await executeWithRetry(() => prisma.$transaction(async (tx) => {
      // FIXED: Use precise matching with charterTripId for both unmarking and deletion

      // 1. Unmark chartered regular trips - only those linked to THIS charter
      const unmarkResult = await tx.trip.updateMany({
        where: {
          charterTripId: charterTripId, // Explicit link - only unmark trips for this charter
          isChartered: true,
          serviceType: { notIn: ['Corporate Charter', 'Private Tours'] },
          id: { not: charterTrip.id } // Don't unmark the charter trip itself
        },
        data: {
          isChartered: false,
          charterCompany: null,
          charterDates: null,
          charterTripId: null,
          charterStartDate: null,
          charterEndDate: null
        }
      });
      report.unmarkedCount = unmarkResult.count;

      // 2. Delete replacement Private Tours - only those linked to THIS charter
      const delRes = await tx.trip.deleteMany({
        where: {
          serviceType: 'Private Tours',
          charterTripId: charterTripId // Explicit link - only delete replacements for this charter
        }
      });
      report.deletedReplacementsCount = delRes.count;

      // 3. Clean up reservation data
      await tx.seatReservation.deleteMany({
        where: { tripReservationId: reservation.id }
      });

      await tx.reservationLink.deleteMany({
        where: { tripReservationId: reservation.id }
      }).catch(() => { }); // Ignore errors if no links exist

      await tx.tripReservation.update({
        where: { id: reservation.id },
        data: { status: 'cancelled' }
      });
      report.reservationCancelled = true;

      // 4. Delete the charter trip itself
      await tx.trip.delete({
        where: { id: charterTrip.id }
      });
      report.charterTripDeleted = true;

    }, { maxWait: 10000, timeout: 30000 }), 3, 300);

    return NextResponse.json({
      ok: true,
      report,
      message: `Charter cancelled successfully. Unmarked ${report.unmarkedCount} trips, deleted ${report.deletedReplacementsCount} replacement vehicles.`
    });

  } catch (error: any) {
    console.error('Cancel charter error', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({
      message: 'Failed to cancel charter',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}