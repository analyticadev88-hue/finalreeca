// app/api/booking/[orderId]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fix API route signature for Next.js App Router (await params)
export async function GET(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: "Missing order ID" },
      { status: 400 }
    );
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { orderId },
      include: {
        passengers: true,
        trip: true,
        returnTrip: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Map all passenger fields for the ticket
    const passengers = (booking.passengers || []).map((p: any) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      firstName: p.firstName,
      lastName: p.lastName,
      seat: p.seatNumber,
      title: p.title,
      type: p.type,
      isReturn: p.isReturn,
      hasInfant: !!p.hasInfant,
      infantName: p.infantName || "",
      infantBirthdate: p.infantBirthdate || "",
      infantPassportNumber: p.infantPassportNumber || "",
      birthdate: p.birthdate || "",
      passportNumber: p.passportNumber || "",
      phone: p.phone,
      nextOfKinName: p.nextOfKinName,
      nextOfKinPhone: p.nextOfKinPhone,
    }));

    // Parse seats
    const parseSeats = (seats: any): string[] => {
      if (!seats) return [];
      if (Array.isArray(seats)) return seats;
      if (typeof seats === "string") {
        try {
          return JSON.parse(seats);
        } catch {
          return seats.split(",").map((s: string) => s.trim());
        }
      }
      return [];
    };

    const departureSeats = parseSeats(booking.seats);
    const returnSeats = parseSeats(booking.returnSeats);

    // Build trips
    const departureTrip = {
      route: booking.trip?.routeName || "Unknown Route",
      date: booking.trip?.departureDate || new Date().toISOString(),
      time: booking.trip?.departureTime || "00:00",
      bus: booking.trip?.serviceType || "Standard Bus",
      boardingPoint: booking.boardingPoint,
      droppingPoint: booking.droppingPoint,
      seats: departureSeats,
      passengers: passengers.filter((p: any) => !p.isReturn)
    };

    const returnTrip = booking.returnTripId ? {
      route: booking.returnTrip?.routeName || "Unknown Route",
      date: booking.returnTrip?.departureDate || new Date().toISOString(),
      time: booking.returnTrip?.departureTime || "00:00",
      bus: booking.returnTrip?.serviceType || "Standard Bus",
      boardingPoint: booking.returnBoardingPoint,
      droppingPoint: booking.returnDroppingPoint,
      seats: returnSeats,
      passengers: passengers.filter((p: any) => p.isReturn)
    } : undefined;

    // Format add-ons as array for ticket
    const ADDON_MAP: Record<string, string> = {
      extraBaggage: "Extra Baggage (P300)",
      wimpyMeal1: "Wimpy Meal for 1 (P67)",
      wimpyMeal2: "Wimpy Meal for 2 (P137)",
      travelInsurance: "Travel Insurance (P450)",
    };

    const addonsArr: any[] = [];
    if (booking.addons && typeof booking.addons === 'object' && !Array.isArray(booking.addons)) {
      Object.entries(booking.addons).forEach(([key, selection]: [string, any]) => {
        if (selection.departure || selection.return) {
          const name = ADDON_MAP[key] || key;
          const detailsParts = [];
          if (selection.departure) {
            detailsParts.push(`Departure${selection.departurePref ? ` (${selection.departurePref})` : ""}`);
          }
          if (selection.return) {
            detailsParts.push(`Return${selection.returnPref ? ` (${selection.returnPref})` : ""}`);
          }
          const details = detailsParts.join(" & ");
          
          const priceMap: Record<string, string> = {
            extraBaggage: "P300",
            wimpyMeal1: "P67",
            wimpyMeal2: "P137",
            travelInsurance: "P450",
          };
          
          addonsArr.push({
            name,
            details: `Trip: ${details}`,
            price: priceMap[key] || "" 
          });
        }
      });
    } else if (Array.isArray(booking.addons)) {
      addonsArr.push(...booking.addons);
    }

    // Build response
    const responseData = {
      bookingRef: booking.orderId,
      userName: booking.userName,
      userEmail: booking.userEmail,
      userPhone: booking.userPhone,
      totalAmount: booking.totalPrice,
      paymentMethod: booking.paymentMode || "Credit Card",
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      contactDetails: {
        name: booking.userName,
        email: booking.userEmail,
        mobile: booking.userPhone,
        idType: "Passport",
        idNumber: booking.contactIdNumber || "-",
      },
      emergencyContact: {
        name: booking.emergencyContactName || "-",
        phone: booking.emergencyContactPhone || "-",
      },
      addons: addonsArr,
      passengers,
      departureTrip,
      returnTrip,
    };

    console.log("Final response data:", JSON.stringify(responseData, null, 2));
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Booking fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;
  const data = await request.json();

  if (!orderId) {
    return NextResponse.json({ success: false, error: "Missing order ID" }, { status: 400 });
  }

  try {
    const { contactDetails, emergencyContact, passengers, paymentStatus, paymentMethod } = data;

    // Update the booking details
    await prisma.booking.update({
      where: { orderId },
      data: {
        userName: contactDetails?.name,
        userEmail: contactDetails?.email,
        userPhone: contactDetails?.mobile,
        contactIdNumber: contactDetails?.idNumber,
        emergencyContactName: emergencyContact?.name,
        emergencyContactPhone: emergencyContact?.phone,
        paymentStatus: paymentStatus,
        paymentMode: paymentMethod,
        ...(paymentStatus?.toLowerCase() === 'paid' ? { bookingStatus: 'Confirmed' } : {}),
        ...(paymentStatus?.toLowerCase() === 'cancelled' ? { bookingStatus: 'Cancelled' } : {})
      },
    });

    // Update passengers if provided
    if (passengers && Array.isArray(passengers)) {
      // Fetch current booking to compare seats
      const currentBooking = await prisma.booking.findUnique({
        where: { orderId },
        include: { passengers: true }
      });

      if (!currentBooking) {
        return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
      }

      const tripId = currentBooking.tripId;
      const returnTripId = currentBooking.returnTripId;
      
      let departureSeatsChanged = false;
      let returnSeatsChanged = false;

      for (const p of passengers) {
        if (p.id) {
          const oldPassenger = currentBooking.passengers.find(cp => cp.id === p.id);
          const newSeat = p.seat || p.seatNumber;
          
          if (oldPassenger && newSeat && oldPassenger.seatNumber !== newSeat) {
            // Seat has changed!
            // 1. Verify availability (not occupied by someone ELSE)
            const conflict = await prisma.passenger.findFirst({
              where: {
                tripId: oldPassenger.tripId,
                seatNumber: newSeat,
                id: { not: p.id } // Not the same passenger
              }
            });

            if (conflict) {
              return NextResponse.json({ 
                success: false, 
                error: `Seat ${newSeat} is already occupied by another passenger.` 
              }, { status: 400 });
            }

            if (oldPassenger.isReturn) returnSeatsChanged = true;
            else departureSeatsChanged = true;
          }

          // Update passenger record
          await prisma.passenger.update({
            where: { id: p.id },
            data: {
              firstName: p.firstName,
              lastName: p.lastName,
              title: p.title,
              passportNumber: p.passportNumber,
              type: p.type,
              phone: p.phone,
              seatNumber: p.seat || p.seatNumber, // Update seat number
              nextOfKinName: p.nextOfKinName,
              nextOfKinPhone: p.nextOfKinPhone,
              hasInfant: p.hasInfant,
              infantName: p.infantName,
              infantBirthdate: p.infantBirthdate,
              infantPassportNumber: p.infantPassportNumber,
            },
          });
        }
      }

      // If seats changed, we MUST sync the Booking and Trip records
      if (departureSeatsChanged || returnSeatsChanged) {
        // Refetch all passengers for this booking to get updated seat numbers
        const updatedPassengers = await prisma.passenger.findMany({
          where: { bookingId: currentBooking.id }
        });

        // 1. Update Booking records
        const newDepSeats = updatedPassengers.filter(p => !p.isReturn).map(p => p.seatNumber);
        const newRetSeats = updatedPassengers.filter(p => p.isReturn).map(p => p.seatNumber);

        await prisma.booking.update({
          where: { orderId },
          data: {
            seats: JSON.stringify(newDepSeats),
            returnSeats: returnTripId ? JSON.stringify(newRetSeats) : null,
          }
        });

        // 2. Sync Trip Occupancy for Departure
        if (departureSeatsChanged) {
          await syncTripOccupancy(tripId);
        }

        // 3. Sync Trip Occupancy for Return
        if (returnSeatsChanged && returnTripId) {
          await syncTripOccupancy(returnTripId);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Booking updated successfully" });
  } catch (error: any) {
    console.error("Booking update error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * Utility to synchronize Trip.occupiedSeats and Trip.availableSeats
 * For child trips, syncs the parent trip's occupancy.
 */
async function syncTripOccupancy(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { parentTripId: true, totalSeats: true, tempLockedSeats: true }
  });

  if (!trip) return;

  const seatSourceId = trip.parentTripId || tripId;
  const seatSource = await prisma.trip.findUnique({
    where: { id: seatSourceId },
    select: { id: true, totalSeats: true, tempLockedSeats: true }
  });

  if (!seatSource) return;

  // Get all confirmed seats from passengers on the seat source trip AND any child trips
  const childTripIds = await prisma.trip.findMany({
    where: { parentTripId: seatSourceId },
    select: { id: true }
  });
  const relevantTripIds = [seatSourceId, ...childTripIds.map(c => c.id)];

  const allPassengers = await prisma.passenger.findMany({
    where: { 
      tripId: { in: relevantTripIds },
      booking: { bookingStatus: 'confirmed' }
    },
    select: { seatNumber: true }
  });

  const occupiedSeats = Array.from(new Set(allPassengers.map(p => p.seatNumber)));
  const tempLockedCount = seatSource.tempLockedSeats ? seatSource.tempLockedSeats.split(',').filter(Boolean).length : 0;
  const availableSeats = Math.max(0, seatSource.totalSeats - occupiedSeats.length - tempLockedCount);

  await prisma.trip.update({
    where: { id: seatSourceId },
    data: {
      occupiedSeats: JSON.stringify(occupiedSeats),
      availableSeats
    }
  });
}
