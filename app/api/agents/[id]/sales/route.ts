import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const bookings = await prisma.booking.findMany({
    where: { agentId: id, paymentStatus: "paid" },
    select: { totalPrice: true }
  });
  const bookingsCount = bookings.length;
  const revenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  // Calculate commission: If agent commission is 10%, agent receives 90% (i.e., company gets 90% of ticket, agent gets 10%)
  // So, commission = (totalPrice / 0.9) * 0.1 for each booking
  const commission = bookings.reduce((sum, b) => {
    const original = b.totalPrice ? b.totalPrice / 0.9 : 0;
    return sum + (original - (b.totalPrice || 0));
  }, 0);
  return NextResponse.json({
    bookings: bookingsCount,
    revenue,
    commission
  });
}