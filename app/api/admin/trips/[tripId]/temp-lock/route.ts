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

    const tempLockedSeats = seats.join(",");

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: { tempLockedSeats },
    });

    return NextResponse.json({ success: true, tempLockedSeats: updatedTrip.tempLockedSeats });
  } catch (error) {
    console.error("Error updating temp lock:", error);
    return NextResponse.json({ error: "Failed to update temp lock" }, { status: 500 });
  }
}
