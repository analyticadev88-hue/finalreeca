"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";

interface RescheduleSeatPickerProps {
  totalSeats: number;
  occupiedSeats: string[];
  tempLockedSeats: string[];
  requiredCount: number;
  selectedSeats: string[];
  onSelectionChange: (seats: string[]) => void;
  label: string;
}

export function RescheduleSeatPicker({
  totalSeats,
  occupiedSeats,
  tempLockedSeats,
  requiredCount,
  selectedSeats,
  onSelectionChange,
  label,
}: RescheduleSeatPickerProps) {
  const blockedSet = new Set([...occupiedSeats, ...tempLockedSeats]);

  const toggleSeat = useCallback(
    (seatNum: string) => {
      if (blockedSet.has(seatNum)) return;

      const isSelected = selectedSeats.includes(seatNum);
      let newSeats: string[];

      if (isSelected) {
        // Deselect
        newSeats = selectedSeats.filter((s) => s !== seatNum);
      } else {
        // Select — replace the oldest selected seat if already at capacity
        if (selectedSeats.length >= requiredCount) {
          // Shift out the first selected, add the new one
          newSeats = [...selectedSeats.slice(1), seatNum];
        } else {
          newSeats = [...selectedSeats, seatNum];
        }
      }

      onSelectionChange(newSeats);
    },
    [selectedSeats, requiredCount, blockedSet, onSelectionChange]
  );

  // Build seat grid — use 4 columns for buses up to 60 seats, 5 for larger
  const cols = totalSeats <= 44 ? 4 : 5;
  const rows = Math.ceil(totalSeats / cols);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">
          {label} — Select {requiredCount} seat{requiredCount !== 1 ? "s" : ""}
        </span>
        <span
          className={cn(
            "text-xs font-bold",
            selectedSeats.length === requiredCount
              ? "text-green-600"
              : selectedSeats.length > requiredCount
              ? "text-red-600"
              : "text-amber-600"
          )}
        >
          {selectedSeats.length} / {requiredCount} selected
        </span>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm border border-gray-300 bg-white" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm border border-teal-500 bg-teal-50 flex items-center justify-center">
            <Check className="w-2 h-2 text-teal-600" />
          </div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm border border-gray-300 bg-gray-100 flex items-center justify-center">
            <Lock className="w-2 h-2 text-gray-400" />
          </div>
          <span>Taken</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: rows }, (_, rowIdx) => (
          <div key={rowIdx} className="flex gap-1.5 justify-center">
            {Array.from({ length: cols }, (_, colIdx) => {
              const seatNum = String(rowIdx * cols + colIdx + 1);
              if (Number(seatNum) > totalSeats) return null;

              const isBlocked = blockedSet.has(seatNum);
              const isSelected = selectedSeats.includes(seatNum);

              return (
                <button
                  key={seatNum}
                  type="button"
                  disabled={isBlocked}
                  onClick={() => toggleSeat(seatNum)}
                  className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 rounded-md border text-xs font-semibold flex items-center justify-center transition-all",
                    isBlocked
                      ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed"
                      : isSelected
                      ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm ring-1 ring-teal-200"
                      : "bg-white border-gray-300 text-gray-600 hover:border-teal-300 hover:text-teal-600"
                  )}
                >
                  {isBlocked ? (
                    <Lock className="w-3 h-3 text-gray-300" />
                  ) : isSelected ? (
                    <span className="flex items-center gap-0.5">
                      {seatNum}
                    </span>
                  ) : (
                    seatNum
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Selected seats summary */}
      {selectedSeats.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selectedSeats.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200"
            >
              Seat {s}
              <button
                type="button"
                onClick={() => toggleSeat(s)}
                className="text-teal-400 hover:text-teal-700"
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
