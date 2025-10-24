"use client";
import React, { useEffect, useState } from 'react';
import PassengerDetailsForm from '@/app/booking/passengerdetails/page';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { boardingPoints } from '@/lib/data';

export default function ReservationEntry() {
  const { token } = useParams() as { token?: string };
  const tokenStr = token || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<any | null>(null);
  const [prepaid, setPrepaid] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reservations/consume/${tokenStr}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message || 'Invalid or expired link');
        }
        const data = await res.json();
        setReservation(data.reservation);
        setPrepaid(!!data.prepaid);
      } catch (err: any) {
        setError(err.message || 'Failed to load reservation');
      } finally {
        setLoading(false);
      }
    }
    if (tokenStr) load();
  }, [tokenStr]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-md">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-[rgb(0,153,153)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </div>
        <p className="mt-4 text-gray-700 text-sm">Loading reservation.</p>
      </div>
    </div>
  );
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!reservation) return <div className="p-8">Reservation not found</div>;

  // Map reservation to PassengerDetailsForm props
  const departureBus = {
    id: reservation.trip?.id,
    routeName: reservation.trip?.routeName || reservation.trip?.routeName,
    routeOrigin: reservation.trip?.routeOrigin || reservation.trip?.routeOrigin,
    routeDestination: reservation.trip?.routeDestination || reservation.trip?.routeDestination,
    departureDate: reservation.trip?.departureDate,
    departureTime: reservation.trip?.departureTime,
    fare: reservation.trip?.fare ?? 0,
    totalSeats: reservation.trip?.totalSeats || 57,
  };

  const departureSeats = reservation.reservedSeatNumbers || [];
  const passengerGroups = departureSeats.map((s: string) => ({ primarySeat: s, isNeighbourFree: false }));

  const searchData = {
    from: reservation.trip?.routeOrigin || '',
    to: reservation.trip?.routeDestination || '',
    departureDate: reservation.trip?.departureDate || new Date().toISOString(),
    returnDate: null,
    seats: departureSeats.length,
    isReturn: false,
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Complete your booking</h1>
      {/* If the reservation was prepaid we don't show a separate complete button here —
          user should add passenger details and proceed. We will prefill the payment mode
          as Bank Deposit so the booking is created as paid on the server. */}

      <PassengerDetailsForm
        departureBus={departureBus}
        returnBus={null}
        departureSeats={departureSeats}
        returnSeats={[]}
        passengerGroups={passengerGroups}
        searchData={searchData}
        boardingPoints={boardingPoints}
  onProceedToPayment={() => setShowPayment(true)}
        showPayment={showPayment}
        setShowPayment={(v: boolean) => setShowPayment(v)}
        onPaymentComplete={async () => {
          // After payment completes, mark reservation as converted on the server
          try {
      await fetch('/api/reservations/complete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: tokenStr }) });
          } catch (err) {
            console.error('Failed to mark reservation complete', err);
          }
        }}
        departureNeighbourFree={false}
        returnNeighbourFree={false}
  reservationToken={tokenStr}
        // If the reservation link was prepaid (client already paid), set the form to 'Reservation Paid'
        // so the booking is created immediately without an external payment. Do NOT treat Bank Deposit as paid here.
        initialPaymentMode={prepaid ? 'Reservation Paid' : undefined}
        allowedPaymentModes={prepaid ? ['Reservation Paid','Credit Card','Bank Deposit','Cash','Free Voucher'] : undefined}
      />
    </div>
  );
}
