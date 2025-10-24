import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const { params } = await context; // <-- Await context
  await prisma.consultant.update({
    where: { id: params.id },
    data: { approved: true }
  });
  return NextResponse.json({ success: true });
}