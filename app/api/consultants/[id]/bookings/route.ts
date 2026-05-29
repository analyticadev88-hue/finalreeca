import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // Await params!
  const bookings = await prisma.booking.findMany({
    where: { consultantId: id },
    select: {
      id: true,
      orderId: true,
      userName: true,
      userEmail: true,
      seatCount: true,
      totalPrice: true,
      passengers: {
        select: {
          id: true,
          isReturn: true,
        }
      },
      trip: {
        select: {
          routeName: true,
          departureDate: true,
          departureTime: true,
        }
      }
    }
  });
  const formattedBookings = bookings.map((b) => ({
    ...b,
    passengerCount: b.passengers?.filter((p) => !p.isReturn).length || 0,
  }));

  return NextResponse.json({ bookings: formattedBookings });
}