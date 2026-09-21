import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "topo123";

/**
 * GET /api/auth/status
 *
 * Always returns 200. Returns the authenticated agent and/or consultant
 * objects if their respective cookies are present and valid.
 * Replaces the separate /api/agent/me and /api/consultant/me calls that
 * were generating noisy 401 errors in the browser console for unauthenticated users.
 */
export async function GET(req: NextRequest) {
  let agent = null;
  let consultant = null;

  // --- Check agent token ---
  try {
    const agentToken = req.cookies.get("agent_token")?.value;
    if (agentToken) {
      const payload: any = jwt.verify(agentToken, JWT_SECRET);
      if (payload?.id) {
        const dbAgent = await prisma.agent.findUnique({
          where: { id: payload.id },
          select: {
            id: true,
            name: true,
            email: true,
            commissionRate: true,
            allowedPaymentMethods: true,
          },
        });
        if (dbAgent) agent = dbAgent;
      }
    }
  } catch {
    // Invalid / expired token — treat as unauthenticated, not an error
  }

  // --- Check consultant token ---
  try {
    const consultantToken = req.cookies.get("consultant_token")?.value;
    if (consultantToken) {
      const payload: any = jwt.verify(consultantToken, JWT_SECRET);
      if (payload?.id) {
        const dbConsultant = await prisma.consultant.findUnique({
          where: { id: payload.id },
          select: { id: true, name: true, email: true },
        });
        if (dbConsultant) consultant = dbConsultant;
      }
    }
  } catch {
    // Invalid / expired token — treat as unauthenticated, not an error
  }

  return NextResponse.json({ agent, consultant });
}
