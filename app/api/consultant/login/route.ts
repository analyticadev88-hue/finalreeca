import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "topo123";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const consultant = await prisma.consultant.findUnique({ where: { email } });
  if (!consultant || !bcrypt.compareSync(password, consultant.password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Create JWT token
  const token = jwt.sign({ id: consultant.id }, JWT_SECRET, { expiresIn: "7d" });

  // Set JWT as httpOnly cookie
  const response = NextResponse.json({
    success: true,
    id: consultant.id,
    name: consultant.name,
    email: consultant.email,
  });
  response.cookies.set("consultant_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}