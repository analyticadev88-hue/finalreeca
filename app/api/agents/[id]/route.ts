import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { commissionRate, allowedPaymentMethods } = body;

    const dataToUpdate: any = {};

    if (commissionRate !== undefined && commissionRate !== null) {
      const rate = parseFloat(commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return NextResponse.json({ error: "Commission rate must be between 0 and 100" }, { status: 400 });
      }
      dataToUpdate.commissionRate = rate;
    }

    if (allowedPaymentMethods !== undefined && Array.isArray(allowedPaymentMethods)) {
      dataToUpdate.allowedPaymentMethods = allowedPaymentMethods;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const agent = await prisma.agent.update({
      where: { id },
      data: dataToUpdate,
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
        createdAt: true,
      },
    });

    return NextResponse.json({ agent });
  } catch (error: any) {
    console.error("Error updating agent:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}
