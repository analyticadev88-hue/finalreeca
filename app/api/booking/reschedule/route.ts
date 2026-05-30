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

function toISODateString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
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

    // Idempotency guard: if this booking is already on the target trips, no-op
    const currentTrip = booking.trip;
    const currentReturnTrip = booking.returnTrip;
    const sameDeparture = !newDepartureDate || !newDepartureTime || (
      currentTrip &&
      toISODateString(currentTrip.departureDate) === newDepartureDate &&
      currentTrip.departureTime === newDepartureTime
    );
    const sameReturn = !booking.returnTripId || !newReturnDate || !newReturnTime || (
      currentReturnTrip &&
      toISODateString(currentReturnTrip.departureDate) === newReturnDate &&
      currentReturnTrip.departureTime === newReturnTime
    );
    if (sameDeparture && sameReturn) {
      return NextResponse.json({ success: true, booking, message: 'Booking already on the requested date/time' });
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

        // Check if a matching trip already exists before creating
        const existingNewTrip = await tx.trip.findFirst({
          where: {
            routeOrigin: newRouteOrigin || oldTrip.routeOrigin,
            routeDestination: newRouteDestination || oldTrip.routeDestination,
            departureDate: new Date(newDepartureDate),
            departureTime: newDepartureTime,
            serviceType: oldTrip.serviceType,
          }
        });

        let newTrip;
        if (existingNewTrip) {
          newTrip = existingNewTrip;
          // Merge seats into existing trip
          const existingOccupied = parseSeats(existingNewTrip.occupiedSeats || '[]');
          const mergedOccupied = Array.from(new Set([...existingOccupied, ...departureSeats]));
          await tx.trip.update({
            where: { id: existingNewTrip.id },
            data: {
              occupiedSeats: JSON.stringify(mergedOccupied),
              availableSeats: existingNewTrip.totalSeats - mergedOccupied.length - (existingNewTrip.tempLockedSeats ? existingNewTrip.tempLockedSeats.split(',').filter(Boolean).length : 0),
            }
          });
        } else {
          newTrip = await tx.trip.create({
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
        }
        newTripId = newTrip.id;

        // Remove this booking's seats from the old trip (or its parent)
        const oldSeatSourceId = oldTrip.parentTripId || oldTrip.id;
        const oldSeatSource = await tx.trip.findUnique({ where: { id: oldSeatSourceId } });
        const oldOccupied = parseSeats(oldSeatSource?.occupiedSeats || '[]');
        const updatedOldOccupied = oldOccupied.filter((s) => !departureSeats.includes(s));
        await tx.trip.update({
          where: { id: oldSeatSourceId },
          data: {
            occupiedSeats: JSON.stringify(updatedOldOccupied),
            availableSeats:
              (oldSeatSource?.totalSeats || oldTrip.totalSeats) -
              updatedOldOccupied.length -
              (oldSeatSource?.tempLockedSeats ? oldSeatSource.tempLockedSeats.split(",").filter(Boolean).length : 0),
          },
        });
      }

      // --- Handle return trip reschedule ---
      if (booking.returnTripId && newReturnDate && newReturnTime) {
        const oldReturnTrip = await tx.trip.findUnique({ where: { id: booking.returnTripId } });
        if (!oldReturnTrip) throw new Error("Original return trip not found");

        // Check if a matching return trip already exists before creating
        const existingNewReturnTrip = await tx.trip.findFirst({
          where: {
            routeOrigin: newRouteOrigin || oldReturnTrip.routeOrigin,
            routeDestination: newRouteDestination || oldReturnTrip.routeDestination,
            departureDate: new Date(newReturnDate),
            departureTime: newReturnTime,
            serviceType: oldReturnTrip.serviceType,
          }
        });

        let newReturnTrip;
        if (existingNewReturnTrip) {
          newReturnTrip = existingNewReturnTrip;
          // Merge seats into existing trip
          const existingOccupied = parseSeats(existingNewReturnTrip.occupiedSeats || '[]');
          const mergedOccupied = Array.from(new Set([...existingOccupied, ...returnSeats]));
          await tx.trip.update({
            where: { id: existingNewReturnTrip.id },
            data: {
              occupiedSeats: JSON.stringify(mergedOccupied),
              availableSeats: existingNewReturnTrip.totalSeats - mergedOccupied.length - (existingNewReturnTrip.tempLockedSeats ? existingNewReturnTrip.tempLockedSeats.split(',').filter(Boolean).length : 0),
            }
          });
        } else {
          newReturnTrip = await tx.trip.create({
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
        }
        newReturnTripId = newReturnTrip.id;

        const oldReturnSeatSourceId = oldReturnTrip.parentTripId || oldReturnTrip.id;
        const oldReturnSeatSource = await tx.trip.findUnique({ where: { id: oldReturnSeatSourceId } });
        const oldOccupied = parseSeats(oldReturnSeatSource?.occupiedSeats || '[]');
        const updatedOldOccupied = oldOccupied.filter((s) => !returnSeats.includes(s));
        await tx.trip.update({
          where: { id: oldReturnSeatSourceId },
          data: {
            occupiedSeats: JSON.stringify(updatedOldOccupied),
            availableSeats:
              (oldReturnSeatSource?.totalSeats || oldReturnTrip.totalSeats) -
              updatedOldOccupied.length -
              (oldReturnSeatSource?.tempLockedSeats ? oldReturnSeatSource.tempLockedSeats.split(",").filter(Boolean).length : 0),
          },
        });
      }

      // --- Update booking to point to new trips ---
      const bookingUpdateData: any = {
        tripId: newTripId,
        returnTripId: newReturnTripId,
        bookingStatus: "confirmed",
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