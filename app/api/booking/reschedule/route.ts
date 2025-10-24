import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const {
      orderId,
      newDepartureDate,
      newDepartureTime,
      newReturnDate,
      newReturnTime,
    } = await req.json();

    // Find booking
    const booking = await prisma.booking.findUnique({
      where: { orderId },
      include: { trip: true, returnTrip: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Update only date/time fields
    const updated = await prisma.booking.update({
      where: { orderId },
      data: {
        trip: {
          update: {
            departureDate: new Date(newDepartureDate),
            departureTime: newDepartureTime,
          },
        },
        ...(booking.returnTripId && newReturnDate && newReturnTime
          ? {
              returnTrip: {
                update: {
                  departureDate: new Date(newReturnDate),
                  departureTime: newReturnTime,
                },
              },
            }
          : {}),
        bookingStatus: "rescheduled",
      },
      include: { passengers: true, trip: true, returnTrip: true },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}