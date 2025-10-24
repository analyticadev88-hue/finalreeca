import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "missing token" }, { status: 400 });

    const auth = await prisma.voucherAuthorization.findUnique({ where: { token } });
  if (!auth) return NextResponse.json({ status: "not_found" });

    const now = new Date();
    if (auth.status === "approved") {
      const booking = await prisma.booking.findUnique({ where: { id: auth.bookingId } });
      return NextResponse.json({ status: "approved", orderId: booking?.orderId });
    }
    if (auth.expiresAt && auth.expiresAt < now) {
      // update status to expired for convenience
  await prisma.voucherAuthorization.update({ where: { token }, data: { status: "expired" } });
  return NextResponse.json({ status: "expired" });
    }

  return NextResponse.json({ status: "pending" });
  } catch (err: any) {
    console.error("/api/voucher-status error", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
