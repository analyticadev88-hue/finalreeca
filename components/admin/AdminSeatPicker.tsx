"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Armchair, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSeatPickerProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onSelect: (seatId: string) => void;
  currentlySelectedByOtherPassengers: string[];
  currentSeat: string;
}

// Convert old seat format (e.g., "3C") to new numeric format (1-57)
const convertOldSeatToNew = (oldSeatId: string): string | null => {
  if (!oldSeatId) return null;
  const match = oldSeatId.match(/^(\d+)([A-E])$/);
  if (!match) return null;

  const row = parseInt(match[1]);
  const letter = match[2];

  // Back row mapping (row 14 A-E maps to 53-57)
  if (row === 14) {
    switch (letter) {
      case 'A': return '53';
      case 'B': return '54';
      case 'C': return '55';
      case 'D': return '56';
      case 'E': return '57';
    }
  }

  switch (letter) {
    case 'A': return String(4 * row - 1);
    case 'B': return String(4 * row);
    case 'C': return String(4 * row - 2);
    case 'D': return String(4 * row - 3);
    default: return null;
  }
};

const normalizeSeat = (seat: string): string => {
  const converted = convertOldSeatToNew(seat);
  return converted !== null ? converted : seat;
};

export function AdminSeatPicker({
  isOpen,
  onClose,
  tripId,
  onSelect,
  currentlySelectedByOtherPassengers,
  currentSeat
}: AdminSeatPickerProps) {
  const [loading, setLoading] = useState(false);
  const [occupiedDetails, setOccupiedDetails] = useState({
    booked: [] as string[],
    reserved: [] as string[],
    tempLocked: [] as string[]
  });

  useEffect(() => {
    async function fetchAvailability() {
      if (!isOpen || !tripId) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/trips/${tripId}/bookings`);
        const data = await res.json();

        if (data && data.trip) {
          // Parse bookings to get seat numbers — normalize old format to numeric
          const booked = (data.bookings || []).flatMap((b: any) =>
            (b.passengers || []).map((p: any) => normalizeSeat(p.seatNumber))
          );

          const tempLocked = data.trip.tempLockedSeats
            ? data.trip.tempLockedSeats.split(',').map((s: string) => normalizeSeat(s.trim()))
            : [];
          const reserved = (data.reservedSeatNumbers || []).map((s: string) => normalizeSeat(String(s)));

          setOccupiedDetails({ booked, reserved, tempLocked });
        }
      } catch (err) {
        console.error("Failed to fetch seat availability:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAvailability();
  }, [isOpen, tripId]);

  const normalizedCurrentSeat = useMemo(() => normalizeSeat(currentSeat), [currentSeat]);

  const unavailable = useMemo(() => {
    return new Set([
      ...occupiedDetails.booked,
      ...occupiedDetails.reserved,
      ...occupiedDetails.tempLocked,
      ...currentlySelectedByOtherPassengers.map(normalizeSeat)
    ]);
  }, [occupiedDetails, currentlySelectedByOtherPassengers]);

  const seatGrid = useMemo(() => {
    const grid: Array<{
      row: number;
      left: number[];
      right: number[];
      back: number[];
      isBack: boolean;
      isWC: boolean;
    }> = [];

    // Rows 1-5: regular 4-seat rows
    // Pattern: left window = 4r-1, left aisle = 4r, right aisle = 4r-2, right window = 4r-3
    for (let r = 1; r <= 5; r++) {
      grid.push({
        row: r,
        left: [4 * r - 1, 4 * r],
        right: [4 * r - 2, 4 * r - 3],
        back: [],
        isBack: false,
        isWC: false
      });
    }

    // Row 6: WC on left, seats 21-22 on right
    grid.push({ row: 6, left: [], right: [22, 21], back: [], isBack: false, isWC: true });

    // Row 7: WC on left, seats 23-24 on right
    grid.push({ row: 7, left: [], right: [24, 23], back: [], isBack: false, isWC: true });

    // Rows 8-14: regular 4-seat rows
    for (let r = 8; r <= 14; r++) {
      const base = 25 + (r - 8) * 4;
      grid.push({
        row: r,
        left: [base, base + 1],
        right: [base + 3, base + 2],
        back: [],
        isBack: false,
        isWC: false
      });
    }

    // Back row: seats 53-57
    grid.push({ row: 15, left: [], right: [], back: [53, 54, 55, 56, 57], isBack: true, isWC: false });

    return grid;
  }, []);

  const renderSeatButton = (seatId: number) => {
    const seatStr = String(seatId);
    const isCurrent = seatStr === normalizedCurrentSeat;
    const isOccupied = unavailable.has(seatStr) && !isCurrent;
    return (
      <button
        key={seatId}
        disabled={isOccupied}
        onClick={() => onSelect(seatStr)}
        className={cn(
          "w-9 h-9 rounded-md flex flex-col items-center justify-center text-[9px] font-bold border transition-all",
          isCurrent
            ? "bg-teal-600 border-teal-700 text-white"
            : isOccupied
              ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed"
              : "bg-white border-gray-200 text-gray-500 hover:border-teal-500 hover:bg-teal-50"
        )}
      >
        <Armchair className={cn("w-3 h-3 mb-0.5", isCurrent ? "text-white" : isOccupied ? "text-gray-200" : "text-gray-400")} />
        {seatId}
      </button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Change Seat Assignment
            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
            <p className="text-sm text-gray-500">Checking availability...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5" />
              <p className="text-[11px] text-blue-800">
                Select an available seat. Blue indicates the seat you are moving to.
                Locked or booked seats are disabled.
              </p>
            </div>

            <div className="relative border-4 border-gray-100 rounded-[2rem] p-6 pt-12 bg-white shadow-inner max-w-[280px] mx-auto">
              {/* Front */}
              <div className="absolute top-3 left-0 right-0 flex justify-between px-8">
                <div className="w-10 h-4 bg-gray-100 rounded-sm text-[6px] flex items-center justify-center font-bold text-gray-400">DOOR</div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-[8px] font-bold text-gray-400 border border-gray-200">DRIVE</div>
              </div>

              <div className="space-y-3">
                {seatGrid.map((row) => (
                  <div key={row.row} className="flex items-center gap-2">
                    <div className="w-3 text-[9px] font-bold text-gray-300 text-center">{row.row}</div>

                    {row.isBack ? (
                      <div className="flex gap-1">
                        {row.back.map((seatId) => renderSeatButton(seatId))}
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-1">
                          {row.isWC ? (
                            <div className="w-[76px] h-9 rounded-md bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-300">
                              WC
                            </div>
                          ) : (
                            row.left.map((seatId) => renderSeatButton(seatId))
                          )}
                        </div>
                        <div className="flex-1 h-8 border-x border-dashed border-gray-100 mx-1" />
                        <div className="flex gap-1">
                          {row.right.map((seatId) => renderSeatButton(seatId))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
