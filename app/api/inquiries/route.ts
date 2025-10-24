import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const inquiry = await prisma.inquiry.create({
    data: {
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone,
      passengers: Number(data.passengers),
      date: data.date,
      time: data.time,
      origin: data.origin,
      destination: data.destination,
      returnDate: data.returnDate, // <-- Add this line
      specialRequests: data.specialRequests,
      status: "pending",
      requestedAt: new Date(),
    },
  });
  return NextResponse.json({ success: true, inquiry });
}

export async function GET() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { requestedAt: "desc" },
  });
  return NextResponse.json({ inquiries });
}