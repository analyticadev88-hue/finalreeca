import React from 'react';

interface Props {
  searchParams?: any;
}

export default async function ApproveVoucherPage({ searchParams }: Props) {
  // Next.js requires awaiting searchParams before reading its properties
  const params = await (searchParams || {});
  const token = params?.token;
  const sig = params?.sig || params?.signature || params?.secret;

  if (!token) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Invalid approval link</h1>
        <p className="mt-4">Missing token.</p>
      </main>
    );
  }

  try {
  // Build an absolute origin for server-to-server fetch.
  // Prefer APP_URL (explicit), then VERCEL_URL (deployed preview/prod), otherwise default to localhost dev.
  const explicitAppUrl = process.env.NEXT_PUBLIC_APP_URL ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "") : undefined;
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}` : undefined;
  const devPort = process.env.PORT || "3000";
  const origin = explicitAppUrl || vercelUrl || `http://localhost:${devPort}`;
    // Call the API route server-side so the admin sees a friendly page
  const apiUrl = `${origin}/api/approve-voucher?token=${encodeURIComponent(token)}${sig ? `&sig=${encodeURIComponent(sig)}` : ''}`;
    const res = await fetch(apiUrl);
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      return (
        <main className="p-8">
          <h1 className="text-2xl font-bold">Approval failed</h1>
          <p className="mt-4">{body?.error || 'Unable to approve voucher.'}</p>
          <p className="mt-4"><a href="/admin/bookings" className="text-teal-600">Back to admin</a></p>
        </main>
      );
    }

    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-green-700">Voucher approved</h1>
        <p className="mt-4">Order {body.orderId} has been confirmed and ticket(s) have been sent.</p>
        <p className="mt-4"><a href="/admin/bookings" className="text-teal-600">Back to admin</a></p>
      </main>
    );
  } catch (err: any) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="mt-4">{String(err)}</p>
        <p className="mt-4"><a href="/admin/bookings" className="text-teal-600">Back to admin</a></p>
      </main>
    );
  }
}
