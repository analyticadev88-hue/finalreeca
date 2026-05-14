import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  
  const agent = await prisma.agent.findUnique({
    where: { id },
    select: { commissionRate: true },
  });
  
  const commissionRate = agent?.commissionRate ?? 10;
  const rate = commissionRate / 100;
  const multiplier = 1 - rate;
  
  const bookings = await prisma.booking.findMany({
    where: { agentId: id, paymentStatus: "paid" },
    select: { totalPrice: true }
  });
  
  const bookingsCount = bookings.length;
  const revenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  
  // Calculate commission: agent pays (1 - rate) of original price
  // So, original = totalPrice / (1 - rate), commission = original - totalPrice
  const commission = bookings.reduce((sum, b) => {
    if (multiplier <= 0) return sum;
    const original = b.totalPrice ? b.totalPrice / multiplier : 0;
    return sum + (original - (b.totalPrice || 0));
  }, 0);
  
  return NextResponse.json({
    bookings: bookingsCount,
    revenue,
    commission,
    commissionRate
  });
}
