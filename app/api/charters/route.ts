import { NextRequest, NextResponse } from 'next/server';
import { prisma, executeWithRetry } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { getRouteDescriptors } from '@/lib/busRoutes';
import { requireAdminAuth } from '@/lib/adminAuth';

function generateToken() {
  return uuidv4().replace(/-/g, '').slice(0, 24);
}

export async function POST(request: NextRequest) {
  try {
    // Admin authentication required
    await requireAdminAuth(request);

    const body = await request.json();
    const {
      buses,
      company,
      startDate,
      endDate,
      customRoute,
      isRoundTrip,
      customFare,
      totalSeats,
      deployReplacement,
      replacementVehicles,
    } = body;

    if (!company || !startDate || !endDate || !customRoute) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const DEFAULT_PUBLIC_FARE = Number(process.env.DEFAULT_PUBLIC_FARE) || 500;
    const QUANTUM_FARE = Number(process.env.QUANTUM_FARE) || DEFAULT_PUBLIC_FARE;
    const QUANTUM_DURATION = Number(process.env.QUANTUM_DURATION) || 390;

    let descriptors: Array<any> = [];
    if (Array.isArray(buses) && buses.length > 0) {
      descriptors = getRouteDescriptors(buses as string[]);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
    const charterStartDate = new Date(startDate);
    const charterEndDate = new Date(endDate);

    const txResult = await executeWithRetry(() => prisma.$transaction(async (tx) => {
      // Create charter trip
      const charterTrip = await tx.trip.create({
        data: {
          serviceType: 'Corporate Charter',
          routeName: customRoute,
          routeOrigin: customRoute.split('→')[0]?.trim() || customRoute.split('to')[0]?.trim() || customRoute,
          routeDestination: customRoute.split('→')[1]?.trim() || customRoute.split('to')[1]?.trim() || customRoute,
          departureDate: charterStartDate,
          departureTime: '00:00',
          totalSeats: totalSeats || 57,
          availableSeats: totalSeats || 57,
          fare: Number(customFare) || 0,
          durationMinutes: 0,
          boardingPoint: '',
          droppingPoint: '',
          promoActive: false,
          isChartered: true,
          charterCompany: company,
          charterDates: `${startDate} to ${endDate}`,
          charterStartDate: charterStartDate,
          charterEndDate: charterEndDate,
        }
      });

      // Create reservation
      const reservation = await tx.tripReservation.create({
        data: {
          tripId: charterTrip.id,
          reservedClientName: company,
          reservedContactPhone: null,
          reservedContactEmail: null,
          reservedLiaisonPerson: null,
          reservedCompany: company,
          reservedNotes: `Charter ${isRoundTrip ? 'Round Trip' : 'One Way'}`,
          reservedSeatsCount: totalSeats || 57,
        },
        include: { trip: true }
      });

      // Create seat reservations
      const seatNumbers: string[] = [];
      for (let i = 1; i <= (totalSeats || 57); i++) seatNumbers.push(String(i));
      const seatCreates = seatNumbers.map((s) => ({
        tripId: reservation.trip.id,
        seatNumber: s,
        reservedBy: `charter:${reservation.id}`,
        tripReservationId: reservation.id,
        expiresAt,
      }));
      await tx.seatReservation.createMany({ data: seatCreates });

      const conflictReport: Array<any> = [];
      let totalMarked = 0;
      const replacementTrips: any[] = [];

      if (deployReplacement && Array.isArray(replacementVehicles) && replacementVehicles.length > 0) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateCopy = new Date(d);
          const startOfDay = new Date(dateCopy);
          startOfDay.setHours(0, 0, 0, 0);
          const nextDay = new Date(startOfDay);
          nextDay.setDate(nextDay.getDate() + 1);

          for (const desc of descriptors) {
            const origin = desc.origin;
            const dest = desc.destination;
            const time = desc.departureTime;

            const findWhere: any = {
              routeOrigin: origin,
              routeDestination: dest,
              departureDate: { gte: startOfDay, lt: nextDay },
              isChartered: false,
              serviceType: { notIn: ['Corporate Charter', 'Private Tours'] },
            };
            if (time) findWhere.departureTime = { startsWith: time };

            const originalTrip = await tx.trip.findFirst({ where: findWhere });
            const originalFare = originalTrip?.fare ?? DEFAULT_PUBLIC_FARE;
            let originalDuration = originalTrip?.durationMinutes ?? 0;
            if (!originalDuration || originalDuration <= 0) originalDuration = 390;
            const originalBoarding = originalTrip?.boardingPoint ?? '';
            const originalDropping = originalTrip?.droppingPoint ?? '';
            const originalPromo = originalTrip?.promoActive ?? false;

            // Mark regular trips as chartered
            const where: any = {
              routeOrigin: origin,
              routeDestination: dest,
              departureDate: { gte: startOfDay, lt: nextDay },
              isChartered: false,
              serviceType: desc.serviceType,
            };
            if (time) where.departureTime = time;

            const updated = await tx.trip.updateMany({
              where,
              data: {
                isChartered: true,
                charterCompany: company,
                charterDates: `${startDate} to ${endDate}`,
                charterTripId: charterTrip.id,
                charterStartDate: charterStartDate,
                charterEndDate: charterEndDate,
              }
            });
            totalMarked += updated.count;

            conflictReport.push({
              route: `${origin} → ${dest}`,
              departureTime: time || null,
              date: startOfDay.toISOString().split('T')[0],
              matched: updated.count,
            });

            const fareToUse = QUANTUM_FARE;
            const durationToUse = QUANTUM_DURATION;

            // Calculate total seats for all replacement vehicles
            const totalReplacementSeats = replacementVehicles.reduce((sum: number, vehicle: any) => {
              return sum + (Number(vehicle.count) || 0) * (Number(vehicle.seats) || 0);
            }, 0);

            // ✅ FIXED: Create vehicles array for JSON storage
            const vehiclesArray = replacementVehicles.flatMap((vehicle: any, vehicleTypeIndex: any) =>
              Array.from({ length: Number(vehicle.count) || 0 }, (_, vehicleInstanceIndex) => ({
                id: vehicleInstanceIndex + 1, // Vehicle instance ID (1, 2, 3...)
                name: vehicle.name || 'Toyota Hiace',
                type: vehicle.name?.toLowerCase().includes('sprinter') ? 'sprinter' : 'hiace',
                seats: Number(vehicle.seats) || 14,
                totalSeats: Number(vehicle.seats) || 14
              }))
            );

            // ✅ FIXED: Create SINGLE replacement trip with JSON vehicles data
            replacementTrips.push({
              serviceType: 'Private Tours',
              routeName: `${origin} → ${dest}`,
              routeOrigin: origin,
              routeDestination: dest,
              departureDate: startOfDay,
              departureTime: time || '00:00',
              totalSeats: totalReplacementSeats,
              availableSeats: totalReplacementSeats,
              fare: fareToUse,
              durationMinutes: durationToUse,
              boardingPoint: originalBoarding,
              droppingPoint: originalDropping,
              promoActive: originalPromo,
              isChartered: false,
              charterCompany: company,
              charterDates: `${startDate} to ${endDate}`,
              charterTripId: charterTrip.id,
              charterStartDate: charterStartDate,
              charterEndDate: charterEndDate,
              // ✅ CRITICAL: Store vehicles as JSON array
              replacementVehicles: JSON.stringify(vehiclesArray),
              vehicleCount: vehiclesArray.length
            });
          }
        }

        // Create replacement trips
        if (replacementTrips.length > 0) {
          await tx.trip.createMany({
            data: replacementTrips,
            skipDuplicates: true
          });
        }
      }

      const token = generateToken();
      const link = await tx.reservationLink.create({
        data: {
          token,
          tripReservationId: reservation.id,
          contactEmail: null,
          prepaid: false,
          expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
        }
      });

      return {
        reservationId: reservation.id,
        linkToken: link.token,
        conflictReport,
        totalMarked,
        replacementTripsCreated: replacementTrips.length,
      };
    }, { maxWait: 15000, timeout: 45000 }), 3, 500);

    return NextResponse.json({
      ok: true,
      reservationId: txResult.reservationId,
      link: { token: txResult.linkToken },
      conflictReport: txResult.conflictReport,
      totalMarked: txResult.totalMarked,
      replacementTripsCreated: txResult.replacementTripsCreated,
    });
  } catch (error: any) {
    console.error('Create charter error', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({
      message: 'Failed to create charter',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Admin authentication required
    await requireAdminAuth(request);

    const reservations = await prisma.tripReservation.findMany({
      where: {
        trip: { serviceType: 'Corporate Charter' },
        status: { not: 'cancelled' }
      },
      include: {
        trip: true,
        seatReservations: true,
        reservationLinks: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const payload = reservations.map(r => ({
      id: r.id,
      reservedClientName: r.reservedClientName,
      reservedCompany: r.reservedCompany,
      reservedSeatsCount: r.reservedSeatsCount,
      reservationDate: r.reservationDate,
      status: r.status,
      trip: r.trip,
      reservedSeatNumbers: r.seatReservations.map(s => s.seatNumber),
      links: r.reservationLinks.map(l => ({
        id: l.id,
        token: l.token,
        expiresAt: l.expiresAt,
        used: l.used
      }))
    }));

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Fetch charters error', error);
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({
      message: 'Failed to fetch charters',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}