import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.consultant.delete({
    where: { id: params.id }
  });
  return NextResponse.json({ success: true });
}