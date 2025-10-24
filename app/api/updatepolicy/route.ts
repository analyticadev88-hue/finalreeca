import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { content } = await req.json();
  let policy = await prisma.policy.findFirst();
  if (!policy) {
    policy = await prisma.policy.create({ data: { content } });
  } else {
    policy = await prisma.policy.update({ where: { id: policy.id }, data: { content } });
  }
  return NextResponse.json({ success: true, content: policy.content });
}