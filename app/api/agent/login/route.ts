import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authProtection, handleArcjetDecision, logArcjetDecision } from "@/lib/arcjet";

const JWT_SECRET = process.env.JWT_SECRET || "topo123";

if (process.env.NODE_ENV === "production" && JWT_SECRET === "topo123") {
  throw new Error("CRITICAL SECURITY RISK: Change JWT_SECRET in production!");
}

export async function POST(req: NextRequest) {
  // Arcjet protection: bot detection + rate limiting
  const decision = await authProtection.protect(req, { requested: 1 });
  logArcjetDecision(decision, "/api/agent/login");

  const arcjetResult = handleArcjetDecision(decision);
  if (arcjetResult.denied) {
    return NextResponse.json(
      { error: arcjetResult.message },
      { status: arcjetResult.status }
    );
  }

  const { email, password } = await req.json();
  const agent = await prisma.agent.findUnique({ where: { email } });
  if (!agent || !agent.approved) {
    return NextResponse.json({ error: "Agent not approved" }, { status: 403 });
  }
  if (!bcrypt.compareSync(password, agent.password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  // Create JWT token
  const token = jwt.sign({ id: agent.id }, JWT_SECRET, { expiresIn: "7d" });

  // Set JWT as httpOnly cookie
  const response = NextResponse.json({
    success: true,
    id: agent.id,
    name: agent.name,
    email: agent.email,
  });
  response.cookies.set("agent_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}