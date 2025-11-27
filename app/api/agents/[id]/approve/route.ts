import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/adminAuth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Verify admin authentication
  const auth = await verifyAdminAuth();
  if (!auth.authorized) {
    return auth.response;
  }

  await prisma.agent.update({
    where: { id: params.id },
    data: { approved: true }
  });
  return NextResponse.json({ success: true });
}