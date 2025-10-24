import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let policy = await prisma.policy.findFirst();
  if (!policy) {
    policy = await prisma.policy.create({ data: { content: "Default policy text." } });
  }
  return NextResponse.json({ content: policy.content });
}