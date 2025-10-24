'use client';
import React, { useEffect, useState } from 'react';
import PassengerDetailsForm from '@/app/booking/passengerdetails/page';
import { useRouter, useParams } from 'next/navigation';
import { boardingPoints } from '@/lib/data';

export default function AdminPassengerDetails() {
  const { id } = useParams() as { id?: string };
  const idStr = id || '';
  const [reservation, setReservation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reservations/${idStr}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setReservation(data);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    }
    if (idStr) load();
  }, [idStr]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!reservation) return <div className="p-4 text-red-600">Reservation not found</div>;

  const departureBus = {
    id: reservation.trip?.id,
    routeName: reservation.trip?.routeName,
    routeOrigin: reservation.trip?.routeOrigin,
    routeDestination: reservation.trip?.routeDestination,
    fare: reservation.trip?.fare ?? 0,
    departureDate: reservation.trip?.departureDate,
    departureTime: reservation.trip?.departureTime,
    totalSeats: reservation.trip?.totalSeats || 57,
  };
  const departureSeats = reservation.seatReservations?.map((s: any) => s.seatNumber) || [];
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
      <h1 className="text-xl font-semibold mb-4">Admin: Add Passenger Details</h1>
      <div className="mb-4 p-3 rounded border-l-4 border-yellow-400 bg-yellow-50 text-sm text-yellow-800">
        This reservation holds <strong>{departureSeats.length}</strong> seat(s): {departureSeats.join(', ')}. These seats are reserved for the client and will be consumed when the booking is completed.
      </div>
      <PassengerDetailsForm
        departureBus={departureBus}
        returnBus={null}
        departureSeats={departureSeats}
        returnSeats={[]}
        passengerGroups={passengerGroups}
        searchData={searchData}
        boardingPoints={boardingPoints}
        onProceedToPayment={() => { setShowPayment(true); }}
        showPayment={showPayment}
        setShowPayment={(v: boolean) => setShowPayment(v)}
        onPaymentComplete={async () => { /* After admin completes payment, mark reservation converted via API */ }}
        departureNeighbourFree={false}
        returnNeighbourFree={false}
        initialPaymentMode={'Bank Deposit'}
      />
    </div>
  );
}
