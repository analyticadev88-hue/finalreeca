import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, context: { params: { busId: string } }) {
  // Await params as required by Next.js App Router
  const params = await context.params;
  const busId = params.busId;

  const bookings = await prisma.booking.findMany({
    where: { tripId: busId },
    include: { agent: true, passengers: true, trip: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ bookings });
}