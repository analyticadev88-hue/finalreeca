import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { passengerId } = await req.json();

  if (!passengerId) {
    return NextResponse.json({ success: false, error: "Missing passengerId" }, { status: 400 });
  }

  const passenger = await prisma.passenger.update({
    where: { id: passengerId },
    data: { boarded: true },
  });

  return NextResponse.json({ success: true, passenger });
}