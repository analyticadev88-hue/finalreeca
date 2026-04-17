import { Resend } from "resend";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";

// Utility to try sending email using Resend or Nodemailer
export async function trySendEmail(to: string | string[], subject: string, reactTemplate: any) {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.SENDER_EMAIL || 'REECA TRAVEL <tickets@reecatravel.co.bw>';

  const html = await render(reactTemplate);

  // 1. Try Resend if configured
  if (apiKey) {
    try {
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
      // Fall through to nodemailer below if also configured
    }
  }

  // 2. Try Nodemailer if SMTP configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || "587", 10),
        secure: false,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
      });
      
      const toStr = Array.isArray(to) ? to.join(",") : to;
      const info = await transporter.sendMail({
        from: sender,
        to: toStr,
        subject,
        html,
      });
      return { ok: true, id: (info as any)?.messageId };
    } catch (err: any) {
      console.error('Nodemailer send failed', err?.message || err);
      return { ok: false, error: err?.message || 'Nodemailer failed' };
    }
  }

  console.warn('No email provider configured: set RESEND_API_KEY or SMTP_HOST/SMTP_USER/SMTP_PASS');
  return { ok: false, error: 'No email provider configured' };
}
