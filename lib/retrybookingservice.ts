import { prisma } from '@/lib/prisma';
import { deduplicateRequest, generateRequestKey } from '@/utils/requestDeduplication';

export async function createBookingWithRetry(data: any, maxRetries = 3) {
  const orderId = data.orderId;
  const startTime = Date.now();

  // Helper to join country code and number
  function joinPhone(code: string | undefined, number: string | undefined) {
    if (!number) return '';
    if (!code) return number;
    // Remove leading zeros from number
    const cleanNumber = number.replace(/^0+/, '');
    return `${code}${cleanNumber}`;
  }

  // Use request deduplication at service level
  const requestKey = `booking:${orderId}`;
  console.log(`[${orderId}] Deduplicating booking creation with key: ${requestKey}`);

  return await deduplicateRequest(requestKey, async () => {
  console.log(`\n===== [DB] START: CREATE BOOKING [${orderId}] (${new Date().toISOString()}) =====`);
  console.log(`[${orderId}] Received booking data:`, JSON.stringify(data, null, 2));
  // Sanity: dedupe selectedSeats and warn if passengers contain duplicates
  if (Array.isArray(data.selectedSeats)) {
    const uniqueSeats = Array.from(new Set(data.selectedSeats));
    if (uniqueSeats.length !== data.selectedSeats.length) {
      console.log(`[${orderId}] Warning: duplicate seat entries found in selectedSeats - deduplicating`);
      data.selectedSeats = uniqueSeats;
    }
  }
  if (Array.isArray(data.passengers)) {
    const seatSet = new Set<string>();
    const dupSeats: string[] = [];
    for (const p of data.passengers) {
      if (seatSet.has(p.seatNumber)) dupSeats.push(p.seatNumber);
      seatSet.add(p.seatNumber);
    }
    if (dupSeats.length) {
      console.log(`[${orderId}] Warning: duplicate passenger seat numbers in payload: ${dupSeats.join(', ')} - duplicates will be ignored when creating passengers`);
    }
  }
  
  const discountAmount = data.discountAmount || 0;

  // Join country code and number for main contact
  const userPhone = joinPhone(data.contactDetails?.mobileCountryCode, data.contactDetails?.mobile || data.userPhone);
  // Join for alternateMobile if present
  const alternateMobile = joinPhone(data.contactDetails?.alternateMobileCountryCode, data.contactDetails?.alternateMobile);
  // Join for emergency contact
  const emergencyContactPhone = joinPhone(data.emergencyContact?.phoneCountryCode, data.emergencyContact?.phone);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[${orderId}] Attempt ${attempt}/${maxRetries}`);
    
    try {
      const result = await prisma.$transaction(async (tx) => {
        console.log(`[${orderId}] Checking for existing booking...`);
        const existing = await tx.booking.findUnique({
          where: { orderId: data.orderId },
          include: { passengers: true }
        });
        
        if (existing) {
          const duration = Date.now() - startTime;
          console.log(`[${orderId}] Booking already exists - ID: ${existing.id}, Status: ${existing.paymentStatus}, Duration: ${duration}ms`);
          
          // If booking exists but payment is pending, return it for retry
          if (existing.paymentStatus === 'pending') {
            console.log(`[${orderId}] Found existing pending booking - allowing payment retry`);
            return existing;
          }
          
          // If booking exists and is paid, prevent duplicate
          if (existing.paymentStatus === 'paid') {
            console.log(`[${orderId}] Found existing paid booking - preventing duplicate`);
            throw new Error('BOOKING_ALREADY_PAID');
          }
          
          return existing;
        }

        console.log(`[${orderId}] No existing booking found. Creating new booking...`);
        // If a reservation token is provided, validate and reserve consumption inside this transaction
        let reservationLinkRecord: any = null;
        if (data.reservationToken) {
          console.log(`[${orderId}] Reservation token provided - validating token`);
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
          // Ensure the token belongs to the same trip
          if (reservationLinkRecord.tripReservation.tripId !== data.tripId) {
            throw new Error('RESERVATION_TOKEN_TRIP_MISMATCH');
          }

          // Validate selected seats are reserved (allow subset)
          const reservedSeatNumbers = (reservationLinkRecord.tripReservation.seatReservations || []).map((s: any) => s.seatNumber);
          if (Array.isArray(data.selectedSeats) && data.selectedSeats.length > 0) {
            const missing = data.selectedSeats.filter((s: string) => !reservedSeatNumbers.includes(s));
            if (missing.length > 0) {
              const err: any = new Error('SELECTED_SEATS_NOT_RESERVED');
              err.detail = { missingSeats: missing };
              throw err;
            }
          }
          // If prepaid, make booking paid immediately
          if (reservationLinkRecord.prepaid) {
            data.paymentStatus = 'paid';
            data.paymentMode = data.paymentMode || 'Prepaid Link';
          }
        }
        // Validate consultantId before using
        let validConsultantId = null;
        if (data.consultantId && typeof data.consultantId === 'string' && data.consultantId.length > 0) {
          const consultantExists = await tx.consultant.findUnique({ where: { id: data.consultantId } });
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
            seats: JSON.stringify(data.selectedSeats),
            seatCount: data.passengers.length,
            totalPrice: data.totalPrice,
            boardingPoint: data.boardingPoint,
            droppingPoint: data.droppingPoint,
            orderId: data.orderId,
            paymentStatus: 'pending',
            bookingStatus: 'confirmed',
            paymentMode: data.paymentMode || 'Credit Card',
            returnTripId: data.returnTripId || null,
            returnBoardingPoint: data.returnBoardingPoint || null,
            returnDroppingPoint: data.returnDroppingPoint || null,
            returnSeats: data.returnSeats?.length ? JSON.stringify(data.returnSeats) : null,
            promoCode: data.promoCode || null,
            discountAmount: discountAmount,
            emergencyContactName: data.emergencyContact?.name || "",
            emergencyContactPhone: emergencyContactPhone,
            addons: data.addons || null,
            agentId: data.agentId || null,
            consultantId: validConsultantId,
            contactIdNumber: data.contactDetails?.idNumber || "",
          },
        });

        console.log(`Booking created: ${created.id}`);

        if (data.passengers?.length) {
          console.log(`Creating ${data.passengers.length} passengers...`);
          // Filter duplicates by seatNumber within the same trip to avoid P2002
          const uniqueBySeat: Record<string, any> = {};
          for (const p of data.passengers) {
            const key = `${created.tripId}::${p.seatNumber}`;
            if (!uniqueBySeat[key]) {
              uniqueBySeat[key] = p;
            } else {
              console.log(`[${orderId}] Duplicate passenger for seat ${p.seatNumber} ignored`);
            }
          }
          const passengerArray = Object.values(uniqueBySeat);
          if (passengerArray.length) {
            await tx.passenger.createMany({
              data: passengerArray.map((p: any) => ({
                bookingId: created.id,
                tripId: created.tripId,
                firstName: p.firstName,
                lastName: p.lastName,
                seatNumber: p.seatNumber,
                title: p.title,
                isReturn: p.isReturn,
                hasInfant: p.hasInfant ?? false,
                infantBirthdate: p.infantBirthdate ?? null,
                infantName: p.infantName ?? null,
                infantPassportNumber: p.infantPassportNumber ?? null,
                birthdate: p.birthdate ?? null,
                passportNumber: p.passportNumber ?? null,
                type: p.type ?? 'adult',
                phone: joinPhone(p.phoneCountryCode, p.phone) || null,
                nextOfKinName: p.nextOfKinName || null,
                nextOfKinPhone: joinPhone(p.nextOfKinPhoneCountryCode, p.nextOfKinPhone) || null,
              })),
            });
            console.log("Passengers created successfully");
          }
        }

        if (data.departureSeats?.length) {
          console.log("Updating departure trip seats...");
          const existingTrip = await tx.trip.findUnique({ where: { id: data.tripId } });
          await tx.trip.update({
            where: { id: data.tripId },
            data: {
              occupiedSeats: JSON.stringify([
                ...(JSON.parse(existingTrip?.occupiedSeats || "[]")),
                ...data.departureSeats
              ])
            }
          });
        }

        if (data.returnSeats?.length && data.returnTripId) {
          console.log("Updating return trip seats...");
          const returnTrip = await tx.trip.findUnique({ where: { id: data.returnTripId } });
          await tx.trip.update({
            where: { id: data.returnTripId },
            data: {
              occupiedSeats: JSON.stringify([
                ...(JSON.parse(returnTrip?.occupiedSeats || "[]")),
                ...data.returnSeats
              ])
            }
          });
        }

        const fullBooking = await tx.booking.findUnique({
          where: { orderId: data.orderId },
          include: { passengers: true },
        });

        // If a reservation token was used, consume it and mark the TripReservation as converted
        if (reservationLinkRecord) {
          console.log(`[${orderId}] Consuming reservation token and cleaning up seat reservations`);
          await tx.reservationLink.update({
            where: { id: reservationLinkRecord.id },
            data: { used: true }
          });

          await tx.tripReservation.update({
            where: { id: reservationLinkRecord.tripReservationId },
            data: { status: 'converted' }
          });

          // Remove seat reservations that were converted
          const seatIds = (reservationLinkRecord.tripReservation.seatReservations || []).map((s: any) => s.id);
          if (seatIds.length) {
            await tx.seatReservation.deleteMany({ where: { id: { in: seatIds } } });
          }
        }

        const duration = Date.now() - startTime;
        console.log(`[${orderId}] Booking created successfully - ID: ${fullBooking?.id}, Duration: ${duration}ms`);
        console.log(`[${orderId}] Full booking data:`, JSON.stringify(fullBooking, null, 2));
        return fullBooking;
      }, {
        maxWait: 10000,
        timeout: 20000,
        isolationLevel: 'ReadCommitted',
      });

      const duration = Date.now() - startTime;
      console.log(`[${orderId}] ===== [DB] END: CREATE BOOKING SUCCESS (${duration}ms) =====\n`);
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`[${orderId}] Attempt ${attempt} failed after ${duration}ms:`, error);
      
      // Handle specific error cases
      if (error.message === 'BOOKING_ALREADY_PAID') {
        console.error(`[${orderId}] Booking already exists and is paid - preventing duplicate`);
        throw new Error('This booking has already been processed and paid for.');
      }
      
      // Handle retryable errors
      if ((error.code === 'P2028' || error.code === 'P1002') && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff with 10s max
        console.log(`[${orderId}] Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      
      console.error(`[${orderId}] ===== [DB] END: CREATE BOOKING FAILED (${duration}ms) =====\n`);
      
      // Throw a user-friendly or structured error
      if (error.code === 'P2002') {
        // Unique constraint failed - provide structured error so callers can respond appropriately
        const err: any = new Error('UniqueConstraint');
        err.type = 'UniqueConstraint';
        err.detail = error.meta || {};
        throw err;
      } else {
        const err: any = new Error('CreateBookingFailed');
        err.type = 'CreateBookingFailed';
        throw err;
      }
    }
  }
  });
}