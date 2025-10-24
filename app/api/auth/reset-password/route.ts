import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "topo123";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  }
  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  }
  const { id, userType } = payload;
  const hashed = bcrypt.hashSync(password, 10);
  if (userType === "agent") {
    await prisma.agent.update({ where: { id }, data: { password: hashed } });
  } else if (userType === "consultant") {
    await prisma.consultant.update({ where: { id }, data: { password: hashed } });
  } else {
    return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
