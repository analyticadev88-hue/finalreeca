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
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      firstName: p.firstName,
      lastName: p.lastName,
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
      phone: p.phone,
      nextOfKinName: p.nextOfKinName,
      nextOfKinPhone: p.nextOfKinPhone,
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
    const ADDON_MAP: Record<string, string> = {
      extraBaggage: "Extra Baggage (P300)",
      wimpyMeal1: "Wimpy Meal for 1 (P67)",
      wimpyMeal2: "Wimpy Meal for 2 (P137)",
      travelInsurance: "Travel Insurance (P450)",
    };

    const addonsArr: any[] = [];
    if (booking.addons && typeof booking.addons === 'object' && !Array.isArray(booking.addons)) {
      Object.entries(booking.addons).forEach(([key, selection]: [string, any]) => {
        if (selection.departure || selection.return) {
          const name = ADDON_MAP[key] || key;
          const detailsParts = [];
          if (selection.departure) {
            detailsParts.push(`Departure${selection.departurePref ? ` (${selection.departurePref})` : ""}`);
          }
          if (selection.return) {
            detailsParts.push(`Return${selection.returnPref ? ` (${selection.returnPref})` : ""}`);
          }
          const details = detailsParts.join(" & ");
          
          addonsArr.push({
            name,
            details: `Trip: ${details}`,
            price: "" // Price is already in the label for clarity
          });
        }
      });
    } else if (Array.isArray(booking.addons)) {
      addonsArr.push(...booking.addons);
    }

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

export async function PATCH(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;
  const data = await request.json();

  if (!orderId) {
    return NextResponse.json({ success: false, error: "Missing order ID" }, { status: 400 });
  }

  try {
    const { contactDetails, emergencyContact, passengers } = data;

    // Update the booking details
    await prisma.booking.update({
      where: { orderId },
      data: {
        userName: contactDetails?.name,
        userEmail: contactDetails?.email,
        userPhone: contactDetails?.mobile,
        contactIdNumber: contactDetails?.idNumber,
        emergencyContactName: emergencyContact?.name,
        emergencyContactPhone: emergencyContact?.phone,
      },
    });

    // Update passengers if provided
    if (passengers && Array.isArray(passengers)) {
      for (const p of passengers) {
        if (p.id) {
          await prisma.passenger.update({
            where: { id: p.id },
            data: {
              firstName: p.firstName,
              lastName: p.lastName,
              title: p.title,
              passportNumber: p.passportNumber,
              type: p.type,
              phone: p.phone,
              nextOfKinName: p.nextOfKinName,
              nextOfKinPhone: p.nextOfKinPhone,
              hasInfant: p.hasInfant,
              infantName: p.infantName,
              infantBirthdate: p.infantBirthdate,
              infantPassportNumber: p.infantPassportNumber,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Booking updated successfully" });
  } catch (error: any) {
    console.error("Booking update error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}