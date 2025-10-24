import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "topo123";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("agent_token")?.value;
  if (!token) return NextResponse.json({}, { status: 401 });

  let payload: any;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({}, { status: 401 });
  }

  const agentId = payload?.id;
  if (!agentId) return NextResponse.json({}, { status: 401 });

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return NextResponse.json({}, { status: 401 });

  return NextResponse.json({ id: agent.id, name: agent.name, email: agent.email });
}