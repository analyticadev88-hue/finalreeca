import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "Missing start or end date" }, { status: 400 });
  }

  const trips = await prisma.trip.findMany({
    where: {
      departureDate: {
        gte: new Date(start),
        lt: new Date(end),
      },
    },
    include: {
      bookings: {
        include: { passengers: true }
      }
    }
  });

  return NextResponse.json({ trips });
}