import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.agent.update({
    where: { id: params.id },
    data: { approved: true }
  });
  return NextResponse.json({ success: true });
}