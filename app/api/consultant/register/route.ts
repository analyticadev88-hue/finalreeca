import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { name, email, password, organization, mobile, idNumber } = await req.json();
  if (!name || !email || !password || !organization || !mobile || !idNumber) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  const existing = await prisma.consultant.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Consultant with this email already exists" }, { status: 400 });
  }
  const hashed = bcrypt.hashSync(password, 10);
  await prisma.consultant.create({
    data: { name, email, password: hashed, organization, mobile, idNumber },
  });
  return NextResponse.json({ success: true });
}