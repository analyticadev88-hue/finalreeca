import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Send email optionally using Resend if configured
async function trySendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  // Default sender to the same address used by send-ticket route
  const sender = process.env.SENDER_EMAIL || 'REECA TRAVEL <tickets@reecatravel.co.bw>';

  if (apiKey) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      const resp = await resend.emails.send({
        from: sender,
        to,
        subject,
        html,
      });
      return { ok: true, id: resp?.data?.id };
    } catch (err: any) {
      console.error('Resend email send failed', err?.message || err);
      return { ok: false, error: err?.message || 'Resend failed' };
    }
  }

  // Fallback to Nodemailer if SMTP envs provided
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT;
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort ? parseInt(smtpPort, 10) : 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      });
      const info = await transporter.sendMail({ from: sender, to, subject, html });
      return { ok: true, id: (info as any)?.messageId };
    } catch (err: any) {
      console.error('Nodemailer send failed', err?.message || err);
      return { ok: false, error: err?.message || 'Nodemailer failed' };
    }
  }

  console.warn('No email provider configured: set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS');
  return { ok: false, error: 'No email provider configured' };
}

export async function POST(request: Request, context: any) {
  try {
    const body = await request.json();
    const { contactEmail, paid, createdBy } = body;
    const params = await context.params;
    const id = params?.id;

    if (!id) return NextResponse.json({ message: 'Missing reservation id' }, { status: 400 });

  const reservation = await prisma.tripReservation.findUnique({ where: { id }, include: { trip: true, seatReservations: true } });
    if (!reservation) return NextResponse.json({ message: 'Reservation not found' }, { status: 404 });

    // Idempotency guard: if a link was created very recently, return it instead of creating duplicates
    const now = new Date();
    const recentWindowMs = 30 * 1000; // 30 seconds
    const recentSince = new Date(now.getTime() - recentWindowMs);
    const recent = await prisma.reservationLink.findFirst({
      where: {
        tripReservationId: id,
        createdAt: { gte: recentSince },
        used: false,
        expiresAt: { gt: now }
      },
      orderBy: { createdAt: 'desc' }
    });

    let link = recent;
    if (!link) {
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours

      link = await prisma.reservationLink.create({
        data: {
          token,
          tripReservationId: id,
          contactEmail: contactEmail || reservation.reservedContactEmail || null,
          createdBy: createdBy || null,
          prepaid: !!paid,
          expiresAt,
        }
      });
    }
    // Optionally send email with link if contactEmail and RESEND configured
  let emailSent = false;
  let emailError: string | null = null;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    let providerMessage: string | undefined = undefined;
    if (contactEmail) {
      const bookingUrl = `${appUrl.replace(/\/$/, '')}/reservation/${link.token}`;
      // Render a nice HTML email using our template
      try {
        const ReactDOMServer = await import('react-dom/server');
        const { ReservationLinkEmail } = await import('@/email-templates/ReservationLinkEmail');
        const trip = reservation.trip || {};
        const html = ReactDOMServer.renderToStaticMarkup(
          ReservationLinkEmail({
            customerName: reservation.reservedClientName || '',
            seats: (reservation.seatReservations || []).map((s:any) => s.seatNumber).join(', '),
            link: bookingUrl,
            expiresAt: new Date(link.expiresAt).toLocaleString(),
            tripOrigin: trip.routeOrigin,
            tripDestination: trip.routeDestination,
            tripDate: trip.departureDate ? new Date(trip.departureDate).toLocaleString() : undefined,
          })
        );
        const res = await trySendEmail(contactEmail, 'REECA TRAVEL: Complete your booking', html);
        emailSent = !!res.ok;
        if (!res.ok) {
          emailError = res.error || 'Unknown email error';
        } else {
          providerMessage = res.id ? `provider_id:${res.id}` : undefined;
        }
      } catch (err:any) {
        console.error('Failed to render/send reservation email', err?.message || err);
        // Fallback to simple link body
        const simpleHtml = `<p>Hello,</p><p>Please complete your booking for reserved seats by visiting <a href="${bookingUrl}">${bookingUrl}</a>. This link expires on ${new Date(link.expiresAt).toLocaleString()}.</p>`;
        const res = await trySendEmail(contactEmail, 'REECA TRAVEL: Complete your booking', simpleHtml);
        emailSent = !!res.ok;
        if (!res.ok) emailError = res.error || 'Unknown email error';
      }
    }

    return NextResponse.json({ success: true, token: link.token, expiresAt: link.expiresAt, emailSent, emailError, providerMessage });
  } catch (error) {
    console.error('Generate link error', error);
    return NextResponse.json({ message: 'Failed to generate link' }, { status: 500 });
  }
}
