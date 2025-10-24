import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const fares = await prisma.fareSetting.findMany();
  return NextResponse.json({
    infant: fares.find(f => f.type === "infant")?.price ?? 250,
    child: fares.find(f => f.type === "child")?.price ?? 400,
  });
}