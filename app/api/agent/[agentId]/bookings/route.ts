import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params; // Await params!
  console.log("[API] Fetching bookings for agentId:", agentId);

  const bookings = await prisma.booking.findMany({
    where: { agentId },
    select: {
      id: true,
      orderId: true,
      userName: true,
      userEmail: true,
      seatCount: true,
      totalPrice: true,
      trip: {
        select: {
          routeName: true,
          departureDate: true,
          departureTime: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`[API] Found ${bookings.length} bookings for agentId: ${agentId}`);
  if (bookings.length > 0) {
    console.log("[API] First booking sample:", bookings[0]);
  }

  return NextResponse.json({ bookings });
}