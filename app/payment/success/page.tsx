'use client';

import { useEffect, useState, Suspense } from 'react';
import { CheckCircle2, XCircle, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

function PaymentSuccessContent({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState<'loading' | 'paid' | 'pending' | 'failed' | 'error'>('loading');
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Get order_id from URL or searchParams
  useEffect(() => {
    (async () => {
      let oid = '';
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        oid = urlParams.get('order_id') || '';
      }
      if (!oid) {
        const params = await searchParams;
        oid = Array.isArray(params.order_id) ? params.order_id[0] : params.order_id || '';
      }
      setOrderId(oid);
    })();
  }, [searchParams]);

  // Stripe-style: Instantly verify payment, no polling if paid/failed
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    const verify = async () => {
      setStatus('loading');
      setError(null);
      try {
        const res = await fetch(`/api/dpo-verify-payment?order_id=${orderId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
        });
        const data = await res.json();
        if (res.ok && data.paymentStatus) {
          if (data.paymentStatus === 'paid') {
            setStatus('paid');
            setBooking(data.booking);
            setError(null);
          } else if (data.paymentStatus === 'pending') {
            setStatus('pending');
            setBooking(null);
            setError(null);
          } else {
            setStatus('failed');
            setBooking(null);
            setError(data.dpo?.resultExplanation || data.error || 'Payment failed.');
          }
        } else {
          setStatus('error');
          setError(data.error || 'Could not verify payment.');
        }
      } catch (e: any) {
        setStatus('error');
        setError(e.message || 'Network error.');
      }
    };
    verify();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, retryCount]);

  // Retry handler
  const handleRetry = () => setRetryCount(c => c + 1);

  const detailRow = (label: string, value: React.ReactNode, highlight = false) => (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-teal-700 font-semibold' : 'text-gray-900'}`}>{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-teal-50">
          {status === 'paid' ? (
            <CheckCircle2 className="h-9 w-9 text-teal-600" strokeWidth={1.75} />
          ) : status === 'failed' || status === 'error' ? (
            <XCircle className="h-9 w-9 text-red-500" strokeWidth={1.75} />
          ) : (
            <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
          )}
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900">
          {status === 'paid' && 'Payment Successful'}
          {status === 'pending' && 'Payment Pending'}
          {status === 'failed' && 'Payment Failed'}
          {status === 'error' && 'Verification Error'}
          {status === 'loading' && 'Verifying Payment'}
        </h2>
        <div className="mt-6">
          {status === 'paid' && (
            <>
              <p className="text-gray-600">Your payment was successful and your booking is confirmed.</p>
              <div className="mt-6 bg-gray-50 rounded-xl p-5 text-left border border-gray-100">
                {detailRow('Booking Reference', booking?.orderId, true)}
                {detailRow('Passenger', booking?.userName)}
                {detailRow('Email', booking?.userEmail)}
                {detailRow('Seats', booking?.seats)}
                {detailRow('Amount Paid', `P${booking?.totalPrice?.toFixed(2)}`, true)}
              </div>
              <div className="mt-6">
                <Button
                  asChild
                  className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 px-4 rounded-xl text-base"
                >
                  <Link href={`/ticket/${booking?.orderId}`}>
                    View & Print Ticket(s)
                  </Link>
                </Button>
              </div>
              <div className="mt-6 pt-5 border-t border-gray-100 flex items-start gap-2.5 text-left">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-500">We've sent a confirmation email with your booking details. Please check your inbox.</p>
              </div>
            </>
          )}
          {status === 'pending' && (
            <>
              <p className="text-gray-600">Your payment is being processed. This may take a few seconds.</p>
              <Button onClick={handleRetry} variant="outline" className="mt-5 rounded-xl">Retry Verification</Button>
            </>
          )}
          {(status === 'failed' || status === 'error') && (
            <>
              <p className="text-gray-600">{error || 'There was a problem verifying your payment.'}</p>
              <Button onClick={handleRetry} variant="outline" className="mt-5 rounded-xl">Retry Verification</Button>
              <div className="mt-4 text-sm text-gray-500">If you were charged but did not receive a ticket, please contact support with your payment reference.</div>
            </>
          )}
          {status === 'loading' && (
            <p className="text-gray-600">Confirming your payment, please wait...</p>
          )}
        </div>
        <div className="mt-8">
          <Button
            asChild
            variant="outline"
            className="w-full bg-white text-gray-700 font-medium py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50"
          >
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component for Suspense
function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-teal-50">
          <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900">
          Verifying Payment
        </h2>
        <div className="mt-6">
          <p className="text-gray-600">Confirming your payment, please wait...</p>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent searchParams={searchParams} />
    </Suspense>
  );
}
