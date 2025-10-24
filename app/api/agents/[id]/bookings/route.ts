import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const bookings = await prisma.booking.findMany({
    where: { agentId: id },
    select: {
      id: true,
      orderId: true,
      userName: true,
      totalPrice: true,
      trip: {
        select: {
          routeName: true,
          departureDate: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ bookings });
}