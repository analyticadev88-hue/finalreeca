import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import crypto from "crypto";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    // If an admin secret is configured, verify HMAC signature 'sig' for the token
    const requiredSecret = process.env.VOUCHER_ADMIN_SECRET;
    if (requiredSecret) {
      const providedSig = url.searchParams.get("sig");
      if (!providedSig) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      const hmac = crypto.createHmac("sha256", requiredSecret);
      hmac.update(token);
      const expectedSig = hmac.digest("hex");
      // timing-safe compare
      const providedBuf = Buffer.from(providedSig, "hex");
      const expectedBuf = Buffer.from(expectedSig, "hex");
      if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const auth = await prisma.voucherAuthorization.findUnique({ where: { token }, include: { booking: true } });
    if (!auth) return NextResponse.json({ error: "Invalid token" }, { status: 404 });

    // Expiry check
    if (new Date() > auth.expiresAt) {
      await prisma.voucherAuthorization.update({ where: { id: auth.id }, data: { status: "expired" } });
      await prisma.booking.update({ where: { id: auth.bookingId }, data: { bookingStatus: "authorization-timeout", paymentStatus: "timeout" } });
      return NextResponse.json({ error: "Token expired" }, { status: 410 });
    }

    // Try to atomically mark the authorization as approved only if it's still pending
    const now = new Date();
    const updateResult = await prisma.voucherAuthorization.updateMany({
      where: { token, status: "pending" },
      data: { status: "approved" },
    });

    if (updateResult.count === 0) {
      // Someone else already processed this authorization
  const existing = await prisma.voucherAuthorization.findUnique({ where: { token } });
  return NextResponse.json({ error: "Authorization already handled", status: existing?.status, approvedBy: (existing as any)?.approvedBy, approvedAt: (existing as any)?.approvedAt }, { status: 409 });
    }

  // We succeeded in marking it approved; record approver info, update booking and send ticket once
  // set approvedBy/approvedAt (separate update to avoid Prisma client type mismatch until client is regenerated)
  await (prisma as any).voucherAuthorization.update({ where: { token }, data: { approvedBy: auth.adminEmail || null, approvedAt: now } });
  await prisma.booking.update({ where: { id: auth.bookingId }, data: { paymentStatus: "paid", bookingStatus: "confirmed" } });

    // send ticket email to user by reusing send-ticket endpoint (server-to-server)
    const orderId = auth.booking.orderId;
    if (process.env.RESEND_API_KEY) {
      try {
        // call internal send-ticket route using APP_URL or request origin
        const origin = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")) || new URL(req.url).origin || "http://localhost:3000";
        await fetch(`${origin}/api/send-ticket`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, email: auth.booking.userEmail }),
        });
      } catch (err) {
        console.warn("Failed to call send-ticket for voucher approval", err);
      }
    }

    return NextResponse.json({ success: true, orderId, approvedBy: auth.adminEmail || null, approvedAt: now });
  } catch (err: any) {
    console.error("[approve-voucher]", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
