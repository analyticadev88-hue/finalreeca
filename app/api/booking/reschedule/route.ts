import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseSeats(seatsStr: string | null): string[] {
  if (!seatsStr) return [];
  try {
    const parsed = JSON.parse(seatsStr);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fall through to comma-separated
  }
  return seatsStr.split(",").map((s) => s.trim()).filter(Boolean);
}

function cloneTripFields(trip: any) {
  return {
    serviceType: trip.serviceType,
    routeName: trip.routeName,
    routeOrigin: trip.routeOrigin,
    routeDestination: trip.routeDestination,
    totalSeats: trip.totalSeats,
    fare: trip.fare,
    durationMinutes: trip.durationMinutes,
    boardingPoint: trip.boardingPoint,
    droppingPoint: trip.droppingPoint,
    promoActive: trip.promoActive,
    hasDeparted: false,
    isChartered: trip.isChartered,
    charterCompany: trip.charterCompany,
    charterDates: trip.charterDates,
    charterTripId: trip.charterTripId,
    charterStartDate: trip.charterStartDate,
    charterEndDate: trip.charterEndDate,
    replacementVehicles: trip.replacementVehicles,
    vehicleCount: trip.vehicleCount,
    tempLockedSeats: trip.tempLockedSeats,
  };
}

export async function POST(req: NextRequest) {
  try {
    const {
      orderId,
      newDepartureDate,
      newDepartureTime,
      newReturnDate,
      newReturnTime,
      newRouteName,
      newRouteOrigin,
      newRouteDestination,
      newBoardingPoint,
      newDroppingPoint,
      newFare,
      newTotalPrice,
    } = await req.json();

    // Find booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { orderId },
      include: { trip: true, returnTrip: true, passengers: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.trip) {
      return NextResponse.json({ error: "Booking has no associated trip" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let newTripId = booking.tripId;
      let newReturnTripId = booking.returnTripId;

      const departureSeats = parseSeats(booking.seats);
      const returnSeats = parseSeats(booking.returnSeats);

      // --- Handle departure trip reschedule ---
      if (newDepartureDate && newDepartureTime) {
        const oldTrip = await tx.trip.findUnique({ where: { id: booking.tripId } });
        if (!oldTrip) throw new Error("Original departure trip not found");

        // Create new trip for this booking
        const newTrip = await tx.trip.create({
          data: {
            ...cloneTripFields(oldTrip),
            departureDate: new Date(newDepartureDate),
            departureTime: newDepartureTime,
            occupiedSeats: JSON.stringify(departureSeats),
            availableSeats:
              oldTrip.totalSeats -
              departureSeats.length -
              (oldTrip.tempLockedSeats ? oldTrip.tempLockedSeats.split(",").filter(Boolean).length : 0),
            ...(newRouteName ? { routeName: newRouteName } : {}),
            ...(newRouteOrigin ? { routeOrigin: newRouteOrigin } : {}),
            ...(newRouteDestination ? { routeDestination: newRouteDestination } : {}),
            ...(newBoardingPoint ? { boardingPoint: newBoardingPoint } : {}),
            ...(newDroppingPoint ? { droppingPoint: newDroppingPoint } : {}),
            ...(newFare !== undefined ? { fare: Number(newFare) } : {}),
          },
        });
        newTripId = newTrip.id;

        // Remove this booking's seats from the old trip
        const oldOccupied = parseSeats(oldTrip.occupiedSeats);
        const updatedOldOccupied = oldOccupied.filter((s) => !departureSeats.includes(s));
        await tx.trip.update({
          where: { id: oldTrip.id },
          data: {
            occupiedSeats: JSON.stringify(updatedOldOccupied),
            availableSeats:
              oldTrip.totalSeats -
              updatedOldOccupied.length -
              (oldTrip.tempLockedSeats ? oldTrip.tempLockedSeats.split(",").filter(Boolean).length : 0),
          },
        });
      }

      // --- Handle return trip reschedule ---
      if (booking.returnTripId && newReturnDate && newReturnTime) {
        const oldReturnTrip = await tx.trip.findUnique({ where: { id: booking.returnTripId } });
        if (!oldReturnTrip) throw new Error("Original return trip not found");

        const newReturnTrip = await tx.trip.create({
          data: {
            ...cloneTripFields(oldReturnTrip),
            departureDate: new Date(newReturnDate),
            departureTime: newReturnTime,
            occupiedSeats: JSON.stringify(returnSeats),
            availableSeats:
              oldReturnTrip.totalSeats -
              returnSeats.length -
              (oldReturnTrip.tempLockedSeats ? oldReturnTrip.tempLockedSeats.split(",").filter(Boolean).length : 0),
            ...(newRouteName ? { routeName: newRouteName } : {}),
            ...(newRouteOrigin ? { routeOrigin: newRouteOrigin } : {}),
            ...(newRouteDestination ? { routeDestination: newRouteDestination } : {}),
            ...(newBoardingPoint ? { boardingPoint: newBoardingPoint } : {}),
            ...(newDroppingPoint ? { droppingPoint: newDroppingPoint } : {}),
            ...(newFare !== undefined ? { fare: Number(newFare) } : {}),
          },
        });
        newReturnTripId = newReturnTrip.id;

        const oldOccupied = parseSeats(oldReturnTrip.occupiedSeats);
        const updatedOldOccupied = oldOccupied.filter((s) => !returnSeats.includes(s));
        await tx.trip.update({
          where: { id: oldReturnTrip.id },
          data: {
            occupiedSeats: JSON.stringify(updatedOldOccupied),
            availableSeats:
              oldReturnTrip.totalSeats -
              updatedOldOccupied.length -
              (oldReturnTrip.tempLockedSeats ? oldReturnTrip.tempLockedSeats.split(",").filter(Boolean).length : 0),
          },
        });
      }

      // --- Update booking to point to new trips ---
      const bookingUpdateData: any = {
        tripId: newTripId,
        returnTripId: newReturnTripId,
        bookingStatus: "rescheduled",
      };
      if (newTotalPrice !== undefined) {
        bookingUpdateData.totalPrice = Number(newTotalPrice);
      }
      if (newBoardingPoint !== undefined) {
        bookingUpdateData.boardingPoint = newBoardingPoint;
      }
      if (newDroppingPoint !== undefined) {
        bookingUpdateData.droppingPoint = newDroppingPoint;
      }

      const updatedBooking = await tx.booking.update({
        where: { orderId },
        data: bookingUpdateData,
        include: { passengers: true, trip: true, returnTrip: true },
      });

      // --- Update passengers to point to new trips ---
      if (newTripId !== booking.tripId) {
        await tx.passenger.updateMany({
          where: { bookingId: booking.id, isReturn: false },
          data: { tripId: newTripId },
        });
      }
      if (newReturnTripId && newReturnTripId !== booking.returnTripId) {
        await tx.passenger.updateMany({
          where: { bookingId: booking.id, isReturn: true },
          data: { tripId: newReturnTripId },
        });
      }

      return updatedBooking;
    });

    return NextResponse.json({ success: true, booking: result });
  } catch (err: any) {
    console.error("[Reschedule] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}