import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

// Email sending function (same as reservations)
async function trySendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
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

  console.warn('No email provider configured');
  return { ok: false, error: 'No email provider configured' };
}

export async function POST(request: Request, context: any) {
  try {
    const body = await request.json();
    const { contactEmail, paid, createdBy } = body;
    const params = await context.params;
    const id = params?.id;

    if (!id) return NextResponse.json({ message: 'Missing charter id' }, { status: 400 });

    const charter = await prisma.tripReservation.findUnique({ 
      where: { id }, 
      include: { 
        trip: true, 
        seatReservations: true 
      } 
    });
    
    if (!charter) return NextResponse.json({ message: 'Charter not found' }, { status: 404 });

    // Idempotency guard
    const now = new Date();
    const recentWindowMs = 30 * 1000;
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
          contactEmail: contactEmail || charter.reservedContactEmail || null,
          createdBy: createdBy || null,
          prepaid: !!paid,
          expiresAt,
        }
      });
    }

    // Send email if contact email provided
    let emailSent = false;
    let emailError: string | null = null;
    let providerMessage: string | undefined = undefined;
    
    if (contactEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
      const bookingUrl = `${appUrl.replace(/\/$/, '')}/reservation/${link.token}`;
      
      try {
        const ReactDOMServer = await import('react-dom/server');
        const { ReservationLinkEmail } = await import('@/email-templates/ReservationLinkEmail');
        const trip = charter.trip || {};
        const html = ReactDOMServer.renderToStaticMarkup(
          ReservationLinkEmail({
            customerName: charter.reservedClientName || '',
            seats: (charter.seatReservations || []).map((s: any) => s.seatNumber).join(', '),
            link: bookingUrl,
            expiresAt: new Date(link.expiresAt).toLocaleString(),
            tripOrigin: trip.routeOrigin,
            tripDestination: trip.routeDestination,
            tripDate: trip.departureDate ? new Date(trip.departureDate).toLocaleString() : undefined,
          })
        );
        const res = await trySendEmail(contactEmail, 'REECA TRAVEL: Complete your charter booking', html);
        emailSent = !!res.ok;
        if (!res.ok) {
          emailError = res.error || 'Unknown email error';
        } else {
          providerMessage = res.id ? `provider_id:${res.id}` : undefined;
        }
      } catch (err: any) {
        console.error('Failed to render/send charter email', err?.message || err);
        const simpleHtml = `<p>Hello,</p><p>Please complete your charter booking by visiting <a href="${bookingUrl}">${bookingUrl}</a>. This link expires on ${new Date(link.expiresAt).toLocaleString()}.</p>`;
        const res = await trySendEmail(contactEmail, 'REECA TRAVEL: Complete your charter booking', simpleHtml);
        emailSent = !!res.ok;
        if (!res.ok) emailError = res.error || 'Unknown email error';
      }
    }

    return NextResponse.json({ 
      success: true, 
      token: link.token, 
      expiresAt: link.expiresAt, 
      emailSent, 
      emailError, 
      providerMessage 
    });
  } catch (error) {
    console.error('Generate charter link error', error);
    return NextResponse.json({ message: 'Failed to generate charter link' }, { status: 500 });
  }
}