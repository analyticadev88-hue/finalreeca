"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Lock, 
  X, 
  Armchair,
  Info,
  Unlock
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TempLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: any;
  onSuccess: () => void;
}

export function TempLockModal({ isOpen, onClose, trip, onSuccess }: TempLockModalProps) {
  const [loading, setLoading] = useState(false);
  const [lockedSeats, setLockedSeats] = useState<string[]>([]);
  const [occupiedDetails, setOccupiedDetails] = useState<{
    booked: string[],
    reserved: string[]
  }>({ booked: [], reserved: [] });

  // Fetch real-time occupancy data
  useEffect(() => {
    if (isOpen && trip?.id) {
      setLoading(true);
      setLockedSeats(trip.tempLockedSeats || []);
      
      fetch(`/api/trips/${trip.id}/bookings`)
        .then(res => res.json())
        .then(data => {
            const booked = (data.bookings || []).flatMap((b: any) => 
                (b.passengers || []).map((p: any) => p.seatNumber)
            );
            const reserved = data.reservedSeatNumbers || [];
            
            setOccupiedDetails({ booked, reserved });
            // Update locked seats from API to ensure sync
            if (data.trip?.tempLockedSeats) {
                setLockedSeats(data.trip.tempLockedSeats.split(','));
            }
            setLoading(false);
        })
        .catch(err => {
            console.error("Error fetching occupancy:", err);
            setLoading(false);
        });
    }
  }, [isOpen, trip?.id, trip.tempLockedSeats]);

  const { seatGrid, bookedSet, reservedSet } = useMemo(() => {
    if (!trip) return { seatGrid: [], bookedSet: new Set(), reservedSet: new Set() };
    
    const bookedSet = new Set(occupiedDetails.booked);
    const reservedSet = new Set(occupiedDetails.reserved);
    
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
            seats: [`${r}A`, `${r}B`, `${r}C`, `${r}D`, `${r}E`],
            isBack: true
        });
      }
    }

    return { seatGrid: grid, bookedSet, reservedSet };
  }, [trip, occupiedDetails]);

  const handleSeatToggle = (seatId: string) => {
    if (bookedSet.has(seatId) || reservedSet.has(seatId)) {
        toast.error("This seat is already booked or reserved and cannot be locked/unlocked.");
        return;
    }

    setLockedSeats(prev => 
        prev.includes(seatId) 
            ? prev.filter(s => s !== seatId) 
            : [...prev, seatId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/trips/${trip.id}/temp-lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seats: lockedSeats }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Temporary locks updated successfully");
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to update locks");
      }
    } catch (error) {
      toast.error("An error occurred while updating locks");
    } finally {
      setLoading(false);
    }
  };

  if (!trip) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl border-amber-200">
        <DialogHeader className="p-6 bg-amber-700 text-white shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Lock className="w-6 h-6" /> Temp Seat Lock
              </DialogTitle>
              <DialogDescription className="text-amber-50">
                {trip.routeOrigin} → {trip.routeDestination} • {trip.departureTime}
              </DialogDescription>
            </div>
            <div className="text-right flex gap-6">
                <div>
                    <div className="text-[10px] uppercase font-bold opacity-70 text-amber-100">Booked</div>
                    <div className="text-2xl font-extrabold">{occupiedDetails.booked.length}</div>
                </div>
                <div>
                    <div className="text-[10px] uppercase font-bold opacity-70 text-amber-100">Locked</div>
                    <div className="text-2xl font-extrabold">{lockedSeats.length}</div>
                </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-amber-50/30">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-6">
                    <div className="bg-amber-100/50 p-4 rounded-lg border border-amber-200 flex items-start gap-3">
                        <Info className="w-5 h-5 text-amber-700 mt-0.5" />
                        <div className="space-y-2">
                            <p className="text-sm font-bold text-amber-900">How it works</p>
                            <p className="text-xs text-amber-800">
                                Click available seats to block them. Users will see these as "Occupied" but they won't be linked to any real booking. 
                                <br/><br/>
                                <strong className="text-amber-950 font-bold">Brown seats</strong> are locked by you. 
                                <strong className="text-gray-500 font-bold"> Gray seats</strong> are already booked by users and cannot be changed here.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-amber-100">
                            <div className="w-4 h-4 bg-[#8B4513] rounded-sm" />
                            <span className="text-xs font-medium text-gray-700">Temp Locked (Brown)</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
                            <div className="w-4 h-4 bg-gray-200 rounded-sm" />
                            <span className="text-xs font-medium text-gray-700">Booked (Gray)</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-bold text-amber-900 text-sm">Selection Summary</h4>
                        <div className="flex flex-wrap gap-2">
                            {lockedSeats.length === 0 && <span className="text-xs text-gray-500 italic">No seats currently locked</span>}
                            {lockedSeats.map(seat => (
                                <span key={seat} className="bg-[#8B4513] text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                    {seat}
                                    <button onClick={() => handleSeatToggle(seat)} className="hover:text-amber-200"><X className="w-3 h-3" /></button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bus Map */}
                <div className="relative border-8 border-amber-200/50 rounded-[4rem] p-8 pt-20 bg-white shadow-xl max-w-sm mx-auto">
                    {/* Driver & Door */}
                    <div className="absolute top-6 left-10 right-10 flex justify-between items-center px-4">
                        <div className="w-14 h-8 bg-amber-100 border-2 border-amber-200 rounded-sm text-[10px] font-bold text-amber-700 flex items-center justify-center">DOOR</div>
                        <div className="w-14 h-14 bg-gray-100 border-2 rounded-xl flex items-center justify-center text-[10px] font-bold text-gray-400">DRIVER</div>
                    </div>

                    <div className="space-y-4">
                        {seatGrid.map((row) => (
                            <div key={row.row} className="flex items-center gap-3">
                                <div className="w-4 text-[10px] font-bold text-gray-300 text-center">{row.row}</div>
                                {!row.isBack ? (
                                    <>
                                      <div className="flex gap-2">
                                          {row.left?.map(seatId => {
                                              const isBooked = bookedSet.has(seatId) || reservedSet.has(seatId);
                                              const isLocked = lockedSeats.includes(seatId);
                                              return (
                                                  <button
                                                      key={seatId}
                                                      onClick={() => handleSeatToggle(seatId)}
                                                      className={cn(
                                                          "w-11 h-11 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border-2 transition-all",
                                                          isLocked 
                                                              ? "bg-[#8B4513] border-[#5D2E0C] text-white shadow-lg scale-105" 
                                                              : isBooked 
                                                                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" 
                                                                  : "bg-white border-amber-100 text-amber-900 hover:border-amber-500 hover:bg-amber-50"
                                                      )}
                                                  >
                                                      <Armchair className={cn("w-5 h-5 mb-0.5", isLocked ? "text-amber-200" : isBooked ? "text-gray-300" : "text-amber-600/40")} />
                                                      {seatId}
                                                  </button>
                                              );
                                          })}
                                      </div>
                                      <div className="w-8 h-10 flex items-center justify-center">
                                          <div className="w-[1px] h-full bg-amber-100/50" />
                                      </div>
                                      <div className="flex gap-2">
                                          {row.right?.map(seatId => {
                                              const isBooked = bookedSet.has(seatId) || reservedSet.has(seatId);
                                              const isLocked = lockedSeats.includes(seatId);
                                              return (
                                                  <button
                                                      key={seatId}
                                                      onClick={() => handleSeatToggle(seatId)}
                                                      className={cn(
                                                          "w-11 h-11 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border-2 transition-all",
                                                          isLocked 
                                                              ? "bg-[#8B4513] border-[#5D2E0C] text-white shadow-lg scale-105" 
                                                              : isBooked 
                                                                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" 
                                                                  : "bg-white border-amber-100 text-amber-900 hover:border-amber-500 hover:bg-amber-50"
                                                      )}
                                                  >
                                                      <Armchair className={cn("w-5 h-5 mb-0.5", isLocked ? "text-amber-200" : isBooked ? "text-gray-300" : "text-amber-600/40")} />
                                                      {seatId}
                                                  </button>
                                              );
                                          })}
                                      </div>
                                    </>
                                ) : (
                                    <div className="flex gap-2 w-full justify-center">
                                        {row.seats?.map(seatId => {
                                            const isBooked = bookedSet.has(seatId) || reservedSet.has(seatId);
                                            const isLocked = lockedSeats.includes(seatId);
                                            return (
                                                <button
                                                    key={seatId}
                                                    onClick={() => handleSeatToggle(seatId)}
                                                    className={cn(
                                                        "w-11 h-11 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border-2 transition-all",
                                                        isLocked 
                                                            ? "bg-[#8B4513] border-[#5D2E0C] text-white shadow-lg scale-105" 
                                                            : isBooked 
                                                                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" 
                                                                : "bg-white border-amber-100 text-amber-900 hover:border-amber-500 hover:bg-amber-50"
                                                    )}
                                                >
                                                    <Armchair className={cn("w-5 h-5 mb-0.5", isLocked ? "text-amber-200" : isBooked ? "text-gray-300" : "text-amber-600/40")} />
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
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t shrink-0">
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">
              <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
                  <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>{lockedSeats.length} Seats to Lock</span>
                  </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 md:flex-none">
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    disabled={loading} 
                    className="flex-1 md:flex-none bg-amber-700 hover:bg-amber-800 text-white font-bold"
                >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlock className="w-4 h-4 mr-2" />}
                    Update Locks
                </Button>
              </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
