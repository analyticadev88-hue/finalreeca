
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import PasswordResetEmail from "@/email-templates/PasswordResetEmail";
import React from "react";
import { authProtection, handleArcjetDecision, logArcjetDecision } from "@/lib/arcjet";

const JWT_SECRET = process.env.JWT_SECRET || "topo123";

if (process.env.NODE_ENV === "production" && JWT_SECRET === "topo123") {
  throw new Error("CRITICAL SECURITY RISK: Change JWT_SECRET in production!");
}

export async function POST(req: NextRequest) {
  // Arcjet protection: bot detection + rate limiting
  const decision = await authProtection.protect(req, { requested: 1 });
  logArcjetDecision(decision, "/api/auth/forgot-password");

  const arcjetResult = handleArcjetDecision(decision);
  if (arcjetResult.denied) {
    return NextResponse.json(
      { error: arcjetResult.message },
      { status: arcjetResult.status }
    );
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }


  // Only check agent and consultant tables
  let user: any = null;
  let userType: "agent" | "consultant" | null = null;
  user = await prisma.agent.findUnique({ where: { email } });
  if (user) userType = "agent";
  if (!user) {
    user = await prisma.consultant.findUnique({ where: { email } });
    if (user) userType = "consultant";
  }
  if (!user) {
    return NextResponse.json({ error: "No user found with that email" }, { status: 404 });
  }

  // Create a reset token (valid for 1 hour)
  const token = jwt.sign({ id: user.id, email, userType }, JWT_SECRET, { expiresIn: "1h" });
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/reset-password?token=${token}`;


  // Send password reset email using Resend
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Resend API key not set" }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: 'REECA TRAVEL <passwordreset@reecatravel.co.bw>',
      to: email,
      subject: 'Reset your REECA TRAVEL password',
      react: React.createElement(PasswordResetEmail, {
        userName: user.name || user.fullName || undefined,
        resetUrl
      }),
    });
  } catch (err) {
    console.error("[forgot-password] Failed to send reset email:", err);
    // Don't leak error details to user
  }

  return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
}
