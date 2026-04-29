import { prisma } from '@/lib/prisma';
import { deduplicateRequest } from '@/utils/requestDeduplication';

export async function createBookingWithRetry(data: any, maxRetries = 3) {
  const orderId = data.orderId;
  const startTime = Date.now();

  function joinPhone(code: string | undefined, number: string | undefined) {
    if (!number) return '';
    if (!code) return number;
    const cleanNumber = number.replace(/^0+/, '');
    return `${code}${cleanNumber}`;
  }

  const requestKey = `booking:${orderId}`;
  console.log(`[${orderId}] Deduplicating booking creation with key: ${requestKey}`);

  return await deduplicateRequest(requestKey, async () => {
    console.log(`\n===== [DB] START: CREATE BOOKING [${orderId}] (${new Date().toISOString()}) =====`);
    console.log(`[${orderId}] Received booking data:`, {
      orderId: data.orderId,
      tripId: data.tripId,
      returnTripId: data.returnTripId,
      userName: data.userName,
      passengerCount: data.passengers?.length || 0,
      departureSeats: data.departureSeats?.length || 0,
      returnSeats: data.returnSeats?.length || 0,
    });

    const userPhone = joinPhone(data.contactDetails?.mobileCountryCode, data.contactDetails?.mobile || data.userPhone);
    const emergencyContactPhone = joinPhone(data.emergencyContact?.phoneCountryCode, data.emergencyContact?.phone);

    const departureSeats = Array.isArray(data.departureSeats) 
      ? Array.from(new Set(data.departureSeats)) 
      : [];
    const returnSeats = Array.isArray(data.returnSeats) 
      ? Array.from(new Set(data.returnSeats)) 
      : [];

    console.log(`[${orderId}] Seat counts: ${departureSeats.length} departure, ${returnSeats.length} return`);

    const passengersByKey = new Map<string, any>();
    
    if (Array.isArray(data.passengers)) {
      console.log(`[${orderId}] Processing ${data.passengers.length} passenger records...`);
      
      for (const p of data.passengers) {
        const passengerTripId = p.isReturn && data.returnTripId 
          ? data.returnTripId 
          : data.tripId;
        
        const key = `${passengerTripId}::${p.seatNumber}::${p.isReturn ? 'return' : 'departure'}`;
        
        if (!passengersByKey.has(key)) {
          passengersByKey.set(key, { 
            ...p, 
            tripId: passengerTripId,
            isNeighbourFreeSeat: p.isNeighbourFreeSeat || false 
          });
          console.log(`[${orderId}] Added passenger: ${p.seatNumber} (${p.isReturn ? 'return' : 'departure'})`);
        } else {
          console.log(`[${orderId}] Duplicate passenger ignored: ${p.seatNumber} (${p.isReturn ? 'return' : 'departure'})`);
        }
      }
    }

    const uniquePassengers = Array.from(passengersByKey.values());
    const departurePassengers = uniquePassengers.filter(p => !p.isReturn);
    const returnPassengers = uniquePassengers.filter(p => p.isReturn);

    console.log(`[${orderId}] Unique passenger counts: ${departurePassengers.length} departure, ${returnPassengers.length} return`);
    
    // CRITICAL: Check for neighbour-free companion seats without details
    const departureCompanionSeatsWithoutDetails = departurePassengers.filter(p => 
      p.isNeighbourFreeSeat && (!p.firstName || !p.firstName.trim())
    );
    const returnCompanionSeatsWithoutDetails = returnPassengers.filter(p => 
      p.isNeighbourFreeSeat && (!p.firstName || !p.firstName.trim())
    );
    
    if (departureCompanionSeatsWithoutDetails.length > 0 || returnCompanionSeatsWithoutDetails.length > 0) {
      console.warn(`[${orderId}] WARNING: ${departureCompanionSeatsWithoutDetails.length} departure and ${returnCompanionSeatsWithoutDetails.length} return companion seats without details`);
      
      // Auto-fill companion seats with primary passenger details
      const autoFilled = [];
      const primaryPassengers = uniquePassengers.filter(p => !p.isNeighbourFreeSeat);
      
      for (const companion of [...departureCompanionSeatsWithoutDetails, ...returnCompanionSeatsWithoutDetails]) {
        // Find matching primary passenger (same seat row, adjacent seat)
        const primary = primaryPassengers.find(p => 
          p.isReturn === companion.isReturn && 
          p.seatNumber.charAt(0) === companion.seatNumber.charAt(0)
        );
        
        if (primary) {
          companion.firstName = primary.firstName;
          companion.lastName = primary.lastName;
          companion.passportNumber = primary.passportNumber;
          companion.birthdate = primary.birthdate;
          companion.phone = primary.phone;
          companion.nextOfKinName = primary.nextOfKinName;
          companion.nextOfKinPhone = primary.nextOfKinPhone;
          autoFilled.push(companion.seatNumber);
        }
      }
      
      if (autoFilled.length > 0) {
        console.log(`[${orderId}] Auto-filled ${autoFilled.length} companion seats: ${autoFilled.join(', ')}`);
      }
    }

    // FLEXIBLE VALIDATION: Account for neighbour-free seating
    const departurePassengersNeedingDetails = departurePassengers.filter(p => 
      !p.isNeighbourFreeSeat || (p.firstName && p.firstName.trim())
    );
    const returnPassengersNeedingDetails = returnPassengers.filter(p => 
      !p.isNeighbourFreeSeat || (p.firstName && p.firstName.trim())
    );
    
    // Log validation warnings but don't block for neighbour-free
    if (departurePassengersNeedingDetails.length !== departureSeats.length) {
      const hasNeighbourFree = departurePassengers.some(p => p.isNeighbourFreeSeat);
      if (hasNeighbourFree) {
        console.warn(`[${orderId}] Neighbour-free departure detected: ${departurePassengersNeedingDetails.length} passengers for ${departureSeats.length} seats`);
      } else {
        const error = `Departure mismatch: ${departurePassengersNeedingDetails.length} passengers for ${departureSeats.length} seats`;
        console.error(`[${orderId}] VALIDATION FAILED: ${error}`);
        throw new Error(`VALIDATION_FAILED: ${error}`);
      }
    }

    if (returnPassengersNeedingDetails.length !== returnSeats.length) {
      const hasNeighbourFree = returnPassengers.some(p => p.isNeighbourFreeSeat);
      if (hasNeighbourFree) {
        console.warn(`[${orderId}] Neighbour-free return detected: ${returnPassengersNeedingDetails.length} passengers for ${returnSeats.length} seats`);
      } else {
        const error = `Return mismatch: ${returnPassengersNeedingDetails.length} passengers for ${returnSeats.length} seats`;
        console.error(`[${orderId}] VALIDATION FAILED: ${error}`);
        throw new Error(`VALIDATION_FAILED: ${error}`);
      }
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[${orderId}] Attempt ${attempt}/${maxRetries}`);

      try {
        const result = await prisma.$transaction(async (tx) => {
          const existing = await tx.booking.findUnique({
            where: { orderId: data.orderId },
            include: { passengers: true }
          });

          if (existing) {
            console.log(`[${orderId}] Booking exists - Status: ${existing.paymentStatus}`);
            
            if (existing.paymentStatus === 'paid') {
              throw new Error('BOOKING_ALREADY_PAID');
            }
            
            return existing;
          }

          console.log(`[${orderId}] Creating new booking...`);

          let reservationLinkRecord: any = null;
          if (data.reservationToken) {
            reservationLinkRecord = await tx.reservationLink.findUnique({
              where: { token: data.reservationToken },
              include: {
                tripReservation: {
                  include: { seatReservations: true }
                }
              }
            });

            if (!reservationLinkRecord) {
              throw new Error('INVALID_RESERVATION_TOKEN');
            }
            if (reservationLinkRecord.used) {
              throw new Error('RESERVATION_TOKEN_ALREADY_USED');
            }
            if (reservationLinkRecord.expiresAt && new Date(reservationLinkRecord.expiresAt) < new Date()) {
              throw new Error('RESERVATION_TOKEN_EXPIRED');
            }
            if (reservationLinkRecord.tripReservation.tripId !== data.tripId) {
              throw new Error('RESERVATION_TOKEN_TRIP_MISMATCH');
            }

            const reservedSeats = reservationLinkRecord.tripReservation.seatReservations.map((s: any) => s.seatNumber);
            const allSelectedSeats = [...departureSeats, ...returnSeats];
            const missingSeats = allSelectedSeats.filter(s => !reservedSeats.includes(s));
            
            if (missingSeats.length > 0) {
              const err: any = new Error('SELECTED_SEATS_NOT_RESERVED');
              err.detail = { missingSeats };
              throw err;
            }

            if (reservationLinkRecord.prepaid) {
              data.paymentStatus = 'paid';
              data.paymentMode = data.paymentMode || 'Prepaid Link';
            }
          }

          let validConsultantId = null;
          if (data.consultantId && typeof data.consultantId === 'string' && data.consultantId.length > 0) {
            const consultantExists = await tx.consultant.findUnique({ 
              where: { id: data.consultantId } 
            });
            if (consultantExists) {
              validConsultantId = data.consultantId;
            }
          }

          const created = await tx.booking.create({
            data: {
              tripId: data.tripId,
              userName: data.userName,
              userEmail: data.userEmail,
              userPhone: userPhone,
              seats: JSON.stringify(departureSeats),
              seatCount: departureSeats.length + returnSeats.length,
              totalPrice: data.totalPrice,
              boardingPoint: data.boardingPoint,
              droppingPoint: data.droppingPoint,
              orderId: data.orderId,
              paymentStatus: data.paymentStatus || 'pending',
              bookingStatus: 'confirmed',
              paymentMode: data.paymentMode || 'Credit Card',
              returnTripId: data.returnTripId || null,
              returnBoardingPoint: data.returnBoardingPoint || null,
              returnDroppingPoint: data.returnDroppingPoint || null,
              returnSeats: returnSeats.length ? JSON.stringify(returnSeats) : null,
              promoCode: data.promoCode || null,
              discountAmount: data.discountAmount || 0,
              emergencyContactName: data.emergencyContact?.name || "",
              emergencyContactPhone: emergencyContactPhone,
              addons: data.addons || null,
              agentId: data.agentId || null,
              consultantId: validConsultantId,
              contactIdNumber: data.contactDetails?.idNumber || "",
            },
          });

          console.log(`[${orderId}] Booking created: ${created.id}`);

          if (uniquePassengers.length > 0) {
            console.log(`[${orderId}] Creating ${uniquePassengers.length} passengers...`);

            const passengerData = uniquePassengers.map((p: any) => ({
              bookingId: created.id,
              tripId: p.tripId,
              firstName: p.firstName.trim() || (p.isNeighbourFreeSeat ? 'Companion' : ''),
              lastName: p.lastName.trim() || (p.isNeighbourFreeSeat ? 'Passenger' : ''),
              seatNumber: p.seatNumber,
              title: p.title || 'Mr',
              isReturn: p.isReturn,
              hasInfant: p.hasInfant ?? false,
              infantBirthdate: p.infantBirthdate ?? null,
              infantName: p.infantName ?? null,
              infantPassportNumber: p.infantPassportNumber ?? null,
              birthdate: p.birthdate ?? null,
              passportNumber: p.passportNumber || (p.isNeighbourFreeSeat ? 'SAME_AS_PRIMARY' : ''),
              type: p.type ?? 'adult',
              phone: joinPhone(p.phoneCountryCode, p.phone) || null,
              nextOfKinName: p.nextOfKinName || null,
              nextOfKinPhone: joinPhone(p.nextOfKinPhoneCountryCode, p.nextOfKinPhone) || null,
            }));

            await tx.passenger.createMany({ data: passengerData });
            console.log(`[${orderId}] ✓ Created ${uniquePassengers.length} passengers`);
          }

          if (departureSeats.length > 0) {
            const existingTrip = await tx.trip.findUnique({ where: { id: data.tripId } });
            const currentOccupied = JSON.parse(existingTrip?.occupiedSeats || '[]');
            const newOccupied = Array.from(new Set([...currentOccupied, ...departureSeats]));
            await tx.trip.update({
              where: { id: data.tripId },
              data: {
                occupiedSeats: JSON.stringify(newOccupied),
                availableSeats: (existingTrip?.totalSeats || 0) - newOccupied.length - (existingTrip?.tempLockedSeats ? existingTrip.tempLockedSeats.split(',').filter(Boolean).length : 0)
              }
            });
            console.log(`[${orderId}] ✓ Updated departure trip: ${newOccupied.length} occupied seats`);
          }

          if (returnSeats.length > 0 && data.returnTripId) {
            const returnTrip = await tx.trip.findUnique({ where: { id: data.returnTripId } });
            const currentOccupied = JSON.parse(returnTrip?.occupiedSeats || '[]');
            const newOccupied = Array.from(new Set([...currentOccupied, ...returnSeats]));
            await tx.trip.update({
              where: { id: data.returnTripId },
              data: {
                occupiedSeats: JSON.stringify(newOccupied),
                availableSeats: (returnTrip?.totalSeats || 0) - newOccupied.length - (returnTrip?.tempLockedSeats ? returnTrip.tempLockedSeats.split(',').filter(Boolean).length : 0)
              }
            });
            console.log(`[${orderId}] ✓ Updated return trip: ${newOccupied.length} occupied seats`);
          }

          if (reservationLinkRecord) {
            await tx.reservationLink.update({
              where: { id: reservationLinkRecord.id },
              data: { used: true }
            });

            await tx.tripReservation.update({
              where: { id: reservationLinkRecord.tripReservationId },
              data: { status: 'converted' }
            });

            const seatIds = reservationLinkRecord.tripReservation.seatReservations.map((s: any) => s.id);
            if (seatIds.length) {
              await tx.seatReservation.deleteMany({ where: { id: { in: seatIds } } });
            }
            
            console.log(`[${orderId}] ✓ Reservation token consumed`);
          }

          const fullBooking = await tx.booking.findUnique({
            where: { orderId: data.orderId },
            include: { passengers: true },
          });

          if (fullBooking?.passengers) {
            const finalDepartureCount = fullBooking.passengers.filter((p: any) => !p.isReturn).length;
            const finalReturnCount = fullBooking.passengers.filter((p: any) => p.isReturn).length;
            
            console.log(`[${orderId}] ✓ Final validation: ${finalDepartureCount} departure, ${finalReturnCount} return passengers`);
            
            if (finalDepartureCount !== departureSeats.length) {
              console.warn(`[${orderId}] ⚠️ Departure passenger mismatch in DB: ${finalDepartureCount} vs ${departureSeats.length} seats`);
            }
            if (finalReturnCount !== returnSeats.length) {
              console.warn(`[${orderId}] ⚠️ Return passenger mismatch in DB: ${finalReturnCount} vs ${returnSeats.length} seats`);
            }
          }

          const duration = Date.now() - startTime;
          console.log(`[${orderId}] ===== SUCCESS (${duration}ms) =====\n`);
          return fullBooking;
        }, {
          maxWait: 10000,
          timeout: 20000,
          isolationLevel: 'ReadCommitted',
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`[${orderId}] Attempt ${attempt} failed (${duration}ms):`, error.message);

        if (error.message === 'BOOKING_ALREADY_PAID') {
          throw new Error('This booking has already been processed and paid for.');
        }

        if ((error.code === 'P2028' || error.code === 'P1002') && attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.log(`[${orderId}] Retrying in ${delay}ms...`);
          await new Promise(res => setTimeout(res, delay));
          continue;
        }

        console.error(`[${orderId}] ===== FAILED (${duration}ms) =====\n`);

        if (error.code === 'P2002') {
          const err: any = new Error('UniqueConstraint');
          err.type = 'UniqueConstraint';
          err.detail = error.meta || {};
          throw err;
        }
        
        throw error;
      }
    }

    throw new Error('All retry attempts failed');
  });
}