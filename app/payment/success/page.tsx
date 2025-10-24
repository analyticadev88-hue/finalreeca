'use client';

import { useEffect, useState, Suspense } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          {status === 'paid' ? (
            <CheckCircle className="h-10 w-10 text-green-600" />
          ) : status === 'failed' || status === 'error' ? (
            <XCircle className="h-10 w-10 text-red-600" />
          ) : (
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
          )}
        </div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">
          {status === 'paid' && 'Payment Successful!'}
          {status === 'pending' && 'Payment Pending'}
          {status === 'failed' && 'Payment Failed'}
          {status === 'error' && 'Verification Error'}
          {status === 'loading' && 'Verifying Payment...'}
        </h2>
        <div className="mt-6">
          {status === 'paid' && (
            <>
              <p className="text-lg text-gray-600">Your payment was successful. Your booking is confirmed.</p>
              <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-blue-700 text-sm font-semibold">Booking Reference: <span className="font-mono">{booking?.orderId}</span></p>
                <p className="text-blue-700 text-sm">Passenger: {booking?.userName}</p>
                <p className="text-blue-700 text-sm">Email: {booking?.userEmail}</p>
                <p className="text-blue-700 text-sm">Seats: {booking?.seats}</p>
                <p className="text-blue-700 text-sm">Amount Paid: P{booking?.totalPrice?.toFixed(2)}</p>
                {/* Add more booking details as needed */}
              </div>
              <div className="mt-6">
                <Button
                  asChild
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md text-lg"
                >
                  <Link href={`/ticket/${booking?.orderId}`}>
                    View & Print Ticket(s)
                  </Link>
                </Button>
              </div>
              <div className="mt-8 bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-green-700">We've sent a confirmation email with your booking details. Please check your inbox.</p>
              </div>
            </>
          )}
          {status === 'pending' && (
            <>
              <p className="text-lg text-blue-700">Your payment is being processed. This may take a few seconds.</p>
              <Button onClick={handleRetry} className="mt-4">Retry Verification</Button>
            </>
          )}
          {(status === 'failed' || status === 'error') && (
            <>
              <p className="text-lg text-red-700">{error || 'There was a problem verifying your payment.'}</p>
              <Button onClick={handleRetry} className="mt-4">Retry Verification</Button>
              <div className="mt-4 text-sm text-gray-600">If you were charged but did not receive a ticket, please contact support with your payment reference.</div>
            </>
          )}
          {status === 'loading' && (
            <p className="text-lg text-gray-600">Verifying your payment...</p>
          )}
        </div>
        <div className="mt-8">
          <Button
            asChild
            variant="outline"
            className="w-full mt-3 bg-white text-gray-700 font-semibold py-3 px-4 rounded-lg border border-gray-300 shadow-sm"
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
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">
          Verifying Payment...
        </h2>
        <div className="mt-6">
          <p className="text-lg text-gray-600">Verifying your payment...</p>
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