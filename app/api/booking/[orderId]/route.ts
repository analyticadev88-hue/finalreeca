// app/api/booking/[orderId]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fix API route signature for Next.js App Router (await params)
export async function GET(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: "Missing order ID" },
      { status: 400 }
    );
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { orderId },
      include: {
        passengers: true,
        trip: true,
        returnTrip: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Map all passenger fields for the ticket
    const passengers = (booking.passengers || []).map((p: any) => ({
      name: `${p.firstName} ${p.lastName}`,
      seat: p.seatNumber,
      title: p.title,
      type: p.type,
      isReturn: p.isReturn,
      hasInfant: !!p.hasInfant,
      infantName: p.infantName || "",
      infantBirthdate: p.infantBirthdate || "",
      infantPassportNumber: p.infantPassportNumber || "",
      birthdate: p.birthdate || "",
      passportNumber: p.passportNumber || "",
    }));

    // Parse seats
    const parseSeats = (seats: any): string[] => {
      if (!seats) return [];
      if (Array.isArray(seats)) return seats;
      if (typeof seats === "string") {
        try {
          return JSON.parse(seats);
        } catch {
          return seats.split(",").map((s: string) => s.trim());
        }
      }
      return [];
    };

    const departureSeats = parseSeats(booking.seats);
    const returnSeats = parseSeats(booking.returnSeats);

    // Build trips
    const departureTrip = {
      route: booking.trip?.routeName || "Unknown Route",
      date: booking.trip?.departureDate || new Date().toISOString(),
      time: booking.trip?.departureTime || "00:00",
      bus: booking.trip?.serviceType || "Standard Bus",
      boardingPoint: booking.boardingPoint,
      droppingPoint: booking.droppingPoint,
      seats: departureSeats,
      passengers: passengers.filter((p: any) => !p.isReturn)
    };

    const returnTrip = booking.returnTripId ? {
      route: booking.returnTrip?.routeName || "Unknown Route",
      date: booking.returnTrip?.departureDate || new Date().toISOString(),
      time: booking.returnTrip?.departureTime || "00:00",
      bus: booking.returnTrip?.serviceType || "Standard Bus",
      boardingPoint: booking.returnBoardingPoint,
      droppingPoint: booking.returnDroppingPoint,
      seats: returnSeats,
      passengers: passengers.filter((p: any) => p.isReturn)
    } : undefined;

    // Format add-ons as array for ticket
    const addonsArr = booking.addons
      ? Array.isArray(booking.addons)
        ? booking.addons
        : Object.entries(booking.addons).map(([key, value]) => ({
            name: key,
            ...(typeof value === "object" && value !== null ? value : { value }),
          }))
      : [];

    // Build response
    const responseData = {
      bookingRef: booking.orderId,
      userName: booking.userName,
      userEmail: booking.userEmail,
      userPhone: booking.userPhone,
      totalAmount: booking.totalPrice,
      paymentMethod: booking.paymentMode || "Credit Card",
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      contactDetails: {
        name: booking.userName,
        email: booking.userEmail,
        mobile: booking.userPhone,
        idType: "Passport",
        idNumber: booking.contactIdNumber || "-",
      },
      emergencyContact: {
        name: booking.emergencyContactName || "-",
        phone: booking.emergencyContactPhone || "-",
      },
      addons: addonsArr,
      passengers,
      departureTrip,
      returnTrip,
    };

    console.log("Final response data:", JSON.stringify(responseData, null, 2));
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Booking fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}