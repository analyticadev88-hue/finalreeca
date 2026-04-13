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
  consultantId?: string; // <-- Add this line
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
  const isProcessingRef = useRef(false);

  const createSession = async (paymentData: BookingData) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    try {
      // Attempt to reserve seats optimistically for this orderId
      try {
        const seatsToReserve = paymentData.selectedSeats || paymentData.departureSeats || [];
        const res = await fetch('/api/reserve-seat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripId: paymentData.tripId, seats: seatsToReserve, reservedBy: paymentData.orderId }),
        });
        if (res.status === 409) {
          const err = await res.json();
          const msg = err?.error || 'Selected seats are no longer available.';
          setError(msg);
          setIsProcessing(false);
          isProcessingRef.current = false;
          if (onReservationConflict) onReservationConflict(msg);
          return;
        }
        if (!res.ok) {
          const err = await res.json();
          setError(err?.error || 'Failed to reserve seats. Please try again.');
          setIsProcessing(false);
          isProcessingRef.current = false;
          return;
        }
      } catch (err) {
        console.warn('Reservation call failed, proceeding without reservation', err);
      }

      // If payment mode is Reservation Paid (client already paid) or Cash (agent collected), skip DPO and mark as paid.
      // Bank Deposit should NOT be treated as paid — it requires confirmation and possibly manual reconciliation.
      if (paymentData.paymentMode === "Reservation Paid" || paymentData.paymentMode === "Cash") {
        const response = await fetch('/api/create-dpo-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...paymentData, skipDPO: true }),
        });
        const data = await response.json();
        if (data.success && data.orderId) {
          // Redirect to the ticket page for download/print
          window.location.href = `/ticket/${data.orderId}`;
          return;
        } else {
          setError(data.error || 'Failed to create booking. Please try again.');
          setIsProcessing(false);
        }
        return;
      }

      // Prepare DPO request with all booking data, including both seat arrays
      const requestData = {
        ...paymentData,
        departureSeats: paymentData.departureSeats,
        returnSeats: paymentData.returnSeats,
      };

      // Call DPO session API
      const response = await fetch('/api/create-dpo-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      const data = await response.json();
      console.log('DPO payment API response:', data);
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create DPO session. Please try again.');
        // release reservation if API indicates failure
        try {
          await fetch('/api/release-reservation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tripId: paymentData.tripId, reservedBy: paymentData.orderId }),
          });
        } catch (e) {
          console.warn('Failed to release reservations after DPO failure', e);
        }
        setIsProcessing(false);
      }
    } catch (err) {
      setError('An unexpected error occurred during payment processing');
      setIsProcessing(false);
      console.error('Payment initiation failed:', err);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const debouncedCreateSession = useCallback(
    debounce(createSession, 1000),
    []
  );

  useEffect(() => {
    // Log for debugging
    console.log('Booking data passengers:', bookingData.passengers);
    console.log('Departure passengers:', bookingData.passengers.filter(p => !p.isReturn));
    console.log('Return passengers:', bookingData.passengers.filter(p => p.isReturn));
    // Ensure both seat arrays are sent
    debouncedCreateSession(bookingData);
  }, [bookingData, debouncedCreateSession]);

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      <div className="p-6 max-w-md mx-auto bg-white rounded-lg">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-800">
              Redirecting to payment gateway...
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Please wait while we connect to our secure payment processor
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
            <p className="text-sm text-gray-600 mb-6">
              Please try again or contact support if the problem persists
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowPayment(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}