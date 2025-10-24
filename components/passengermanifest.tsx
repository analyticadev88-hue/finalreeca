// components/PassengerManifest.tsx
import React from 'react';

interface Passenger {
  name: string;
  seat: string;
  title?: string;
  isReturn?: boolean; // Assuming isReturn is a boolean indicating return trip
  boarded?: boolean; // Assuming boarded is a boolean indicating if the passenger has boarded
}

interface PassengerManifestProps {
  passengers: Passenger[];
  tripType: 'departure' | 'return';
}

export const PassengerManifest: React.FC<PassengerManifestProps> = ({ passengers, tripType }) => {
  const filteredPassengers = passengers.filter(p => {
    if (typeof p.isReturn === 'boolean') {
      return tripType === 'departure' ? !p.isReturn : p.isReturn;
    }
    // fallback: if no isReturn, show all
    return true;
  });

  return (
    <div className="overflow-x-auto">
      <h3 className="font-bold text-gray-800 mb-2">
        Passenger Manifest ({tripType})
      </h3>
      <table className="min-w-full border border-gray-200 rounded">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">#</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Name</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Seat</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Title</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Boarded</th>
          </tr>
        </thead>
        <tbody>
          {filteredPassengers.length > 0 ? (
            filteredPassengers.map((passenger, idx) => (
              <tr key={idx} className="border-t border-gray-100">
                <td className="px-3 py-2 text-xs">{idx + 1}</td>
                <td className="px-3 py-2 text-xs">{passenger.name}</td>
                <td className="px-3 py-2 text-xs font-bold">{passenger.seat}</td>
                <td className="px-3 py-2 text-xs">{passenger.title}</td>
                <td className="px-3 py-2 text-xs">{passenger.boarded ? "Yes" : "No"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-3 py-2 text-xs text-gray-500 text-center">
                No passenger data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
