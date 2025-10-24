import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { infant, child } = await req.json();
  if (typeof infant === "number") {
    await prisma.fareSetting.upsert({
      where: { type: "infant" },
      update: { price: infant },
      create: { type: "infant", price: infant },
    });
  }
  if (typeof child === "number") {
    await prisma.fareSetting.upsert({
      where: { type: "child" },
      update: { price: child },
      create: { type: "child", price: child },
    });
  }
  return NextResponse.json({ success: true });
}