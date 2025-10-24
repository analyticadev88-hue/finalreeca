import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params; // Await params!
  const { active } = await req.json();
  const promotion = await prisma.promotion.update({
    where: { id },
    data: { active },
  });
  return NextResponse.json({ promotion });
}