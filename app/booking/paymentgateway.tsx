import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import debounce from 'lodash.debounce';

export interface BookingData {
  tripId: string;
  totalPrice: number;
  selectedSeats: string[];
  departureSeats: string[];
  returnSeats?: string[];
  passengers: {
    firstName: string;
    lastName: string;
    seatNumber: string;
    title: string;
    isReturn: boolean;
  }[];
  userName: string;
  userEmail: string;
  userPhone: string;
  boardingPoint: string;
  droppingPoint: string;
  orderId: string;
  contactDetails: any;
  emergencyContact: any;
  paymentMode: string;
  returnTripId?: string;
  returnBoardingPoint?: string;
  returnDroppingPoint?: string;
  discountAmount?: number;
  agentId?: string;
  consultantId?: string;
  addons?: any;
}

interface PaymentGatewayProps {
  bookingData: BookingData;
  onPaymentComplete: () => void;
  setShowPayment: (show: boolean) => void;
  onReservationConflict?: (message?: string) => void;
}

export default function PaymentGateway({
  bookingData,
  onPaymentComplete,
  setShowPayment,
  onReservationConflict,
}: PaymentGatewayProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const isProcessingRef = useRef(false);

  const sessionCreatedRef = useRef(false);
  const upRef = useRef<any>(null);
  const cancelRejectRef = useRef<((e: Error) => void) | null>(null);
  const orderIdRef = useRef<string>('');

  const createSession = async (paymentData: BookingData) => {
    if (isProcessingRef.current || sessionCreatedRef.current) return;
    isProcessingRef.current = true;
    try {
      // 1. Fetch Capture Context from backend
      const response = await fetch('/api/create-capture-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'Failed to initialize checkout. Please try again.');
        setIsProcessing(false);
        isProcessingRef.current = false;
        return;
      }

      sessionCreatedRef.current = true;

      const captureContext = data.captureContext;
      const orderId = data.orderId;
      orderIdRef.current = orderId;

      // 2. Extract client library URL from capture context JWT
      const payloadBase64 = captureContext.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const clientLibraryUrl = payload.ctx[0].data.clientLibrary;

      // 3. Dynamically inject the Unified Checkout script (once)
      if (document.getElementById('cybersource-upe')) {
        initializeUnifiedCheckout(captureContext, orderId);
        return;
      }
      const script = document.createElement('script');
      script.id = 'cybersource-upe';
      script.src = clientLibraryUrl;
      script.async = true;
      script.onload = () => {
        initializeUnifiedCheckout(captureContext, orderId);
      };
      script.onerror = () => {
        setError('Failed to load payment gateway. Please check your connection.');
        setIsProcessing(false);
      };
      document.body.appendChild(script);

    } catch (err) {
      setError('An unexpected error occurred during payment processing');
      setIsProcessing(false);
      console.error('Payment initiation failed:', err);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const initializeUnifiedCheckout = async (captureContext: string, orderId: string) => {
    try {
      const w = window as any;
      // Accept is a factory returning a Promise (NOT a constructor in this build)
      const accept = await w.Accept(captureContext);
      const up = await accept.unifiedPayments();
      upRef.current = up;

      setIsProcessing(false);
      setShowCheckout(true);
      // Let the containers become visible before the library measures them
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Sidebar mode: only paymentSelection is allowed; the payment
      // screen opens as a Cybersource-hosted overlay.
      const tt = await new Promise((resolve, reject) => {
        cancelRejectRef.current = reject;
        up.show({
          containers: { paymentSelection: '#unified-checkout-buttons' },
        }).then(resolve).catch(reject);
      });
      cancelRejectRef.current = null;
      const completeResponse = await up.complete(tt);

      await verifyPayment(completeResponse, orderId);
    } catch (err: any) {
      cancelRejectRef.current = null;
      console.error('Unified Checkout Error:', err?.reason, err?.message, err);
      if (err?.message === 'CANCELLED_BY_USER') {
        setError('You cancelled the payment.');
      } else {
        setError('Payment was cancelled or could not be completed. Please try again.');
      }
      releasePayment(err?.message === 'CANCELLED_BY_USER' ? 'cancelled' : 'failed');
      setShowCheckout(false);
      setIsProcessing(false);
    }
  };

  // Tell the backend the payment did not go through so the held seats are
  // released immediately instead of lingering until reservation expiry.
  const releasePayment = (status: 'cancelled' | 'failed') => {
    const orderId = orderIdRef.current || bookingData.orderId;
    if (!orderId) return;
    fetch('/api/unified-checkout-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    }).catch((err) => console.warn('Failed to release held seats:', err));
  };

  const handleConfirmCancel = () => {
    setConfirmCancel(false);
    if (cancelRejectRef.current) {
      // Cancel mid-checkout: tear down the Cybersource UI and reject the
      // pending show() promise so the flow lands in the catch handler.
      try { upRef.current?.hide?.(); } catch {}
      try { upRef.current?.dispose?.(); } catch {}
      cancelRejectRef.current(new Error('CANCELLED_BY_USER'));
      cancelRejectRef.current = null;
    } else {
      // Cancelled while the checkout was still loading.
      sessionCreatedRef.current = false;
      isProcessingRef.current = false;
      setIsProcessing(false);
      setError('You cancelled the payment.');
      releasePayment('cancelled');
    }
  };

  // While a payment is in progress, block every page interaction. Any click
  // outside the Cybersource UI asks the user whether they want to cancel, so
  // the payment can never be dismissed by an accidental click. Clicks inside
  // the Cybersource sidebar iframe never reach this page, and the in-page
  // payment buttons are explicitly allowed.
  const paymentLocked = (isProcessing || showCheckout) && !error;
  useEffect(() => {
    if (!paymentLocked) return;

    const isAllowed = (t: HTMLElement | null) =>
      !!t?.closest('#unified-checkout-buttons') ||
      !!t?.closest('#payment-cancel-confirm') ||
      !!t?.closest('#payment-cancel-backdrop');

    const onClick = (e: MouseEvent) => {
      if (isAllowed(e.target as HTMLElement)) return;
      e.preventDefault();
      e.stopPropagation();
      setConfirmCancel(true);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setConfirmCancel(true);
      }
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = '';
    };
  }, [paymentLocked]);

  const verifyPayment = async (paymentResult: any, orderId: string) => {
    setIsProcessing(true);
    setShowCheckout(false);
    try {
      // In a full integration, you would send paymentResult to your backend
      // to finalize the capture/authorization with the token.
      // For now, assume webhook handles fulfillment or backend verifies.
      
      const res = await fetch('/api/unified-checkout-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: 'success',
          paymentResult,
        }),
      });

      if (res.ok) {
        window.location.href = `/payment/success?order_id=${orderId}`;
      } else {
        window.location.href = `/payment/failed?order_id=${orderId}`;
      }
    } catch (err) {
      setError('Failed to verify payment.');
      setIsProcessing(false);
    }
  };

  const debouncedCreateSession = useCallback(
    debounce(createSession, 1000),
    []
  );

  useEffect(() => {
    debouncedCreateSession(bookingData);
  }, [bookingData, debouncedCreateSession]);

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-sm border border-gray-100">
        {isProcessing && !showCheckout ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-800">
              Initializing payment gateway...
            </p>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Please wait while we securely connect.
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-bold mt-2">Payment Failed</h3>
            </div>
            <p className="text-gray-700 mb-2">{error}</p>
            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setShowPayment(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : null}

        {/* Cybersource renders the payment-method buttons here; the form
            opens in a hosted sidebar overlay */}
        <div
          id="unified-checkout-buttons"
          className={showCheckout ? 'block min-h-[60px]' : 'hidden'}
        />

      </div>

      {/* Cancel-payment confirmation */}
      {confirmCancel && (
        <div
          id="payment-cancel-backdrop"
          className="fixed inset-0 z-[99998] bg-black/50 flex items-center justify-center px-4"
          onClick={() => setConfirmCancel(false)}
        >
          <div
            id="payment-cancel-confirm"
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900">Cancel payment?</h3>
            <p className="mt-3 text-gray-600">
              A payment is currently in progress. If you cancel now, this booking will not be paid and your seats may be released.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => setConfirmCancel(false)}
                className="px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
              >
                Continue Paying
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-3 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors font-semibold"
              >
                Yes, Cancel Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}