import React, { useEffect } from 'react';
import { PrintableTicket, BookingData } from './printable-ticket';

interface TicketContainerProps {
  bookingData: BookingData;
}

export const TicketContainer: React.FC<TicketContainerProps> = ({ bookingData }) => {
  useEffect(() => {
    console.log("\n===== [TICKET CONTAINER] RECEIVED DATA =====");
    console.log("Booking Reference:", bookingData.bookingRef);
    console.log("Passenger Count:", bookingData.passengers?.length || 0);
    console.log("Departure Trip:", bookingData.departureTrip.route);
    console.log("Return Trip:", bookingData.returnTrip?.route || "N/A");
    console.log("Emergency Contact:", bookingData.emergencyContact);
    console.log("Contact Details:", bookingData.contactDetails);
    console.log("==========================================\n");
  }, [bookingData]);

  const departurePassengers = bookingData.passengers?.filter(p => !p.isReturn) || [];
  const returnPassengers = bookingData.passengers?.filter(p => p.isReturn) || [];
  
  return (
    <div className="print-container">
      <PrintableTicket 
        bookingData={{
          ...bookingData,
          departureTrip: {
            ...bookingData.departureTrip,
            passengers: departurePassengers
          },
          returnTrip: bookingData.returnTrip ? {
            ...bookingData.returnTrip,
            passengers: returnPassengers
          } : undefined
        }}
      />
      
      {bookingData.returnTrip && (
        <div className="mt-12">
          <PrintableTicket 
            bookingData={{
              ...bookingData,
              departureTrip: bookingData.returnTrip,
              returnTrip: undefined,
              passengers: returnPassengers
            }}
          />
        </div>
      )}
      
      <div className="mt-8 text-center no-print">
        <button
          onClick={() => window.print()}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg"
        >
          Print Ticket(s)
        </button>
      </div>

      <style jsx>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-container > div {
            page-break-after: always;
          }
          .mt-12 {
            margin-top: 0;
          }
        }
      `}</style>
    </div>
  );
};