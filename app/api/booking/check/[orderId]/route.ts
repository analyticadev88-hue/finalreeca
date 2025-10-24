import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { orderId },
      select: {
        id: true,
        paymentStatus: true,
        bookingStatus: true,
        createdAt: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    return NextResponse.json({
      exists: true,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      createdAt: booking.createdAt,
    });
  } catch (error) {
    console.error("[BookingCheck] Error:", error);
    return NextResponse.json(
      { error: "Failed to check booking status" },
      { status: 500 }
    );
  }
}
