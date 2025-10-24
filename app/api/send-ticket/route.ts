
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import { PrismaClient } from "@prisma/client";
import TicketPdf from "@/email-templates/TicketPdf";
import React from "react";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

// --- Utility: formatDate ---
function formatDate(dateInput: Date | string | undefined, formatStr: string) {
  if (!dateInput) return "N/A";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    weekday: formatStr.includes("EEEE") ? "long" : undefined,
    month: formatStr.includes("MMMM")
      ? "long"
      : formatStr.includes("MMM")
      ? "short"
      : undefined,
    day: formatStr.includes("dd") ? "2-digit" : undefined,
    year: formatStr.includes("yyyy") ? "numeric" : undefined,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { orderId, email } = await req.json();
    if (!orderId || !email) {
      return NextResponse.json({ error: "Missing orderId or email" }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Resend API key not set" }, { status: 500 });
    }

    // --- Fetch booking data ---
    const booking = await prisma.booking.findUnique({
      where: { orderId },
      include: { passengers: true, trip: true, returnTrip: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // --- Prepare trip and passenger data ---
    const departurePassengers = booking.passengers
      .filter((p) => !p.isReturn)
      .map((p) => ({
        name: `${p.firstName} ${p.lastName}`,
        seat: p.seatNumber,
        title: p.title,
        isReturn: p.isReturn,
        type: p.type as "adult" | "child",
        hasInfant: p.hasInfant,
        infantName: p.infantName ?? undefined,
        infantBirthdate: p.infantBirthdate ?? undefined,
        infantPassportNumber: p.infantPassportNumber ?? undefined,
        passportNumber: p.passportNumber ?? undefined,
        birthdate: p.birthdate ?? undefined,
      }));

    const returnPassengers = booking.passengers
      .filter((p) => p.isReturn)
      .map((p) => ({
        name: `${p.firstName} ${p.lastName}`,
        seat: p.seatNumber,
        title: p.title,
        isReturn: p.isReturn,
        type: p.type as "adult" | "child",
        hasInfant: p.hasInfant,
        infantName: p.infantName ?? undefined,
        infantBirthdate: p.infantBirthdate ?? undefined,
        infantPassportNumber: p.infantPassportNumber ?? undefined,
        passportNumber: p.passportNumber ?? undefined,
        birthdate: p.birthdate ?? undefined,
      }));

    const departureTrip = {
      route: booking.trip.routeName,
      date: booking.trip.departureDate,
      time: booking.trip.departureTime,
      bus: booking.trip.serviceType,
      boardingPoint: booking.boardingPoint || "Not specified",
      droppingPoint: booking.droppingPoint || "Not specified",
      seats: JSON.parse(booking.seats),
      passengers: departurePassengers,
    };

    const returnTrip = booking.returnTrip
      ? {
          route: booking.returnTrip.routeName,
          date: booking.returnTrip.departureDate,
          time: booking.returnTrip.departureTime,
          bus: booking.returnTrip.serviceType,
          boardingPoint: booking.returnBoardingPoint || "Not specified",
          droppingPoint: booking.returnDroppingPoint || "Not specified",
          seats: booking.returnSeats ? JSON.parse(booking.returnSeats) : [],
          passengers: returnPassengers,
        }
      : undefined;

    const addons =
      Array.isArray(booking.addons) && booking.addons.length > 0
        ? booking.addons.filter(
            (a): a is { name: string; details?: string; price?: string } =>
              !!a && typeof a === "object" && typeof (a as any).name === "string"
          )
        : [];

    // --- Generate QR code data ---
    const qrData = {
      ref: booking.orderId,
      name: booking.userName,
      trips: [departureTrip, returnTrip]
        .filter(Boolean)
        .map((trip) => ({
          route: trip!.route,
          date: trip!.date instanceof Date ? trip!.date.toISOString() : trip!.date,
          time: trip!.time,
          seats: trip!.seats,
          passengers: trip!.passengers.map((p) => ({
            name: p.name,
            seat: p.seat,
            type: p.type,
            hasInfant: p.hasInfant,
          })),
        })),
      amount: booking.totalPrice,
      type: returnTrip ? "Roundtrip" : "Departure",
      addons: addons,
    };

    let qrBase64 = "";
    try {
      const qrRes = await fetch(
        `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
          JSON.stringify(qrData)
        )}`
      );
      const qrBuffer = await qrRes.arrayBuffer();
      qrBase64 = `data:image/png;base64,${Buffer.from(qrBuffer).toString("base64")}`;
    } catch (err) {
      console.error("Failed to generate QR code:", err);
      qrBase64 = "";
    }

    // --- Generate PDF ---
    const pdfBuffer = await renderToBuffer(
      React.createElement(TicketPdf, {
        booking,
        departureTrip,
        returnTrip,
        qrBase64
      })
    );

    // --- Prepare email text summary ---
    const textSummary = `
Dear ${booking.userName},
Thank you for booking with REECA TRAVEL!
Booking Reference: ${booking.orderId}
Trip: ${departureTrip.route}
Date: ${formatDate(departureTrip.date, "EEEE, MMMM dd, yyyy")}
Time: ${departureTrip.time}
Seats: ${departureTrip.seats.join(", ")}
Total Paid: BWP ${booking.totalPrice}
Please find your detailed ticket attached as a PDF.
Safe travels!
REECA TRAVEL Team
`;

    // --- Send email with Resend ---
    const resendResp = await resend.emails.send({
      from: 'REECA TRAVEL <tickets@reecatravel.co.bw>',
      to: email,
      subject: `Your REECA TRAVEL Ticket - Ref #${booking.orderId}`,
      text: textSummary,
      attachments: [
        {
          filename: `ReecaTicket-${booking.orderId}.pdf`,
          content: pdfBuffer.toString("base64"),
        },
      ],
    });

    console.info('[send-ticket] Email sent successfully. Resend response id:', resendResp.data?.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[send-ticket] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
