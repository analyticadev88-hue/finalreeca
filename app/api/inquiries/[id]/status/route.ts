import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { status } = await req.json();
  const inquiry = await prisma.inquiry.update({
    where: { id },
    data: { status },
  });
  return NextResponse.json({ success: true, inquiry });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await prisma.inquiry.delete({
    where: { id },
  });
  return NextResponse.json({ success: true });
}