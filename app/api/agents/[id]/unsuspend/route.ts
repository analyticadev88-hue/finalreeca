import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  // Verify admin authentication
  const auth = await verifyAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  const params = await context.params;
  try {
    await prisma.agent.update({
      where: { id: params.id },
      data: {
        suspended: false,
        suspensionDate: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to unsuspend agent" },
      { status: 500 }
    );
  }
}