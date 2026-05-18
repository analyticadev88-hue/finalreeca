import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        organization: true,
        mobile: true,
        idNumber: true,
        approved: true,
        suspended: true,
        suspensionDate: true,
        commissionRate: true,
        allowedPaymentMethods: true,
        createdAt: true
      }
    });
    return NextResponse.json({ agents });
  } catch (error: any) {
    console.error("Failed to fetch agents:", error);
    return NextResponse.json({ error: error.message || "Failed to load agents" }, { status: 500 });
  }
}