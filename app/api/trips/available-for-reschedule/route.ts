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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const routeOrigin = searchParams.get("routeOrigin");
    const routeDestination = searchParams.get("routeDestination");
    const date = searchParams.get("date");
    const currentSeats = searchParams.get("currentSeats"); // comma-separated seat numbers
    const excludeTripId = searchParams.get("excludeTripId"); // current trip to exclude

    if (!routeOrigin || !routeDestination || !date) {
      return NextResponse.json(
        { error: "routeOrigin, routeDestination, and date are required" },
        { status: 400 }
      );
    }

    const startDate = new Date(date + "T00:00:00.000Z");
    const endDate = new Date(date + "T23:59:59.999Z");

    const trips = await prisma.trip.findMany({
      where: {
        routeOrigin,
        routeDestination,
        departureDate: { gte: startDate, lte: endDate },
        ...(excludeTripId ? { id: { not: excludeTripId } } : {}),
      },
      orderBy: { departureTime: "asc" },
    });

    const requestedSeats = currentSeats
      ? currentSeats.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const tripsWithAvailability = trips.map((trip) => {
      const occupied = parseSeats(trip.occupiedSeats);
      const tempLocked = trip.tempLockedSeats
        ? trip.tempLockedSeats.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const blocked = Array.from(new Set([...occupied, ...tempLocked]));
      const availableCount = trip.totalSeats - blocked.length;

      // Check if all currently selected seats are available on this trip
      const seatConflicts = requestedSeats.filter((seat) => blocked.includes(seat));
      const allSeatsAvailable = requestedSeats.length > 0 && seatConflicts.length === 0;

      return {
        id: trip.id,
        routeName: trip.routeName,
        routeOrigin: trip.routeOrigin,
        routeDestination: trip.routeDestination,
        departureDate: trip.departureDate.toISOString(),
        departureTime: trip.departureTime,
        serviceType: trip.serviceType,
        totalSeats: trip.totalSeats,
        availableSeats: availableCount,
        occupiedSeats: occupied,
        tempLockedSeats: tempLocked,
        fare: trip.fare,
        boardingPoint: trip.boardingPoint,
        droppingPoint: trip.droppingPoint,
        allSeatsAvailable,
        seatConflicts,
      };
    });

    return NextResponse.json({ trips: tripsWithAvailability });
  } catch (err: any) {
    console.error("[AvailableForReschedule] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
