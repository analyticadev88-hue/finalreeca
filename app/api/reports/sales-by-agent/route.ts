import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      name: true,
      commissionRate: true,
      bookings: {
        where: { agentId: { not: null } },
        select: {
          id: true,
          totalPrice: true,
          paymentStatus: true,
          agentId: true,
          seatCount: true,
          trip: { select: { fare: true } }
        }
      }
    }
  });

  const sales = agents.map(agent => {
    const agentBookings = agent.bookings.filter(b => b.agentId === agent.id);
    const paidBookings = agentBookings.filter(b => b.paymentStatus === "paid");
    const revenue = paidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
    const commissionRate = agent.commissionRate ?? 10;
    const rate = commissionRate / 100;
    const multiplier = 1 - rate;
    
    // Commission: original = totalPrice / (1 - rate), commission = original - totalPrice
    const commission = paidBookings.reduce((sum, b) => {
      if (multiplier <= 0) return sum;
      const original = b.totalPrice ? b.totalPrice / multiplier : 0;
      return sum + (original - (b.totalPrice || 0));
    }, 0);
    
    return {
      id: agent.id,
      name: agent.name,
      bookings: paidBookings.length,
      revenue,
      commission,
      commissionRate
    };
  });

  return NextResponse.json(sales);
}
