import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const consultants = await prisma.consultant.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      organization: true,
      mobile: true,
      idNumber: true,
      approved: true,
      suspended: true,
      createdAt: true
    }
  });
  return NextResponse.json({ consultants });
}