import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trySendEmail } from "@/lib/mail-service";
import { InquiryNotificationEmail } from "@/email-templates/InquiryNotificationEmail";
import React from 'react';

// Admin notification list as requested by user
const ADMIN_EMAILS = [
    "hazel@reecatravel.co.bw",
    "agang@reecatravel.co.bw",
    "toporapula@gmail.com"
];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const inquiry = await prisma.inquiry.create({
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        email: data.email,
        phone: data.phone,
        passengers: Number(data.passengers),
        date: data.date,
        time: data.time,
        origin: data.origin,
        destination: data.destination,
        returnDate: data.returnDate,
        specialRequests: data.specialRequests,
        status: "pending",
        requestedAt: new Date(),
      },
    });

    // Notify admins asynchronously (don't block the user's success response)
    trySendEmail(
        ADMIN_EMAILS,
        `New Reeca Inquiry: ${data.contactPerson} (${data.origin} to ${data.destination})`,
        React.createElement(InquiryNotificationEmail, {
            companyName: data.companyName,
            contactPerson: data.contactPerson,
            email: data.email,
            phone: data.phone,
            passengers: Number(data.passengers),
            date: data.date,
            time: data.time,
            origin: data.origin,
            destination: data.destination,
            specialRequests: data.specialRequests,
            returnDate: data.returnDate,
        })
    ).catch(err => console.error("Admin inquiry notification failed:", err));

    return NextResponse.json({ success: true, inquiry });
  } catch (error: any) {
    console.error("Inquiry creation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Auto-check for pending inquiries older than 24h to send reminders
async function runInquiryReminderCheck() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stales = await prisma.inquiry.findMany({
      where: {
        status: "pending",
        requestedAt: { lt: oneDayAgo },
        OR: [{ lastReminderAt: null }, { lastReminderAt: { lt: oneDayAgo } }],
      },
    });

    for (const inq of stales) {
      await trySendEmail(
        ADMIN_EMAILS,
        `REMINDER: Pending Inquiry from ${inq.contactPerson}`,
        React.createElement(InquiryNotificationEmail, {
          companyName: inq.companyName || undefined,
          contactPerson: inq.contactPerson,
          email: inq.email,
          phone: inq.phone,
          passengers: Number(inq.passengers),
          date: inq.date,
          time: inq.time,
          origin: inq.origin,
          destination: inq.destination,
          specialRequests: inq.specialRequests || undefined,
          returnDate: inq.returnDate || undefined,
        })
      );
      await prisma.inquiry.update({
        where: { id: inq.id },
        data: { lastReminderAt: new Date() },
      });
    }
  } catch (err) {
    console.error("Inquiry reminder check failed:", err);
  }
}

export async function GET() {
  runInquiryReminderCheck().catch(err => console.error("Reminder process error:", err));
  const inquiries = await prisma.inquiry.findMany({
    orderBy: { requestedAt: "desc" },
  });
  return NextResponse.json({ inquiries });
}