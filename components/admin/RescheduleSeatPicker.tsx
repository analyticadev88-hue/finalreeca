"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Lock, Check } from "lucide-react";

interface RescheduleSeatPickerProps {
  totalSeats: number;
  occupiedSeats: string[];
  tempLockedSeats: string[];
  requiredCount: number;
  selectedSeats: string[];
  onSelectionChange: (seats: string[]) => void;
  label: string;
}

// Convert old seat format (e.g., "3C") to new numeric format (1-57)
const convertOldSeatToNew = (oldSeatId: string): string | null => {
  const match = oldSeatId.match(/^(\d+)([A-D])$/);
  if (!match) return null;
  const row = parseInt(match[1]);
  const letter = match[2];
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

const convertOldSeatsToNew = (oldSeats: string[]): string[] => {
  return oldSeats.map(seat => {
    const converted = convertOldSeatToNew(seat);
    return converted !== null ? converted : seat;
  });
};

const SCANIA_ROW_DEFS = (() => {
  const defs: Array<{
    lw?: number; la?: number; ra?: number; rw?: number;
    leftWC?: boolean; back?: number[];
  }> = [];

  // Rows 1-5  →  seats 1-20  (4 per row)
  for (let r = 1; r <= 5; r++) {
    defs.push({ lw: 4*r-1, la: 4*r, ra: 4*r-2, rw: 4*r-3 });
  }
  // Row 6  →  WC on left, seats 21-22 on right
  defs.push({ leftWC: true, ra: 22, rw: 21 });
  // Row 7  →  WC on left, seats 23-24 on right
  defs.push({ leftWC: true, ra: 24, rw: 23 });

  // Rows 8-14  →  seats 25-52  (7 rows × 4 = 28 seats)
  for (let i = 0; i < 7; i++) {
    const base = 25 + i * 4;
    defs.push({ lw: base, la: base+1, ra: base+3, rw: base+2 });
  }

  // Back row  →  seats 53-57
  defs.push({ back: [53, 54, 55, 56, 57] });

  return defs;
})();

export function RescheduleSeatPicker({
  totalSeats,
  occupiedSeats,
  tempLockedSeats,
  requiredCount,
  selectedSeats,
  onSelectionChange,
  label,
}: RescheduleSeatPickerProps) {
  const convertedOccupied = convertOldSeatsToNew(occupiedSeats);
  const convertedTempLocked = convertOldSeatsToNew(tempLockedSeats);
  const blockedSet = new Set([...convertedOccupied, ...convertedTempLocked]);

  const toggleSeat = useCallback(
    (seatNum: string) => {
      if (blockedSet.has(seatNum)) return;

      const isSelected = selectedSeats.includes(seatNum);
      let newSeats: string[];

      if (isSelected) {
        newSeats = selectedSeats.filter((s) => s !== seatNum);
      } else {
        if (selectedSeats.length >= requiredCount) {
          newSeats = [...selectedSeats.slice(1), seatNum];
        } else {
          newSeats = [...selectedSeats, seatNum];
        }
      }

      onSelectionChange(newSeats);
    },
    [selectedSeats, requiredCount, blockedSet, onSelectionChange]
  );

  const seatsOk = selectedSeats.length === requiredCount;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">
          {label} — Select {requiredCount} seat{requiredCount !== 1 ? "s" : ""}
        </span>
        <span
          className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full",
            seatsOk
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700"
          )}
        >
          {selectedSeats.length} / {requiredCount} selected
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border border-gray-300 bg-white" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border border-teal-500 bg-teal-50 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-teal-600" />
          </div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border border-gray-300 bg-gray-100 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-gray-400" />
          </div>
          <span>Taken</span>
        </div>
      </div>

      {/* Bus Layout */}
      <div className="border-2 rounded-xl p-3 sm:p-4 bg-white shadow-sm" style={{ borderColor: '#febf00' }}>
        {/* Driver / Door header */}
        <div className="flex justify-between mb-3">
          <div className="w-12 h-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400">
            Door
          </div>
          <div className="w-12 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
            style={{ backgroundColor: '#22c55e' }}>
            Driver
          </div>
        </div>

        {/* Seat rows */}
        <div className="space-y-1">
          {SCANIA_ROW_DEFS.map((rd, rowIndex) => {
            // Back row
            if (rd.back) {
              return (
                <div key={rowIndex} className="flex items-center justify-center gap-1 mt-1">
                  {rd.back.map((n) => {
                    const id = String(n);
                    if (n > totalSeats) return null;
                    const isBlocked = blockedSet.has(id);
                    const isSelected = selectedSeats.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={isBlocked}
                        onClick={() => toggleSeat(id)}
                        className={cn(
                          "w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-[11px] font-bold flex items-center justify-center border-2 transition-all hover:scale-105",
                          isBlocked
                            ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed"
                            : isSelected
                            ? "text-white shadow-md scale-105"
                            : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                        )}
                        style={
                          isSelected
                            ? { backgroundColor: '#009393', borderColor: '#009393' }
                            : isBlocked
                            ? { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }
                            : {}
                        }
                      >
                        {isBlocked ? <Lock className="w-3 h-3 text-gray-300" /> : id}
                      </button>
                    );
                  })}
                </div>
              );
            }

            const leftSeats = rd.leftWC
              ? null
              : [rd.lw, rd.la].map((n) => (n != null ? String(n) : null));
            const rightSeats = [rd.ra, rd.rw].map((n) => (n != null ? String(n) : null));

            return (
              <div key={rowIndex} className="flex items-center justify-center gap-1">
                {/* LEFT SIDE */}
                {rd.leftWC ? (
                  <div className="w-[60px] h-[28px] rounded-md border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-[9px] text-gray-400">
                    WC
                  </div>
                ) : (
                  <div className="flex gap-1">
                    {leftSeats!.map((seatId, i) => {
                      if (!seatId || Number(seatId) > totalSeats) return <div key={`ls-${i}`} className="w-8 h-8 sm:w-9 sm:h-9" />;
                      const isBlocked = blockedSet.has(seatId);
                      const isSelected = selectedSeats.includes(seatId);
                      return (
                        <button
                          key={seatId}
                          type="button"
                          disabled={isBlocked}
                          onClick={() => toggleSeat(seatId)}
                          className={cn(
                            "w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-[11px] font-bold flex items-center justify-center border-2 transition-all hover:scale-105",
                            isBlocked
                              ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed"
                              : isSelected
                              ? "text-white shadow-md scale-105"
                              : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                          )}
                          style={
                            isSelected
                              ? { backgroundColor: '#009393', borderColor: '#009393' }
                              : isBlocked
                              ? { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }
                              : {}
                          }
                        >
                          {isBlocked ? <Lock className="w-3 h-3 text-gray-300" /> : seatId}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* AISLE */}
                <div className="w-3 border-l border-dashed border-gray-300 h-7" />

                {/* RIGHT SIDE */}
                <div className="flex gap-1">
                  {rightSeats.map((seatId, i) => {
                    if (!seatId || Number(seatId) > totalSeats) return <div key={`rs-${i}`} className="w-8 h-8 sm:w-9 sm:h-9" />;
                    const isBlocked = blockedSet.has(seatId);
                    const isSelected = selectedSeats.includes(seatId);
                    return (
                      <button
                        key={seatId}
                        type="button"
                        disabled={isBlocked}
                        onClick={() => toggleSeat(seatId)}
                        className={cn(
                          "w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-[11px] font-bold flex items-center justify-center border-2 transition-all hover:scale-105",
                          isBlocked
                            ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed"
                            : isSelected
                            ? "text-white shadow-md scale-105"
                            : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                        )}
                        style={
                          isSelected
                            ? { backgroundColor: '#009393', borderColor: '#009393' }
                            : isBlocked
                            ? { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }
                            : {}
                        }
                      >
                        {isBlocked ? <Lock className="w-3 h-3 text-gray-300" /> : seatId}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected seats summary */}
      {selectedSeats.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedSeats.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium"
            >
              Seat {s}
              <button
                type="button"
                onClick={() => toggleSeat(s)}
                className="text-teal-400 hover:text-teal-700 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
