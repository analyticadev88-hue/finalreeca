import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trySendEmail } from "@/lib/mail-service";
import { InquiryApprovedEmail } from "@/email-templates/InquiryApprovedEmail";
import { InquiryRejectedEmail } from "@/email-templates/InquiryRejectedEmail";
import React from "react";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json();
  const { status, sendEmail, message } = body as {
    status: string;
    sendEmail?: boolean;
    message?: string;
  };

  const inquiry = await prisma.inquiry.update({
    where: { id },
    data: { status },
  });

  if (sendEmail && inquiry.email) {
    const customMessage = message?.trim() || undefined;

    if (status === "approved") {
      await trySendEmail(
        inquiry.email,
        "Your inquiry has been approved — REECA TRAVEL",
        React.createElement(InquiryApprovedEmail, {
          contactPerson: inquiry.contactPerson,
          companyName: inquiry.companyName || undefined,
          origin: inquiry.origin,
          destination: inquiry.destination,
          date: inquiry.date,
          time: inquiry.time,
          passengers: inquiry.passengers,
          customMessage,
        })
      );
    } else if (status === "rejected") {
      await trySendEmail(
        inquiry.email,
        "Update on your inquiry — REECA TRAVEL",
        React.createElement(InquiryRejectedEmail, {
          contactPerson: inquiry.contactPerson,
          companyName: inquiry.companyName || undefined,
          origin: inquiry.origin,
          destination: inquiry.destination,
          date: inquiry.date,
          customMessage,
        })
      );
    }
  }

  return NextResponse.json({ success: true, inquiry });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await prisma.inquiry.delete({
    where: { id },
  });
  return NextResponse.json({ success: true });
}
