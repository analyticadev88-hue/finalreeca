import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ promotions });
}

export async function POST(req: Request) {
  const { title, description } = await req.json();
  const promotion = await prisma.promotion.create({ data: { title, description } });
  return NextResponse.json({ promotion });
}