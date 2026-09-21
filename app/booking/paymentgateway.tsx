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
  const isProcessingRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sessionCreatedRef = useRef(false);

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
      const accept = new w.Accept(captureContext);
      const up = accept.unifiedPayments();

      setIsProcessing(false);
      setShowCheckout(true);
      // Let the containers become visible before the library measures them
      await new Promise((resolve) => setTimeout(resolve, 50));

      const tt = await up.show({
        containers: {
          paymentSelection: '#unified-checkout-buttons',
          paymentScreen: '#unified-checkout-container',
        },
      });
      const completeResponse = await up.complete(tt);

      await verifyPayment(completeResponse, orderId);
    } catch (err: any) {
      console.error('Unified Checkout Error:', err?.reason, err?.message, err);
      setError('Payment was cancelled or could not be completed. Please try again.');
      setShowCheckout(false);
      setIsProcessing(false);
    }
  };

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

        {/* Cybersource renders the payment-method buttons here */}
        <div
          id="unified-checkout-buttons"
          className={showCheckout ? 'block' : 'hidden'}
        />

        {/* Cybersource renders the embedded payment form here */}
        <div 
          id="unified-checkout-container" 
          ref={containerRef}
          className={showCheckout ? 'block min-h-[400px]' : 'hidden'}
        />

      </div>
    </div>
  );
}