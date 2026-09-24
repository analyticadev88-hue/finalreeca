import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertSeatsFree } from "@/lib/tripParent";

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

export async function POST(req: NextRequest) {
  try {
    const {
      orderId,
      newTripId,
      newReturnTripId,
      newDepartureSeats,
      newReturnSeats,
      newTotalPrice,
      newRouteDestination,
    } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

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

    // No-op if nothing changed
    if (newTripId === booking.tripId && newReturnTripId === booking.returnTripId) {
      return NextResponse.json({ success: true, booking, message: "No changes requested" });
    }

    const currentDepartureSeats = parseSeats(booking.seats);
    const currentReturnSeats = parseSeats(booking.returnSeats);
    const outboundPassengerCount = booking.passengers.filter((p) => !p.isReturn).length;
    const returnPassengerCount = booking.passengers.filter((p) => p.isReturn).length;

    // Validate seat counts match passenger counts
    if (newTripId && newTripId !== booking.tripId) {
      if (!Array.isArray(newDepartureSeats) || newDepartureSeats.length === 0) {
        return NextResponse.json({ error: "Please select seats for the new departure trip" }, { status: 400 });
      }
      if (newDepartureSeats.length !== outboundPassengerCount) {
        return NextResponse.json({
          error: `You selected ${newDepartureSeats.length} seats but need ${outboundPassengerCount} for the departure trip`
        }, { status: 400 });
      }
    }

    if (newReturnTripId && newReturnTripId !== booking.returnTripId) {
      if (!Array.isArray(newReturnSeats) || newReturnSeats.length === 0) {
        return NextResponse.json({ error: "Please select seats for the new return trip" }, { status: 400 });
      }
      if (newReturnSeats.length !== returnPassengerCount) {
        return NextResponse.json({
          error: `You selected ${newReturnSeats.length} seats but need ${returnPassengerCount} for the return trip`
        }, { status: 400 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      let finalTripId = booking.tripId;
      let finalReturnTripId = booking.returnTripId;

      // --- Handle departure trip reschedule ---
      if (newTripId && newTripId !== booking.tripId) {
        const newTrip = await tx.trip.findUnique({ where: { id: newTripId } });
        if (!newTrip) throw new Error("Selected departure trip not found");

        // Validate admin-selected seats against the shared bus inventory
        // (seat source = parent trip when the new trip is a segment child)
        await assertSeatsFree(tx, newTripId, newDepartureSeats);
        const newSeatSourceId = newTrip.parentTripId || newTrip.id;

        // Add new seats to the seat source
        const newSeatSource = await tx.trip.findUnique({ where: { id: newSeatSourceId } });
        const occupied = parseSeats(newSeatSource?.occupiedSeats || "[]");
        const tempLocked = newSeatSource?.tempLockedSeats
          ? newSeatSource.tempLockedSeats.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        const newOccupied = Array.from(new Set([...occupied, ...newDepartureSeats]));
        await tx.trip.update({
          where: { id: newSeatSourceId },
          data: {
            occupiedSeats: JSON.stringify(newOccupied),
            availableSeats: (newSeatSource?.totalSeats || newTrip.totalSeats) - newOccupied.length - tempLocked.length,
          },
        });

        // Remove old seats from old trip
        const oldTrip = await tx.trip.findUnique({ where: { id: booking.tripId } });
        if (oldTrip) {
          const oldSeatSourceId = oldTrip.parentTripId || oldTrip.id;
          const oldSeatSource = await tx.trip.findUnique({ where: { id: oldSeatSourceId } });
          const oldOccupied = parseSeats(oldSeatSource?.occupiedSeats || '[]');
          const updatedOldOccupied = oldOccupied.filter((s) => !currentDepartureSeats.includes(s));
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

        // Update passenger seat numbers to new selections
        const outboundPassengers = booking.passengers.filter((p) => !p.isReturn);
        for (let i = 0; i < outboundPassengers.length; i++) {
          await tx.passenger.update({
            where: { id: outboundPassengers[i].id },
            data: { seatNumber: newDepartureSeats[i], tripId: newTripId },
          });
        }
        // Update booking seats record
        await tx.booking.update({
          where: { id: booking.id },
          data: { seats: JSON.stringify(newDepartureSeats) },
        });

        finalTripId = newTripId;
      }

      // --- Handle return trip reschedule ---
      if (newReturnTripId && newReturnTripId !== booking.returnTripId) {
        const newReturnTrip = await tx.trip.findUnique({ where: { id: newReturnTripId } });
        if (!newReturnTrip) throw new Error("Selected return trip not found");

        // Validate against the shared bus inventory (seat source, not the child row)
        await assertSeatsFree(tx, newReturnTripId, newReturnSeats);
        const newReturnSeatSourceId = newReturnTrip.parentTripId || newReturnTrip.id;

        const newReturnSeatSource = await tx.trip.findUnique({ where: { id: newReturnSeatSourceId } });
        const occupied = parseSeats(newReturnSeatSource?.occupiedSeats || "[]");
        const tempLocked = newReturnSeatSource?.tempLockedSeats
          ? newReturnSeatSource.tempLockedSeats.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
        const newOccupied = Array.from(new Set([...occupied, ...newReturnSeats]));
        await tx.trip.update({
          where: { id: newReturnSeatSourceId },
          data: {
            occupiedSeats: JSON.stringify(newOccupied),
            availableSeats: (newReturnSeatSource?.totalSeats || newReturnTrip.totalSeats) - newOccupied.length - tempLocked.length,
          },
        });

        // Remove old seats from old return trip
        if (booking.returnTripId) {
          const oldReturnTrip = await tx.trip.findUnique({ where: { id: booking.returnTripId } });
          if (oldReturnTrip) {
            const oldSeatSourceId = oldReturnTrip.parentTripId || oldReturnTrip.id;
            const oldSeatSource = await tx.trip.findUnique({ where: { id: oldSeatSourceId } });
            const oldOccupied = parseSeats(oldSeatSource?.occupiedSeats || '[]');
            const updatedOldOccupied = oldOccupied.filter((s) => !currentReturnSeats.includes(s));
            await tx.trip.update({
              where: { id: oldSeatSourceId },
              data: {
                occupiedSeats: JSON.stringify(updatedOldOccupied),
                availableSeats:
                  (oldSeatSource?.totalSeats || oldReturnTrip.totalSeats) -
                  updatedOldOccupied.length -
                  (oldSeatSource?.tempLockedSeats ? oldSeatSource.tempLockedSeats.split(",").filter(Boolean).length : 0),
              },
            });
          }
        }

        // Update passenger seat numbers to new selections
        const returnPassengers = booking.passengers.filter((p) => p.isReturn);
        for (let i = 0; i < returnPassengers.length; i++) {
          await tx.passenger.update({
            where: { id: returnPassengers[i].id },
            data: { seatNumber: newReturnSeats[i], tripId: newReturnTripId },
          });
        }
        // Update booking return seats record
        await tx.booking.update({
          where: { id: booking.id },
          data: { returnSeats: JSON.stringify(newReturnSeats) },
        });

        finalReturnTripId = newReturnTripId;
      }

      // --- Update booking to point to new trips ---
      const bookingUpdateData: any = {
        tripId: finalTripId,
        returnTripId: finalReturnTripId,
        bookingStatus: "confirmed",
      };
      if (newTotalPrice !== undefined) {
        bookingUpdateData.totalPrice = Number(newTotalPrice);
      }

      // Update boarding/dropping points when destination changes
      if (newTripId && newTripId !== booking.tripId) {
        const newTrip = await tx.trip.findUnique({ where: { id: finalTripId } });
        if (newTrip) {
          bookingUpdateData.boardingPoint = newTrip.routeOrigin;
          bookingUpdateData.droppingPoint = newRouteDestination || newTrip.routeDestination;
        }
      }
      if (newReturnTripId && newReturnTripId !== booking.returnTripId) {
        const newReturnTrip = await tx.trip.findUnique({ where: { id: finalReturnTripId } });
        if (newReturnTrip) {
          bookingUpdateData.returnBoardingPoint = newReturnTrip.routeOrigin;
          bookingUpdateData.returnDroppingPoint = newReturnTrip.routeDestination;
        }
      }

      const updatedBooking = await tx.booking.update({
        where: { orderId },
        data: bookingUpdateData,
        include: { passengers: true, trip: true, returnTrip: true },
      });

      return updatedBooking;
    });

    return NextResponse.json({ success: true, booking: result });
  } catch (err: any) {
    console.error("[Reschedule] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
