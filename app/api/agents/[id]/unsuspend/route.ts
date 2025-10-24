import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
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