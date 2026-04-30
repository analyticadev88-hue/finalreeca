import React, { useEffect } from 'react';

interface Passenger {
  name: string;
  seat: string;
  title?: string;
  isReturn?: boolean;
  hasInfant?: boolean;
  infantBirthdate?: string;
  infantName?: string;
  infantPassportNumber?: string;
  birthdate?: string;
  passportNumber?: string;
  type?: "adult" | "child";
}

interface TripData {
  route: string;
  date: string | Date;
  time: string;
  bus: string;
  boardingPoint: string;
  droppingPoint: string;
  seats: string[];
  passengers: Passenger[];
}

interface BookingData {
  bookingRef: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: string;
  departureTrip: TripData;
  returnTrip?: TripData;
  addons?: { name: string; details?: string; price?: string }[];
  contactDetails?: {
    name: string;
    email: string;
    mobile: string;
    alternateMobile?: string;
    idType?: string;
    idNumber?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
  };
  passengers?: Passenger[];
}

interface PrintableTicketProps {
  bookingData: BookingData;
}

export const PrintableTicket: React.FC<PrintableTicketProps> = ({ bookingData }) => {
  useEffect(() => {
    console.log("\n===== [TICKET] RENDERING TICKET =====");
    console.log("Booking data received:", JSON.stringify(bookingData, null, 2));
    console.log("Passengers:", bookingData.passengers?.length || 0);
    console.log("Departure trip passengers:", bookingData.departureTrip?.passengers?.length || 0);
    console.log("Return trip passengers:", bookingData.returnTrip?.passengers?.length || 0);
    console.log("Addons:", bookingData.addons?.length || 0);
    console.log("Emergency contact:", bookingData.emergencyContact);
    console.log("Contact details:", bookingData.contactDetails);
    console.log("====================================\n");
  }, []);

  const formatDate = (dateInput: Date | string | undefined, formatStr: string) => {
    if (!dateInput) return "N/A";
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (!(date instanceof Date) || isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      weekday: formatStr.includes("EEEE") ? "long" : undefined,
      month: formatStr.includes("MMMM")
        ? "long"
        : formatStr.includes("MMM")
        ? "short"
        : undefined,
      day: formatStr.includes("dd") ? "2-digit" : undefined,
      year: formatStr.includes("yyyy") ? "numeric" : undefined,
    });
  };

  const renderTripSection = (trip: TripData, label: string) => {
    if (!trip) return null;
    const sortedPassengers = [...trip.passengers].sort((a, b) => {
      const numA = parseInt(a.seat.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.seat.match(/\d+/)?.[0] || "0");
      if (numA !== numB) return numA - numB;
      return a.seat.localeCompare(b.seat);
    });
    const sortedSeats = [...trip.seats].sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
    
    const boardingPoint = trip.boardingPoint?.toUpperCase() || 'N/A';
    const droppingPoint = trip.droppingPoint?.toUpperCase() || 'N/A';
    
    return (
      <div className="mb-8">
        <div className="bg-gray-100 p-2 mb-2">
          <h3 className="font-bold text-gray-800">{label} Trip Details</h3>
        </div>
        <div className="border border-gray-300 rounded-lg p-3 md:p-4 mb-4">
          <div className="font-semibold text-gray-800 text-base md:text-lg mb-1 md:mb-2">
            BUS TICKET - {trip.route}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
            <div>
              <p>
                <strong>Date:</strong> {formatDate(trip.date, "EEEE, MMMM dd, yyyy")}
              </p>
              <p>
                <strong>Time:</strong> {trip.time}
              </p>
              <p>
                <strong>Bus:</strong> {trip.bus}
              </p>
            </div>
            <div>
              <p>
                <strong>Boarding:</strong> {boardingPoint}
              </p>
              <p>
                <strong>Dropping:</strong> {droppingPoint}
              </p>
              <p>
                <strong>Seats:</strong> {sortedSeats.join(", ")}
              </p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto mb-4">
          <table className="min-w-full border border-gray-200 rounded text-xs md:text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 md:px-3 py-1 md:py-2 text-left font-semibold text-gray-700">#</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left font-semibold text-gray-700">Name</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left font-semibold text-gray-700">Seat</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left font-semibold text-gray-700">Title</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left font-semibold text-gray-700">Type</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left font-semibold text-gray-700">Infant</th>
                <th className="px-2 md:px-3 py-1 md:py-2 text-left font-semibold text-gray-700">Passport</th>
              </tr>
            </thead>
            <tbody>
              {sortedPassengers.length > 0 ? (
                sortedPassengers.map((passenger, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="px-2 md:px-3 py-1 md:py-2">{idx + 1}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{passenger.name}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2 font-bold">{passenger.seat}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{passenger.title || 'Mr'}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">{passenger.type === "child" ? "Child" : "Adult"}</td>
                    <td className="px-2 md:px-3 py-1 md:py-2">
                      {passenger.hasInfant ? (
                        <div className="text-xs">
                          <div><span className="font-semibold">Infant:</span> {passenger.infantName}</div>
                          <div><span className="font-semibold">DOB:</span> {passenger.infantBirthdate}</div>
                          <div><span className="font-semibold">Passport:</span> {passenger.infantPassportNumber}</div>
                        </div>
                      ) : "No"}
                    </td>
                    <td className="px-2 md:px-3 py-1 md:py-2">
                      {passenger.passportNumber || "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-2 md:px-3 py-1 md:py-2 text-gray-500 text-center">
                    No passenger data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-3 md:gap-4 mt-2 md:mt-4 text-xs md:text-sm text-gray-600">
          <span>
            Passengers: <span className="font-semibold">{sortedPassengers.length}</span>
          </span>
          <span>
            Seats: <span className="font-semibold">{sortedSeats.join(", ")}</span>
          </span>
          <span>
            Status: <span className="font-semibold text-green-600">{bookingData.bookingStatus}</span>
          </span>
          <span>
            Date Issued: <span className="font-semibold">{formatDate(new Date(), "dd MMM yyyy")}</span>
          </span>
        </div>
      </div>
    );
  };

  const qrData = {
    ref: bookingData.bookingRef,
    name: bookingData.userName,
    trips: [bookingData.departureTrip, bookingData.returnTrip]
      .filter((trip): trip is TripData => !!trip)
      .map(trip => ({
        route: trip.route,
        date: trip.date instanceof Date ? trip.date.toISOString() : trip.date,
        time: trip.time,
        seats: trip.seats,
        passengers: trip.passengers.map(p => ({
          name: p.name,
          seat: p.seat,
          type: p.type,
          hasInfant: p.hasInfant,
        })),
      })),
    amount: bookingData.totalAmount,
    type: bookingData.returnTrip ? "Roundtrip" : "Departure",
    addons: bookingData.addons || [],
  };

  const qrString = JSON.stringify(qrData);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrString)}`;

  return (
    <div
      className="printable-ticket max-w-[700px] w-full mx-auto bg-white p-6 md:p-8 font-sans mb-8 border border-gray-200 rounded-lg shadow-lg"
      style={{ boxSizing: 'border-box' }}
    >
      <style>{`
        @media print {
          body {
            background: #fff !important;
          }
          .printable-ticket {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
            margin: 0 auto !important;
            max-width: 700px !important;
            width: 100% !important;
            padding: 0.5in 0.3in !important;
            page-break-after: always;
          }
          .printable-ticket * {
            color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
      <div className="flex justify-between items-start mb-6 md:mb-8 border-b pb-6 border-gray-200">
        <div className="flex items-center">
          <div className="mr-4">
            <img 
              src="/images/reeca-travel-logo.png" 
              alt="REECA TRAVEL Logo"
              className="h-16 md:h-20 object-contain"
            />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-1 uppercase">REECA TRAVEL</h3>
            <div className="text-xs md:text-sm text-gray-600 space-y-0.5">
              <p className="uppercase">GABORONE CBD</p>
              <p className="uppercase">MOGOBE PLAZA</p>
              <p className="uppercase">GABORONE SOUTH-EAST</p>
              <p className="uppercase">BOTSWANA</p>
              <p>+26773061124</p>
              <p>tickets@reecatravel.co.bw</p>
              <p>www.reecabus.co.bw</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1 md:mb-2 uppercase">BUS TICKET</h2>
          <p className="text-base md:text-lg font-semibold text-teal-600">#{bookingData.bookingRef}</p>
          <p className="text-xs md:text-sm font-medium text-gray-700 mt-1 uppercase">
            {bookingData.returnTrip ? "ROUNDTRIP" : "DEPARTURE TRIP"}
          </p>
        </div>
      </div>
      
      <div className="mb-6 md:mb-8">
        <h3 className="font-bold text-gray-800 mb-3 text-lg">
          Passenger Manifest
        </h3>
        <div className="flex flex-col gap-6">
          {renderTripSection(bookingData.departureTrip, "Departure")}
          {bookingData.returnTrip && renderTripSection(bookingData.returnTrip, "Return")}
        </div>
      </div>
      
      <div className="mb-6 md:mb-8">
        <div className="bg-gray-100 p-3 mb-4">
          <h3 className="font-bold text-gray-800 uppercase">Payment Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <div className="mb-2">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-bold text-gray-800 ml-2 uppercase">{bookingData.paymentMethod}</span>
            </div>
            <div className="mb-2">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-bold text-teal-700 ml-2 uppercase">P {bookingData.totalAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Payment Status:</span>
              <span
                className={`font-bold ml-2 ${
                  bookingData.paymentStatus === "paid"
                    ? "text-green-600"
                    : "text-red-600"
                } uppercase`}
              >
                {bookingData.paymentStatus}
              </span>
            </div>
          </div>
          <div>
            <div>
              <span className="text-gray-600">Booking Status:</span>
              <span className="font-bold text-green-600 ml-2 uppercase">
                {bookingData.bookingStatus}
              </span>
            </div>
          </div>
        </div>
        
        {/* Updated Banking Details Section */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase">Banking Details</h4>
          <div className="text-sm space-y-2">
            <div className="flex">
              <div className="w-32 font-bold text-gray-800 uppercase">BANK:</div>
              <div className="font-bold text-gray-800 uppercase">ABSA BANK</div>
            </div>
            <div className="flex">
              <div className="w-32 font-bold text-gray-800 uppercase">ACCOUNT NAME:</div>
              <div className="text-gray-700 uppercase">AFRICAN TASTES PTY LTD</div>
            </div>
            <div className="flex">
              <div className="w-32 font-bold text-gray-800 uppercase">ACCOUNT NUMBER:</div>
              <div className="font-bold text-gray-800">2616058</div>
            </div>
            <div className="flex">
              <div className="w-32 font-bold text-gray-800 uppercase">BRANCH:</div>
              <div className="font-bold text-gray-800 uppercase">MALL BRANCH (290167)</div>
            </div>
            <div className="flex">
              <div className="w-32 font-bold text-gray-800 uppercase">SWIFT CODE:</div>
              <div className="font-bold text-gray-800 uppercase">BARCBWGX</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-6 md:mb-8">
        <div className="bg-gray-100 p-3 mb-4">
          <h3 className="font-bold text-gray-800 uppercase">Cardholder & Emergency Contact</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">Name:</span>
              <span className="font-bold text-gray-800 ml-2">
                {bookingData.contactDetails?.name || bookingData.userName}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <span className="font-bold text-gray-800 ml-2">
                {bookingData.contactDetails?.email || bookingData.userEmail}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Mobile:</span>
              <span className="font-bold text-gray-800 ml-2">
                {bookingData.contactDetails?.mobile || bookingData.userPhone || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">ID Type:</span>
              <span className="font-bold text-gray-800 ml-2 uppercase">
                {bookingData.contactDetails?.idType || "PASSPORT"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">ID Number:</span>
              <span className="font-bold text-gray-800 ml-2">
                {bookingData.contactDetails?.idNumber || "-"}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-gray-600">Emergency Name:</span>
              <span className="font-bold text-gray-800 ml-2">
                {bookingData.emergencyContact?.name || "-"}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Emergency Phone:</span>
              <span className="font-bold text-gray-800 ml-2">
                {bookingData.emergencyContact?.phone || "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {bookingData.addons && bookingData.addons.length > 0 && (
        <div className="mb-6 md:mb-8">
          <div className="bg-gray-100 p-3 mb-4">
            <h3 className="font-bold text-gray-800 uppercase">Add-ons</h3>
          </div>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            {bookingData.addons.map((addon, idx) => (
              <li key={idx}>
                {addon.name} {addon.details ? `- ${addon.details}` : ""} {addon.price ? `(${addon.price})` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div>
          <div className="bg-gray-100 p-3 mb-4">
            <h3 className="font-bold text-gray-800 uppercase">Important Notes</h3>
          </div>
          <div className="text-xs text-gray-700 space-y-1.5">
            <p>• Please arrive at the boarding point 15 minutes before departure time</p>
            <p>• Valid Passport required for boarding</p>
            <p>• No refunds for no-shows</p>
            <p>• Baggage allowance: 20kg per passenger</p>
            <p>• Present this ticket (digital or printed) at boarding</p>
          </div>
          <div className="mt-6">
            <div className="bg-gray-100 p-3 mb-4">
              <h3 className="font-bold text-gray-800 uppercase">Terms & Conditions</h3>
            </div>
            <p className="text-xs text-gray-700">
              Ticket is valid only for the specified date, time, and route. Changes subject to
              availability and additional charges may apply.
            </p>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-gray-100 p-3 mb-4">
            <h3 className="font-bold text-gray-800 uppercase">Booking QR Code</h3>
          </div>
          <div className="flex justify-center mb-4">
            <div className="border-2 border-gray-300 p-4 rounded-lg bg-white">
              <img src={qrCodeUrl} alt="Booking QR Code" className="w-24 h-24 md:w-32 md:h-32" />
            </div>
          </div>
          <p className="text-xs text-gray-600">Scan this QR code for quick verification</p>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-300 text-center text-xs text-gray-600">
        <p>Thank you for choosing REECA TRAVEL for your journey!</p>
        <p>For support, contact us at +26777655348 or tickets@reecatravel.co.bw</p>
      </div>
    </div>
  );
};

export type { BookingData };