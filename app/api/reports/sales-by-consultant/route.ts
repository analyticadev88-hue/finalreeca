import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const consultants = await prisma.consultant.findMany({
    select: {
      id: true,
      name: true,
      bookings: {
        where: { consultantId: { not: null } },
        select: {
          id: true,
          totalPrice: true,
          paymentStatus: true,
          consultantId: true,
          seatCount: true,
          trip: { select: { fare: true } }
        }
      }
    }
  });

  const sales = consultants.map(consultant => {
    const consultantBookings = consultant.bookings.filter(b => b.consultantId === consultant.id);
    const paidBookings = consultantBookings.filter(b => b.paymentStatus === "paid");
    const revenue = paidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    // Consultant does NOT receive commission
    const commission = 0;
    return {
      id: consultant.id,
      name: consultant.name,
      bookings: paidBookings.length,
      revenue,
      commission,
      commissionRate: 0 // No commission for consultant
    };
  });

  return NextResponse.json(sales);
}