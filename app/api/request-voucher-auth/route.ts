import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { Resend } from "resend";
import crypto from "crypto";
// Avoid importing React or react-dom/server in route files (Next.js restriction).
// We'll build a simple HTML string instead of rendering the React email component.

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const adminEmail = process.env.VOUCHER_ADMIN_EMAIL;
    if (!data || !data.orderId || !data.userEmail || !data.tripId) {
      return NextResponse.json({ error: "Missing booking data" }, { status: 400 });
    }

    let booking;
    try {
      booking = await prisma.booking.create({
      data: {
        orderId: data.orderId,
        tripId: data.tripId,
        returnTripId: data.returnTripId || null,
        userName: data.userName || "",
        userEmail: data.userEmail,
        userPhone: data.userPhone || null,
        seats: JSON.stringify(data.selectedSeats || []),
        returnSeats: data.returnSeats ? JSON.stringify(data.returnSeats) : null,
        seatCount: (data.selectedSeats || []).length,
        totalPrice: 0.0,
        paymentMode: "Free Voucher",
        boardingPoint: data.boardingPoint || "",
        droppingPoint: data.droppingPoint || "",
        returnBoardingPoint: data.returnBoardingPoint || null,
        returnDroppingPoint: data.returnDroppingPoint || null,
        paymentStatus: "pending-authorization",
        bookingStatus: "pending",
        discountAmount: data.discountAmount || 0,
        competitorInfo: data.competitorInfo || null,
        contactIdNumber: data.contactDetails?.idNumber || "",
        emergencyContactName: data.emergencyContact?.name || null,
        emergencyContactPhone: data.emergencyContact?.phone || null,
        addons: data.addons || null,
        consultantId: data.consultantId || null,
        passengers: {
          create: (data.passengers || []).map((p: any) => ({
            tripId: data.tripId,
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            seatNumber: p.seatNumber || "",
            title: p.title || "",
            isReturn: !!p.isReturn,
            hasInfant: !!p.hasInfant,
            infantBirthdate: p.infantBirthdate || null,
            infantName: p.infantName || null,
            infantPassportNumber: p.infantPassportNumber || null,
            birthdate: p.birthdate || null,
            passportNumber: p.passportNumber || null,
            type: p.type || null,
            phone: p.phone || null,
            nextOfKinName: p.nextOfKinName || null,
            nextOfKinPhone: p.nextOfKinPhone || null,
          })),
        },
      },
      include: { passengers: true },
      });
    } catch (dbErr: any) {
      // Handle common Prisma errors gracefully
      if (dbErr instanceof Prisma.PrismaClientKnownRequestError && dbErr.code === "P2002") {
        console.warn("[request-voucher-auth] seat already booked", dbErr.meta || dbErr.message);
        return NextResponse.json({ error: "One or more selected seats are no longer available" }, { status: 409 });
      }
      throw dbErr;
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    // Support multiple admin emails (comma-separated in env). Store the primary admin on the record.
    const envRaw = (process.env.VOUCHER_ADMIN_EMAIL ?? adminEmail ?? "").trim();
    const adminEmails = envRaw
      ? envRaw.split(",").map(s => s.trim()).filter((s): s is string => s.length > 0)
      : [];
    const primaryAdminEmail = adminEmails[0] ?? adminEmail ?? null;
    await prisma.voucherAuthorization.create({
      data: {
        token,
        bookingId: booking.id,
        status: "pending",
        adminEmail: primaryAdminEmail,
        expiresAt,
      },
    });

    if (process.env.RESEND_API_KEY) {
  // Build a safe absolute origin. Prefer NEXT_PUBLIC_APP_URL only; otherwise use request origin, then fallback to http://localhost:3000
  const origin = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")) || new URL(req.url).origin || "http://localhost:3000";
      // If an admin secret is configured, build an HMAC signature for the token and append as 'sig'
      const adminSecret = process.env.VOUCHER_ADMIN_SECRET;
      let approvalLink = `${origin}/approve-voucher?token=${token}`;
      if (adminSecret) {
        const hmac = crypto.createHmac("sha256", adminSecret);
        hmac.update(token);
        const sig = hmac.digest("hex");
        approvalLink = `${origin}/approve-voucher?token=${token}&sig=${sig}`;
      }

      // simple HTML email string (avoid React render in server route)
      const logoUrl = `${origin}/images/reeca-travel-logo.png`;
      const seatsText = (JSON.parse(booking.seats) || []).join(", ");
      const html = `
        <html>
          <body style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#111;">
            <div style="max-width:600px;margin:0 auto;padding:24px;">
              <img src="${logoUrl}" alt="Reeca Travel" width="170" height="50" style="display:block;margin:0 auto 18px;" />
              <p>Good Day Mr & Mrs Tshosa,</p>
              <p>A consultant has requested a Free Voucher booking that needs your approval.</p>
              <p><strong>Booking ref:</strong> ${booking.orderId}<br />
                 <strong>Customer:</strong> ${booking.userName || booking.userEmail} &lt;${booking.userEmail}&gt;<br />
                 <strong>Seats:</strong> ${seatsText}<br />
                 <strong>Expires at:</strong> ${expiresAt.toISOString()}</p>
              <div style="text-align:center;margin:18px 0;">
                <a href="${approvalLink}" style="background:rgb(255,215,0);color:#000;padding:12px 18px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Approve Voucher</a>
              </div>
              <p>If you did not expect this request, you can ignore this email and the request will expire automatically.</p>
              <hr style="border:none;border-top:1px solid #e6e6e6;margin:20px 0;" />
              <p style="color:#8898aa;font-size:12px;">For support contact tickets@reecatravel.co.bw</p>
            </div>
          </body>
        </html>
      `;

      try {
  // Send to Agang and Hazel by default; fall back to env-configured admin emails if provided
  const defaultTo = ["agang@reecatravel.co.bw", "hazel@reecatravel.co.bw"];
  const to: string[] = adminEmails.length ? adminEmails : defaultTo;
        if (to.length === 0) {
          console.warn("No admin email configured; skipping voucher approval email");
        } else {
          await resend.emails.send({
            from: `REECA TRAVEL <tickets@reecatravel.co.bw>`,
            to,
            subject: `Voucher approval requested - ${booking.orderId}`,
            html,
            text: `Approve voucher: ${approvalLink} (expires ${expiresAt.toISOString()})`,
          });
        }
      } catch (err) {
        console.warn("Failed to send admin email for voucher request", err);
      }
    }

  return NextResponse.json({ success: true, token, expiresAt, bookingRef: booking.orderId });
  } catch (err: any) {
    console.error("[request-voucher-auth]", err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
