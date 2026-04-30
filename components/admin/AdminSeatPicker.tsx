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
          // Parse bookings to get seat numbers
          const booked = (data.bookings || []).flatMap((b: any) => 
            (b.passengers || []).map((p: any) => p.seatNumber)
          );
          
          const tempLocked = data.trip.tempLockedSeats ? data.trip.tempLockedSeats.split(',') : [];
          const reserved = data.reservedSeatNumbers || [];
          
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

  const unavailable = useMemo(() => {
    return new Set([
      ...occupiedDetails.booked,
      ...occupiedDetails.reserved,
      ...occupiedDetails.tempLocked,
      ...currentlySelectedByOtherPassengers
    ]);
  }, [occupiedDetails, currentlySelectedByOtherPassengers]);

  const seatGrid = useMemo(() => {
    const rows = 14;
    const grid = [];
    for (let r = 1; r <= rows; r++) {
      if (r < rows) {
        grid.push({
          row: r,
          left: [`${r}A`, `${r}B`],
          right: [`${r}C`, `${r}D`],
          isBack: false
        });
      } else {
        grid.push({
          row: r,
          back: [`${r}A`, `${r}B`, `${r}C`, `${r}D`, `${r}E`],
          isBack: true
        });
      }
    }
    return grid;
  }, []);

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
                         
                         {!row.isBack ? (
                           <>
                              <div className="flex gap-1">
                                 {row.left?.map(seatId => {
                                    const isCurrent = seatId === currentSeat;
                                    const isOccupied = (unavailable.has(seatId) && !isCurrent);
                                    return (
                                       <button
                                          key={seatId}
                                          disabled={isOccupied}
                                          onClick={() => onSelect(seatId)}
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
                                 })}
                              </div>
                              <div className="flex-1 h-8 border-x border-dashed border-gray-100 mx-1" />
                              <div className="flex gap-1">
                                 {row.right?.map(seatId => {
                                    const isCurrent = seatId === currentSeat;
                                    const isOccupied = (unavailable.has(seatId) && !isCurrent);
                                    return (
                                       <button
                                          key={seatId}
                                          disabled={isOccupied}
                                          onClick={() => onSelect(seatId)}
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
                                 })}
                              </div>
                           </>
                         ) : (
                           <div className="flex gap-1">
                              {row.back?.map(seatId => {
                                 const isCurrent = seatId === currentSeat;
                                 const isOccupied = (unavailable.has(seatId) && !isCurrent);
                                 return (
                                    <button
                                       key={seatId}
                                       disabled={isOccupied}
                                       onClick={() => onSelect(seatId)}
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
                              })}
                           </div>
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
