'use client'
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Loader2, Bus, UserPlus, X, Users, Clock, MapPin } from "lucide-react";
import { SearchData } from "@/lib/types";
import Image from "next/image";

interface Seat {
  id: string;
  number: string;
  isAvailable: boolean;
  isSelected: boolean;
  row: number;
  position: string;
  side: string;
  seatIndex: number;
  vehicleId?: number;
  displayNumber?: string;
}

interface SelectedBus {
  id: string;
  serviceType?: string;
  routeName?: string;
  routeOrigin?: string;
  routeDestination?: string;
  departureDate?: Date;
  departureTime: string;
  totalSeats?: number;
  availableSeats?: number;
  occupiedSeats?: string | null;
  tempLockedSeats?: string | null;
  fare: number;
  promoActive?: boolean;
  promoPrice?: number;
  durationMinutes?: number;
  replacementVehicles?: any;
  vehicleCount?: number;
}

interface SeatSelectionProps {
  selectedBus: SelectedBus;
  onSeatSelect: (seatId: string, vehicleId?: number) => void;
  selectedSeats: string[];
  onProceed: () => void;
  searchData: SearchData;
  isReturnTrip?: boolean;
  maxSelectableSeats?: number;
  travelNeighbourFree?: boolean;
  setTravelNeighbourFree?: (val: boolean) => void;
}

interface ReplacementVehicle {
  id: number;
  name: string;
  type: string;
  seats: number;
  totalSeats: number;
}

interface PassengerGroup {
  primarySeat: string;
  companionSeat?: string;
  isNeighbourFree: boolean;
}

const colors = {
  primary: 'rgb(0,153,153)',
  secondary: '#FDBE00',
  lightYellow: '#FDBE00',
  newyeloo: '#FFD700',
  accent: '#958c55',
  dark: '#1a1a1a',
};

const morningBusImg = "/images/nbg.webp";
const afternoonBusImg = "/images/nbg.webp";

const fetchTripBookings = async (tripId: string) => {
  try {
    const response = await fetch(`/api/trips/${tripId}/bookings`);
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return await response.json();
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { bookings: [], trip: null, reservedSeatNumbers: [] };
  }
};

// Convert old seat format (e.g., "3C") to new numeric format (1-57)
const convertOldSeatToNew = (oldSeatId: string): string | null => {
  const match = oldSeatId.match(/^(\d+)([A-D])$/);
  if (!match) return null;
  
  const row = parseInt(match[1]);
  const letter = match[2];
  
  // Mapping: for row r, the new IDs are:
  // A (left window) = 4r-1
  // B (left aisle) = 4r
  // C (right aisle) = 4r-2
  // D (right window) = 4r-3
  
  let newId: number;
  switch (letter) {
    case 'A': newId = 4 * row - 1; break;
    case 'B': newId = 4 * row; break;
    case 'C': newId = 4 * row - 2; break;
    case 'D': newId = 4 * row - 3; break;
    default: return null;
  }
  
  return String(newId);
};

// Convert array of old seat IDs to new format
const convertOldSeatsToNew = (oldSeats: string[]): string[] => {
  return oldSeats
    .map(seat => {
      const converted = convertOldSeatToNew(seat);
      return converted !== null ? converted : seat; // Return as-is if not old format
    });
};

const SCANIA_ROW_DEFS = (() => {
  const defs: Array<{
    lw?: number; la?: number; ra?: number; rw?: number;
    leftWC?: boolean; back?: number[];
  }> = [];

  // Rows 1-5  →  seats 1-20  (4 per row)
  // Pattern per row r (1-based):  lw=4r-1, la=4r, ra=4r-2, rw=4r-3
  for (let r = 1; r <= 5; r++) {
    defs.push({ lw: 4*r-1, la: 4*r, ra: 4*r-2, rw: 4*r-3 });
  }
  // Row 6  →  WC on left, seats 21-22 on right
  defs.push({ leftWC: true, ra: 22, rw: 21 });
  // Row 7  →  WC on left, seats 23-24 on right
  defs.push({ leftWC: true, ra: 24, rw: 23 });

  // Rows 8-14  →  seats 25-52  (7 rows × 4 = 28 seats)
  // Left resumes at 25; right resumes at 27 (25,26 belong to left)
  for (let i = 0; i < 7; i++) {
    const base = 25 + i * 4;
    defs.push({ lw: base, la: base+1, ra: base+3, rw: base+2 });
  }

  // Back row  →  seats 53-57
  defs.push({ back: [53, 54, 55, 56, 57] });

  return defs;
})();

const generateRegularBusSeatLayout = (
  totalSeats: number = 57,
  occupiedSeats: string[] = [],
  bookedSeats: string[] = []
): Seat[] => {
  // Convert old seat format to new numeric format
  const convertedOccupied = convertOldSeatsToNew(occupiedSeats);
  const convertedBooked = convertOldSeatsToNew(bookedSeats);
  const unavailable = new Set([...convertedOccupied, ...convertedBooked]);
  const seats: Seat[] = [];

  SCANIA_ROW_DEFS.forEach((rd, rowIndex) => {
    const rowNum = rowIndex + 1;

    if (rd.back) {
      rd.back.forEach((n, i) => {
        const id = String(n);
        seats.push({
          id, number: id,
          isAvailable: !unavailable.has(id),
          isSelected: false,
          row: rowNum, position: 'back', side: 'back',
          seatIndex: n - 1,
        });
      });
      return;
    }

    if (rd.leftWC) {
      // No seat objects for WC rows on left – right side only
    } else if (rd.lw != null && rd.la != null) {
      ([
        [rd.lw, 'lw', 'left'],
        [rd.la, 'la', 'left'],
      ] as [number, string, string][]).forEach(([n, pos, side]) => {
        const id = String(n);
        seats.push({ id, number: id, isAvailable: !unavailable.has(id), isSelected: false, row: rowNum, position: pos, side, seatIndex: n - 1 });
      });
    }

    if (rd.ra != null && rd.rw != null) {
      ([
        [rd.ra, 'ra', 'right'],
        [rd.rw, 'rw', 'right'],
      ] as [number, string, string][]).forEach(([n, pos, side]) => {
        const id = String(n);
        seats.push({ id, number: id, isAvailable: !unavailable.has(id), isSelected: false, row: rowNum, position: pos, side, seatIndex: n - 1 });
      });
    }
  });

  return seats;
};

const generateVehicleSeatLayout = (
  vehicleId: number,
  startSeatIndex: number,
  occupiedSeats: string[] = [],
  bookedSeats: string[] = []
): Seat[] => {
  const seats: Seat[] = [];
  // Vehicle seat IDs (V1-2A format) don't need conversion - use directly
  const unavailableSeats = new Set([...occupiedSeats, ...bookedSeats]);
  let globalSeatNumber = startSeatIndex + 1;

  const layout = [
    [{ position: 'A', side: 'driver' }, { position: 'B', side: 'front' }],
    [
      { position: 'A', side: 'left' },
      { position: 'B', side: 'left' },
      { position: 'C', side: 'right' },
      { position: 'D', side: 'right' }
    ],
    [
      { position: 'A', side: 'left' },
      { position: 'B', side: 'left' },
      { position: 'C', side: 'right' },
      { position: 'D', side: 'right' }
    ],
    [
      { position: 'A', side: 'left' },
      { position: 'B', side: 'left' },
      { position: 'C', side: 'right' },
      { position: 'D', side: 'right' }
    ]
  ];

  layout.forEach((rowSeats, rowIndex) => {
    rowSeats.forEach((seatConfig) => {
      const seatId = `V${vehicleId}-${rowIndex + 1}${seatConfig.position}`;
      const isAvailable = !unavailableSeats.has(seatId);

      seats.push({
        id: seatId,
        number: `${rowIndex + 1}${seatConfig.position}`,
        displayNumber: `${globalSeatNumber}`,
        isAvailable,
        isSelected: false, // Always initialize as false
        row: rowIndex + 1,
        position: seatConfig.position,
        side: seatConfig.side,
        seatIndex: globalSeatNumber - 1,
        vehicleId
      });

      globalSeatNumber++;
    });
  });

  return seats;
};

export default function SeatSelection({
  selectedBus,
  onSeatSelect,
  selectedSeats,
  onProceed,
  searchData,
  isReturnTrip = false,
  maxSelectableSeats = 60,
  travelNeighbourFree = false,
  setTravelNeighbourFree,
}: SeatSelectionProps) {
  const [seatLayout, setSeatLayout] = useState<Seat[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [highlightedPairs, setHighlightedPairs] = useState<string[]>([]);
  const [showNoAdjacentModal, setShowNoAdjacentModal] = useState(false);
  const [passengerGroups, setPassengerGroups] = useState<PassengerGroup[]>([]);

  const replacementVehicles = React.useMemo((): ReplacementVehicle[] => {
    if (!selectedBus.replacementVehicles) return [];
    try {
      return JSON.parse(selectedBus.replacementVehicles);
    } catch (error) {
      console.error('Error parsing replacement vehicles:', error);
      return [];
    }
  }, [selectedBus.replacementVehicles]);

  const isPrivateTour = replacementVehicles.length > 0 && selectedBus.serviceType === 'Private Tours';

  const getMaxSelectable = () => (travelNeighbourFree ? 2 : (searchData?.seats || maxSelectableSeats));

  const findAllAdjacentSeatPairs = useCallback(() => {
    const pairs: string[][] = [];

    if (isPrivateTour) {
      replacementVehicles.forEach(vehicle => {
        for (let row = 2; row <= 4; row++) {
          const leftPair = [`V${vehicle.id}-${row}A`, `V${vehicle.id}-${row}B`];
          const rightPair = [`V${vehicle.id}-${row}C`, `V${vehicle.id}-${row}D`];

          const checkPair = (pair: string[]) =>
            pair.every(seatId => {
              const seat = seatLayout.find(s => s.id === seatId);
              return seat && seat.isAvailable;
            });

          if (checkPair(leftPair)) pairs.push(leftPair);
          if (checkPair(rightPair)) pairs.push(rightPair);
        }
      });
    } else {
      // Build pairs from SCANIA_ROW_DEFS using numeric seat IDs
      SCANIA_ROW_DEFS.forEach((rd, rowIndex) => {
        const checkPair = (pair: string[]) =>
          pair.every(seatId => {
            const seat = seatLayout.find(s => s.id === seatId);
            return seat && seat.isAvailable;
          });

        // Left side pair (lw, la)
        if (rd.lw != null && rd.la != null) {
          const leftPair = [String(rd.lw), String(rd.la)];
          if (checkPair(leftPair)) pairs.push(leftPair);
        }

        // Right side pair (ra, rw)
        if (rd.ra != null && rd.rw != null) {
          const rightPair = [String(rd.ra), String(rd.rw)];
          if (checkPair(rightPair)) pairs.push(rightPair);
        }
      });
    }

    return pairs;
  }, [seatLayout, replacementVehicles, isPrivateTour]);

  const isAdjacent = (seat1: string | undefined, seat2: string | undefined) => {
    if (!seat1 || !seat2) return false;

    if (isPrivateTour) {
      const seat1Parts = seat1.split('-');
      const seat2Parts = seat2.split('-');

      if (seat1Parts[0] !== seat2Parts[0]) return false;

      const row1 = seat1Parts[1].charAt(0);
      const row2 = seat2Parts[1].charAt(0);
      const pos1 = seat1Parts[1].charAt(1);
      const pos2 = seat2Parts[1].charAt(1);

      return (
        row1 === row2 &&
        ((pos1 === "A" && pos2 === "B") || (pos1 === "C" && pos2 === "D"))
      );
    } else {
      // For numeric seat IDs, check if they form a valid adjacent pair from SCANIA_ROW_DEFS
      const seat1Num = parseInt(seat1);
      const seat2Num = parseInt(seat2);
      if (isNaN(seat1Num) || isNaN(seat2Num)) return false;

      // Check each row definition for valid adjacent pairs
      for (const rd of SCANIA_ROW_DEFS) {
        // Left pair (lw, la)
        if (rd.lw != null && rd.la != null) {
          if ((seat1Num === rd.lw && seat2Num === rd.la) || (seat1Num === rd.la && seat2Num === rd.lw)) {
            return true;
          }
        }
        // Right pair (ra, rw)
        if (rd.ra != null && rd.rw != null) {
          if ((seat1Num === rd.ra && seat2Num === rd.rw) || (seat1Num === rd.rw && seat2Num === rd.ra)) {
            return true;
          }
        }
      }
      return false;
    }
  };

  const loadSeatData = useCallback(async () => {
    setIsLoadingSeats(true);
    setHasError(false);

    try {
      const { bookings, trip, reservedSeatNumbers = [] } = await fetchTripBookings(selectedBus.id);
      const bookedSeats: string[] = bookings
        .filter((booking: any) => {
          return booking.bookingStatus === 'confirmed' &&
            (booking.paymentStatus === 'paid' || booking.paymentStatus === 'pending');
        })
        .flatMap((booking: any) =>
          booking.passengers
            .filter((p: any) => p.isReturn === isReturnTrip)
            .map((p: any) => p.seatNumber)
        );
      const tempLockedSeats: string[] = trip?.tempLockedSeats ? trip.tempLockedSeats.split(',') : [];
      const mergedBookedSeats = Array.from(new Set([...bookedSeats, ...reservedSeatNumbers.filter((s: string) => !!s), ...tempLockedSeats]));

      let occupiedSeats: string[] = [];
      if (selectedBus.occupiedSeats) {
        try {
          occupiedSeats = JSON.parse(selectedBus.occupiedSeats);
        } catch (e) {
          console.error('Error parsing occupied seats:', e);
        }
      }

      let allSeats: Seat[] = [];

      if (isPrivateTour) {
        let currentSeatIndex = 0;
        replacementVehicles.forEach(vehicle => {
          const vehicleSeats = generateVehicleSeatLayout(
            vehicle.id,
            currentSeatIndex,
            occupiedSeats,
            mergedBookedSeats
          );
          allSeats = [...allSeats, ...vehicleSeats];
          currentSeatIndex += vehicle.totalSeats;
        });
      } else {
        allSeats = generateRegularBusSeatLayout(
          selectedBus.totalSeats || 57,
          occupiedSeats,
          mergedBookedSeats
        );
      }

      setSeatLayout(allSeats);
    } catch (error) {
      console.error('Error loading seat data:', error);
      setHasError(true);
    } finally {
      setIsLoadingSeats(false);
    }
  }, [selectedBus.id, selectedBus.occupiedSeats, selectedBus.totalSeats, isReturnTrip, replacementVehicles, isPrivateTour]); // REMOVED selectedSeats from dependencies

  useEffect(() => {
    loadSeatData();
  }, [loadSeatData]);

  useEffect(() => {
    if (travelNeighbourFree && seatLayout.length > 0) {
      const pairs = findAllAdjacentSeatPairs();
      if (pairs.length === 0) {
        setShowNoAdjacentModal(true);
        if (setTravelNeighbourFree) setTravelNeighbourFree(false);
        setHighlightedPairs([]);
      } else {
        const allHighlightedSeats = pairs.flat();
        setHighlightedPairs(allHighlightedSeats);
      }
    } else {
      setHighlightedPairs([]);
    }
  }, [travelNeighbourFree, seatLayout, findAllAdjacentSeatPairs, setTravelNeighbourFree]);

  useEffect(() => {
    const max = getMaxSelectable();
    if (selectedSeats.length > max) {
      selectedSeats.slice(max).forEach(seatId => {
        const seat = seatLayout.find(s => s.id === seatId);
        if (seat) {
          onSeatSelect(seatId, seat.vehicleId);
        }
      });
    }
  }, [travelNeighbourFree, searchData?.seats, selectedSeats.length, seatLayout, onSeatSelect]);

  useEffect(() => {
    const groups: PassengerGroup[] = [];
    const selectedSeatsCopy = [...selectedSeats];

    for (let i = 0; i < selectedSeatsCopy.length; i++) {
      const currentSeat = selectedSeatsCopy[i];
      const nextSeat = selectedSeatsCopy[i + 1];

      if (isAdjacent(currentSeat, nextSeat)) {
        groups.push({
          primarySeat: currentSeat,
          companionSeat: nextSeat,
          isNeighbourFree: true,
        });
        i++;
      } else {
        groups.push({
          primarySeat: currentSeat,
          isNeighbourFree: false,
        });
      }
    }

    setPassengerGroups(groups);
  }, [selectedSeats]);

  const handleSeatClick = (seatId: string, vehicleId?: number) => {
    const isSelected = selectedSeats.includes(seatId);
    const max = getMaxSelectable();

    if (!isSelected && selectedSeats.length >= max) return;

    if (isPrivateTour && seatId.includes('-1A')) return;

    if (travelNeighbourFree && !isSelected) {
      const seat = seatLayout.find(s => s.id === seatId);
      if (seat && (isPrivateTour ? seat.row > 1 : true)) {
        let adjSeatId: string | null = null;

        if (isPrivateTour) {
          if (seat.position === 'A') adjSeatId = `V${vehicleId}-${seat.row}B`;
          else if (seat.position === 'B') adjSeatId = `V${vehicleId}-${seat.row}A`;
          else if (seat.position === 'C') adjSeatId = `V${vehicleId}-${seat.row}D`;
          else if (seat.position === 'D') adjSeatId = `V${vehicleId}-${seat.row}C`;
        } else {
          const row = seat.row;
          if (seat.position === 'A') adjSeatId = `${row}B`;
          else if (seat.position === 'B') adjSeatId = `${row}A`;
          else if (seat.position === 'C') adjSeatId = `${row}D`;
          else if (seat.position === 'D') adjSeatId = `${row}C`;
        }

        if (adjSeatId &&
          seatLayout.find(s => s.id === adjSeatId && s.isAvailable) &&
          !selectedSeats.includes(adjSeatId) &&
          selectedSeats.length + 1 < max
        ) {
          // Only call parent handlers
          onSeatSelect(seatId, vehicleId);
          onSeatSelect(adjSeatId!, vehicleId);
          return;
        }
      }
    }

    // Only call parent handler
    onSeatSelect(seatId, vehicleId);
  };

  const timeString = selectedBus.departureTime || "00:00";
  const [hourStr, minStr] = timeString.split(':');
  const depHour = parseInt(hourStr, 10) || 0;
  const depMin = parseInt(minStr, 10) || 0;
  const departureDateObj = new Date(selectedBus.departureDate || searchData.departureDate);
  departureDateObj.setHours(depHour, depMin, 0, 0);
  const durationMinutes = Number(selectedBus.durationMinutes || 0);
  const arrivalDateObj = new Date(departureDateObj.getTime() + durationMinutes * 60000);
  const arrivalTime = `${arrivalDateObj.getHours().toString().padStart(2, "0")}:${arrivalDateObj.getMinutes().toString().padStart(2, "0")}`;

  let pricePerSeat = selectedBus.fare || 0;
  if (selectedBus.promoActive && selectedSeats.length >= 2) {
    pricePerSeat = selectedBus.promoPrice || pricePerSeat;
  }
  const totalPrice = pricePerSeat * selectedSeats.length;
  const isMorning = selectedBus.serviceType?.includes("Morning");
  const busImg = isMorning ? morningBusImg : afternoonBusImg;

  const renderSeatBtn = (seat: Seat, isSelected: boolean) => {
    const isHighlighted = highlightedPairs.includes(seat.id);
    return (
      <button
        key={seat.id}
        onClick={() => handleSeatClick(seat.id)}
        disabled={!seat.isAvailable}
        className={`w-8 h-8 md:w-9 md:h-9 rounded-lg text-[11px] font-bold flex items-center justify-center
                    border-2 transition-all duration-150 hover:scale-105
                    ${isSelected
                      ? 'text-white shadow-md scale-105'
                      : seat.isAvailable
                        ? 'bg-gray-100 border-gray-300 hover:border-gray-400'
                        : 'cursor-not-allowed opacity-60'
                    }`}
        style={
          isSelected        ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : !seat.isAvailable ? { backgroundColor: colors.lightYellow, borderColor: colors.lightYellow }
          : isHighlighted    ? { borderColor: colors.primary, borderWidth: '3px' }
          : {}
        }
      >
        {seat.number}
      </button>
    );
  };

  const renderRegularBusSeats = () => {
    return (
      <div className="border-2 rounded-xl p-4 md:p-6 bg-white shadow-sm" style={{ borderColor: colors.secondary }}>

        {/* Driver / Door header */}
        <div className="flex justify-between mb-4">
          <div className="w-14 h-10 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
            Door
          </div>
          <div className="w-14 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-md"
            style={{ backgroundColor: '#22c55e' }}>
            Driver
          </div>
        </div>

        {/* Seat rows */}
        <div className="space-y-1.5">
          {SCANIA_ROW_DEFS.map((rd, rowIndex) => {

            // ── Back row: 5 seats in a single line ──────────────────────────
            if (rd.back) {
              return (
                <div key={rowIndex} className="flex items-center justify-center gap-1.5 mt-2">
                  {rd.back.map(n => {
                    const id = String(n);
                    const seat = seatLayout.find(s => s.id === id);
                    if (!seat) return null;
                    const isSelected = selectedSeats.includes(id);
                    return renderSeatBtn(seat, isSelected);
                  })}
                </div>
              );
            }

            // ── Normal rows ──────────────────────────────────────────────────
            const leftSeats  = rd.leftWC ? null : [rd.lw, rd.la].map(n => seatLayout.find(s => s.id === String(n)));
            const rightSeats = [rd.ra, rd.rw].map(n => n != null ? seatLayout.find(s => s.id === String(n)) : null);

            return (
              <div key={rowIndex} className="flex items-center justify-center gap-1.5">

                {/* LEFT SIDE */}
                {rd.leftWC ? (
                  <div className="w-[67px] h-[30px] rounded-md border border-dashed border-gray-300 bg-gray-50
                                  flex items-center justify-center text-[10px] text-gray-400">
                    WC / Toilet
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    {leftSeats!.map((seat, i) => seat ? renderSeatBtn(seat, selectedSeats.includes(seat.id)) : <div key={`ls-${i}`} className="w-8 h-8 md:w-9 md:h-9" />)}
                  </div>
                )}

                {/* AISLE */}
                <div className="w-3.5 border-l border-dashed border-gray-300 h-7" />

                {/* RIGHT SIDE */}
                <div className="flex gap-1.5">
                  {rightSeats.map((seat, i) => seat ? renderSeatBtn(seat, selectedSeats.includes(seat.id)) : <div key={`rs-${i}`} className="w-8 h-8 md:w-9 md:h-9" />)}
                </div>

              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-gray-200 border border-gray-300 inline-block"/>{' '}Available</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded inline-block" style={{background:colors.lightYellow}}/>{' '}Occupied</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded inline-block" style={{background:colors.primary}}/>{' '}Selected</span>
        </div>

      </div>
    );
  };

  const renderVehicleSeats = (vehicleId: number) => {
    const vehicleSeats = seatLayout.filter(seat => seat.vehicleId === vehicleId);
    const vehicle = replacementVehicles.find(v => v.id === vehicleId);

    if (!vehicle) return null;

    const rows = [1, 2, 3, 4];

    return (
      <div key={vehicleId} className="border-2 border-gray-200 rounded-xl p-4 md:p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-100">
          <div>
            <h4 className="font-bold text-lg md:text-xl text-gray-800">Vehicle #{vehicleId}</h4>
            <p className="text-xs md:text-sm text-gray-600 mt-1">{vehicle.name} • {vehicle.seats} seats</p>
          </div>
          <div className="w-12 h-10 md:w-16 md:h-12 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden border">
            <div className="text-xs text-gray-500 text-center px-1">
              Vehicle
            </div>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          {rows.map(row => {
            const rowSeats = vehicleSeats.filter(seat => seat.row === row);
            if (rowSeats.length === 0) return null;

            return (
              <div key={row} className="flex items-center gap-3 md:gap-4">
                <div className="w-6 md:w-8 text-center text-xs md:text-sm font-medium text-gray-500">
                  {row === 1 ? '' : row}
                </div>

                <div className="flex gap-1 md:gap-2 flex-1">
                  {rowSeats.map(seat => {
                    const isHighlighted = highlightedPairs.includes(seat.id);
                    const isSelected = selectedSeats.includes(seat.id);

                    if (row === 1) {
                      return (
                        <div key={seat.id} className="flex items-center gap-1 md:gap-2">
                          {seat.position === 'A' ? (
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-lg flex items-center justify-center text-white text-xs font-bold border-2 border-green-600">
                                DRV
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSeatClick(seat.id, vehicleId)}
                              disabled={!seat.isAvailable}
                              className={`w-8 h-8 md:w-10 md:h-10 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center border-2 transition-all duration-200
                                ${isSelected
                                  ? "text-white shadow-md transform scale-105"
                                  : seat.isAvailable
                                    ? isHighlighted
                                      ? "bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 hover:shadow-sm"
                                      : "bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 hover:shadow-sm"
                                    : "text-gray-400 cursor-not-allowed border-gray-300 opacity-60"
                                }`}
                              style={isSelected ? {
                                backgroundColor: colors.primary,
                                borderColor: colors.primary
                              } : !seat.isAvailable ? {
                                backgroundColor: colors.lightYellow,
                                borderColor: colors.lightYellow
                              } : isHighlighted ? {
                                borderColor: colors.primary,
                                borderWidth: '3px',
                                boxShadow: `0 0 0 1px ${colors.primary}`
                              } : {}}
                            >
                              {seat.displayNumber}
                            </button>
                          )}
                        </div>
                      );
                    }

                    return (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat.id, vehicleId)}
                        disabled={!seat.isAvailable}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center border-2 transition-all duration-200
                          ${isSelected
                            ? "text-white shadow-md transform scale-105"
                            : seat.isAvailable
                              ? isHighlighted
                                ? "bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 hover:shadow-sm"
                                : "bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 hover:shadow-sm"
                              : "text-gray-400 cursor-not-allowed border-gray-300 opacity-60"
                          }`}
                        style={isSelected ? {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary
                        } : !seat.isAvailable ? {
                          backgroundColor: colors.lightYellow,
                          borderColor: colors.lightYellow
                        } : isHighlighted ? {
                          borderColor: colors.primary,
                          borderWidth: '3px',
                          boxShadow: `0 0 0 1px ${colors.primary}`
                        } : {}}
                      >
                        {seat.displayNumber}
                      </button>
                    );
                  })}
                </div>

                {row === 2 && (
                  <div className="w-4 md:w-6 border-l-2 border-dashed border-gray-300 h-8 md:h-10 flex items-center justify-center">
                    <div className="text-xs text-gray-400">|</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const formatSeatDisplayName = (seatId: string) => {
    if (isPrivateTour) {
      return seatId.replace('V1-', '').replace('V2-', '').replace('V3-', '');
    }
    return seatId;
  };

  if (isLoadingSeats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-lg p-8 shadow-lg">
          <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin" style={{ color: colors.primary }} />
          <h2 className="text-2xl font-bold mb-4">Loading Seat Layout...</h2>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white rounded-lg p-8 shadow-lg">
          <Bus className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error Loading Seats</h2>
          <p className="text-gray-600 mb-4">There was a problem loading the seat layout.</p>
          <Button onClick={() => window.location.reload()} style={{ backgroundColor: colors.primary }}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto my-4 md:my-8 px-3 sm:px-4">
      {showNoAdjacentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                No Adjacent Seats Available
              </h3>
              <button
                onClick={() => setShowNoAdjacentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Unfortunately, there are no adjacent seats available for neighbour-free travel at this time.
              </p>
              <p className="text-sm text-gray-600">
                Please select individual seats from the available options.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowNoAdjacentModal(false)}
                className="flex-1 h-10 text-white font-medium rounded-lg transition-colors"
                style={{ backgroundColor: colors.primary }}
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        {/* Header Section */}
        <div className="p-4 md:p-6 border-b" style={{ backgroundColor: colors.primary }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-10 md:w-20 md:h-14 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image
                  src={busImg}
                  alt={`${selectedBus.serviceType} bus`}
                  width={80}
                  height={56}
                  className="object-contain"
                  priority={true}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-white break-words">
                  {isReturnTrip ? 'RETURN TRIP: ' : ''}
                  {isPrivateTour ? 'Private Tour Fleet' : selectedBus.routeName || selectedBus.serviceType}
                </h1>
                <p className="text-white/90 mt-1 text-sm md:text-base">
                  {selectedBus.routeOrigin} → {selectedBus.routeDestination}
                </p>
                <p className="text-white/80 text-sm">
                  {format(new Date(searchData.departureDate), "dd MMM yyyy")}
                </p>
                <div className="text-white/80 text-xs md:text-sm mt-1">
                  {isPrivateTour ? `${replacementVehicles.length} Vehicles • ${selectedBus.totalSeats} Total Seats` : 'AC, Video • 2+2 Configuration'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-semibold text-sm md:text-base">
                {isPrivateTour ? `${replacementVehicles.length} Vehicles` : 'Regular Bus'}
              </div>
              <div className="text-white/80 text-xs md:text-sm">
                Available: {seatLayout.filter(seat => seat.isAvailable).length} seats
              </div>
            </div>
          </div>
        </div>

        {/* Trip Details - Modern Horizontal Layout */}
        <div className="p-4 md:p-6 border-b bg-gradient-to-r from-gray-50 to-blue-50/30">
          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded-lg border border-gray-100 shadow-xs">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="w-4 h-4 mr-1" style={{ color: colors.primary }} />
                    <span className="text-xs text-gray-500 font-medium">Departure</span>
                  </div>
                  <div className="font-bold text-lg" style={{ color: colors.dark }}>
                    {selectedBus.departureTime}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(departureDateObj, "dd MMM yy")}
                  </div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-gray-100 shadow-xs">
                  <div className="flex items-center justify-center mb-2">
                    <MapPin className="w-4 h-4 mr-1" style={{ color: colors.primary }} />
                    <span className="text-xs text-gray-500 font-medium">Arrival</span>
                  </div>
                  <div className="font-bold text-lg" style={{ color: colors.dark }}>
                    {arrivalTime}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(arrivalDateObj, "dd MMM yy")}
                  </div>
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-gray-100 shadow-xs">
                <div className="flex items-center justify-center mb-2">
                  <Bus className="w-4 h-4 mr-1" style={{ color: colors.secondary }} />
                  <span className="text-xs text-gray-500 font-medium">Duration</span>
                </div>
                <div className="font-bold text-lg" style={{ color: colors.dark }}>
                  {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
                </div>
                <div className="text-xs text-gray-500 mt-1">Non-stop journey</div>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Modern Horizontal Design */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              {/* Departure */}
              <div className="flex-1 text-center border-r border-gray-200 pr-6">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                    <Clock className="w-5 h-5" style={{ color: colors.primary }} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-500">Departure</div>
                    <div className="font-bold text-2xl" style={{ color: colors.dark }}>
                      {selectedBus.departureTime}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(departureDateObj, "dd MMM yyyy")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Duration with progress indicator */}
              <div className="flex-1 text-center px-8">
                <div className="relative">
                  <div className="flex items-center justify-center mb-3">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mr-3">
                      <Bus className="w-5 h-5" style={{ color: colors.secondary }} />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-500">Duration</div>
                      <div className="font-bold text-2xl" style={{ color: colors.dark }}>
                        {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
                      </div>
                      <div className="text-sm text-gray-500">Non-stop journey</div>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gray-200 rounded-full">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Arrival */}
              <div className="flex-1 text-center border-l border-gray-200 pl-6">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mr-3">
                    <MapPin className="w-5 h-5" style={{ color: colors.primary }} />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-500">Arrival</div>
                    <div className="font-bold text-2xl" style={{ color: colors.dark }}>
                      {arrivalTime}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(arrivalDateObj, "dd MMM yyyy")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 p-4 md:p-6">
          <div className="lg:col-span-3">
            <h3 className="text-lg md:text-xl font-bold mb-4" style={{ color: colors.dark }}>Select Your Seats</h3>

            {/* Modern Legend */}
            <div className="flex flex-wrap gap-3 md:gap-4 mb-6 md:mb-8 p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 md:w-5 md:h-5 bg-gray-100 border-2 border-gray-300 rounded-md shadow-xs"></div>
                <span className="text-xs md:text-sm font-medium text-gray-700">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-md shadow-xs" style={{ backgroundColor: colors.lightYellow }}></div>
                <span className="text-xs md:text-sm font-medium text-gray-700">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 md:w-5 md:h-5 border-2 rounded-md shadow-xs" style={{ backgroundColor: colors.primary, borderColor: colors.primary }}></div>
                <span className="text-xs md:text-sm font-medium text-gray-700">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 md:w-5 md:h-5 bg-green-500 border-2 border-green-600 rounded-md shadow-xs"></div>
                <span className="text-xs md:text-sm font-medium text-gray-700">Driver</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="travelNeighbourFree"
                  checked={travelNeighbourFree}
                  onChange={(e) => setTravelNeighbourFree && setTravelNeighbourFree(e.target.checked)}
                  className="h-4 w-4 md:h-5 md:w-5 rounded focus:ring-2 focus:ring-offset-2"
                  style={{
                    accentColor: colors.primary,
                    color: colors.primary
                  }}
                />
                <label htmlFor="travelNeighbourFree" className="text-xs md:text-sm font-medium text-gray-700 flex items-center gap-1 cursor-pointer">
                  <UserPlus className="w-3 h-3 md:w-4 md:h-4" style={{ color: colors.primary }} />
                  Travel Neighbour-Free
                </label>
              </div>
            </div>

            <div className={isPrivateTour ? "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" : ""}>
              {isPrivateTour ? (
                replacementVehicles.map(vehicle => renderVehicleSeats(vehicle.id))
              ) : (
                renderRegularBusSeats()
              )}
            </div>
          </div>

          {/* Modern Sidebar */}
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-gray-800">Booking Summary</h3>

              <div className="space-y-4">
                <div>
                  <div className="text-gray-700 text-sm mb-2 font-medium">Selected Seats:</div>
                  <div className="font-semibold text-base md:text-lg">
                    {selectedSeats.length === 0 ? (
                      <span className="text-gray-400 italic">No seats selected</span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {passengerGroups.map((group, idx) => (
                          <div key={idx} className="flex items-center gap-2 flex-wrap">
                            <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium border border-blue-100">
                              {formatSeatDisplayName(group.primarySeat)}
                              {group.companionSeat && ` + ${formatSeatDisplayName(group.companionSeat)}`}
                            </span>
                            {group.isNeighbourFree && (
                              <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-lg font-medium border border-green-100">
                                Neighbour-Free
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 border-y border-gray-200">
                  <span className="text-gray-700 text-sm md:text-base font-medium">Seats:</span>
                  <span className="font-semibold text-sm md:text-base bg-gray-50 px-2 py-1 rounded-md">
                    {selectedSeats.length}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700 text-sm md:text-base font-medium">Price per seat:</span>
                  <span className="font-semibold text-sm md:text-base">P {pricePerSeat.toFixed(2)}</span>
                </div>

                <div className="border-t border-gray-300 my-2 md:my-3"></div>

                <div className="flex justify-between items-center text-base md:text-lg bg-gradient-to-r from-gray-50 to-blue-50/50 p-3 rounded-lg">
                  <span className="font-bold text-gray-800">Total:</span>
                  <span className="font-bold text-lg md:text-xl" style={{ color: colors.primary }}>P {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-gradient-to-r from-yellow-50 to-orange-50/30 border-yellow-200/50">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-600 text-xs font-bold">!</span>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-sm md:text-base text-yellow-800">Important Notice</h4>
                  <p className="text-xs md:text-sm text-yellow-700/80 leading-relaxed">
                    Boarding and dropping points will be selected in the next step.
                    Please ensure you have your passengers' details ready.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={onProceed}
              disabled={selectedSeats.length === 0}
              className="w-full h-12 md:h-14 text-white font-semibold rounded-xl text-base md:text-lg transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border-0"
              style={{ backgroundColor: colors.secondary }}
            >
              Continue to Passengers
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}