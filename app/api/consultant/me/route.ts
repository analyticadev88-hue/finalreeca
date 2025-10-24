import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "changeme-in-production";

export async function GET(req: NextRequest) {
  try {
    // 1. Get JWT from cookies
    const token = req.cookies.get("consultant_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // 2. Verify JWT and extract consultant ID
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const consultantId = payload?.id;
    if (!consultantId) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
    }

    // 3. Fetch consultant from DB
    const consultant = await prisma.consultant.findUnique({
      where: { id: consultantId },
      select: { id: true, name: true, email: true }
    });

    if (!consultant) {
      return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
    }

    return NextResponse.json(consultant);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}