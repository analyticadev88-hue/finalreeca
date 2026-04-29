import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const { seats } = await request.json(); // Array of seat numbers
    const tripId = params.tripId;

    if (!Array.isArray(seats)) {
      return NextResponse.json({ error: "Seats must be an array" }, { status: 400 });
    }

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const tempLockedSeats = seats.join(",");
    
    // Recalculate available seats: totalSeats - bookedSeats - lockedSeats
    const bookedSeats = trip.occupiedSeats ? JSON.parse(trip.occupiedSeats).length : 0;
    const lockedSeatsCount = seats.length;
    const newAvailableSeats = Math.max(0, trip.totalSeats - bookedSeats - lockedSeatsCount);

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { 
        tempLockedSeats,
        availableSeats: newAvailableSeats
      },
    });

    return NextResponse.json({ 
      success: true, 
      tempLockedSeats: updatedTrip.tempLockedSeats,
      availableSeats: updatedTrip.availableSeats
    });
  } catch (error) {
    console.error("Error updating temp lock:", error);
    return NextResponse.json({ error: "Failed to update temp lock" }, { status: 500 });
  }
}
