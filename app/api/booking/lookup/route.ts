import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { bookingRef, contactIdNumber, email } = await req.json();
    const cleanBookingRef = bookingRef.trim();
    const cleanContactIdNumber = contactIdNumber.trim();
    const cleanEmail = email ? email.trim() : undefined;

    console.log("LOOKUP", { cleanBookingRef, cleanContactIdNumber, cleanEmail });

    const booking = await prisma.booking.findFirst({
      where: {
        orderId: cleanBookingRef,
        contactIdNumber: cleanContactIdNumber,
        ...(cleanEmail ? { userEmail: cleanEmail } : {})
      },
      include: {
        passengers: true,
        trip: true,
        returnTrip: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found or not authorized" }, { status: 403 });
    }

    // Check if departure is more than 24 hours away
    const departureDate = new Date(booking.trip.departureDate);
    const now = new Date();
    const canEdit = departureDate.getTime() - now.getTime() > 24 * 60 * 60 * 1000;

    return NextResponse.json({ ...booking, canEdit });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
