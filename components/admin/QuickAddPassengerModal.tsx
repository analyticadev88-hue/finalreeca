"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  UserPlus, 
  X, 
  Plus, 
  Trash2, 
  User, 
  Baby, 
  MapPin, 
  CreditCard, 
  Info,
  Armchair
} from "lucide-react";
import { toast } from "sonner";
import { boardingPoints } from "@/lib/data";
import { cn } from "@/lib/utils";

interface Passenger {
  firstName: string;
  lastName: string;
  title: string;
  seatNumber: string;
  type: string;
  passportNumber: string;
  hasInfant: boolean;
  infantName: string;
  infantPassportNumber: string;
  infantBirthdate: string;
}

interface QuickAddPassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: any;
  bookings: any[];
  onSuccess: () => void;
}

export function QuickAddPassengerModal({ isOpen, onClose, trip, bookings, onSuccess }: QuickAddPassengerModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "seats">("details");
  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: "",
    paymentMode: "Cash",
  });
  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      firstName: "",
      lastName: "",
      title: "Mr",
      seatNumber: "",
      type: "adult",
      passportNumber: "",
      hasInfant: false,
      infantName: "",
      infantPassportNumber: "",
      infantBirthdate: "",
    }
  ]);
  const [points, setPoints] = useState({
    boarding: "",
    dropping: "",
  });
  const [occupiedDetails, setOccupiedDetails] = useState<{
    manual: string[],
    booked: string[],
    reserved: string[]
  }>({ manual: [], booked: [], reserved: [] });

  // Fetch real-time occupancy data
  useEffect(() => {
    if (isOpen && trip?.id) {
      setLoading(true);
      fetch(`/api/trips/${trip.id}/bookings`)
        .then(res => res.json())
        .then(data => {
            const manual = trip.occupiedSeats ? JSON.parse(trip.occupiedSeats) : [];
            const booked = (data.bookings || []).flatMap((b: any) => 
                (b.passengers || []).map((p: any) => p.seatNumber)
            );
            const reserved = data.reservedSeatNumbers || [];
            
            setOccupiedDetails({ manual, booked, reserved });
            setLoading(false);
        })
        .catch(err => {
            console.error("Error fetching occupancy:", err);
            setLoading(false);
        });
    }
  }, [isOpen, trip?.id, trip.occupiedSeats]);

  // Derived data
  const { seatGrid, unavailable } = useMemo(() => {
    if (!trip) return { seatGrid: [], unavailable: new Set() };
    
    // 1. Calculate Occupied Seats from all sources
    const unavailable = new Set([
        ...occupiedDetails.manual, 
        ...occupiedDetails.booked, 
        ...occupiedDetails.reserved
    ]);
    
    const total = trip.totalSeats || 57;
    
    // 2. Generate Grid matching generateRegularBusSeatLayout
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

    return { seatGrid: grid, unavailable };
  }, [trip, occupiedDetails]);

  // Points mapping
  const boardingOptions = useMemo(() => {
    if (!trip) return [];
    const origin = (trip.routeOrigin || "").toLowerCase().trim();
    if (origin.includes("gaborone")) return boardingPoints.gaborone;
    if (origin.includes("tambo") || origin.includes("airport")) return boardingPoints.ortambo;
    return [{ id: "custom-b", name: trip.routeOrigin, times: [] }];
  }, [trip]);

  const droppingOptions = useMemo(() => {
    if (!trip) return [];
    const dest = (trip.routeDestination || "").toLowerCase().trim();
    if (dest.includes("gaborone")) return boardingPoints.gaborone;
    if (dest.includes("tambo") || dest.includes("airport")) return boardingPoints.ortambo;
    return [{ id: "custom-d", name: trip.routeDestination, times: [] }];
  }, [trip]);

  useEffect(() => {
    if (trip) {
      setPoints({
        boarding: boardingOptions[0]?.name || "",
        dropping: droppingOptions[0]?.name || "",
      });
    }
  }, [trip, boardingOptions, droppingOptions]);

  const handleAddPassenger = () => {
    setPassengers([
      ...passengers,
      {
        firstName: "",
        lastName: "",
        title: "Mr",
        seatNumber: "",
        type: "adult",
        passportNumber: "",
        hasInfant: false,
        infantName: "",
        infantPassportNumber: "",
        infantBirthdate: "",
      }
    ]);
  };

  const handleRemovePassenger = (index: number) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index));
    }
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: any) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const handleSeatSelect = (seatId: string) => {
    // Find first passenger without a seat
    const firstUnseatedIndex = passengers.findIndex(p => !p.seatNumber);
    if (firstUnseatedIndex !== -1) {
        updatePassenger(firstUnseatedIndex, "seatNumber", seatId);
    } else {
        // If all have seats, maybe update the last one or show a message
        toast.info("All passengers already have seats selected.");
    }
  };

  const calculateTotalPrice = () => {
    if (!trip) return 0;
    return passengers.reduce((total, p) => {
      const base = p.type === 'child' ? (trip.fare * 0.75) : trip.fare;
      const infant = p.hasInfant ? 250 : 0; // Standard infant fare
      return total + base + infant;
    }, 0);
  };

  const handleSubmit = async () => {
    // Validation
    const emptyDetails = passengers.some(p => !p.firstName || !p.lastName || !p.seatNumber);
    if (emptyDetails) {
      toast.error("Please fill in all passenger details and select seats for everyone.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tripId: trip.id,
        orderId: `WLK-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`,
        userName: contactInfo.name || `${passengers[0].firstName} ${passengers[0].lastName}`,
        userEmail: contactInfo.email || "walkin@example.com",
        userPhone: contactInfo.phone,
        paymentMode: contactInfo.paymentMode,
        totalPrice: calculateTotalPrice(),
        departureSeats: passengers.map(p => p.seatNumber),
        passengers: passengers.map(p => ({
            ...p,
            isReturn: false,
        })),
        boardingPoint: points.boarding,
        droppingPoint: points.dropping,
      };

      const response = await fetch("/api/admin/booking/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Walk-in booking created successfully");
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to create booking");
      }
    } catch (error) {
      toast.error("An error occurred while creating the booking");
    } finally {
      setLoading(false);
    }
  };

  if (!trip) return null;

  const totalAmount = calculateTotalPrice();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-w-5xl h-[95vh] md:h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-4 md:p-6 bg-teal-600 text-white shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
            <div>
              <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 md:w-6 md:h-6" /> Quick Boarding
              </DialogTitle>
              <DialogDescription className="text-teal-50 text-xs md:text-sm">
                {trip.routeOrigin} → {trip.routeDestination} • {trip.departureTime}
              </DialogDescription>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <div className="text-[10px] uppercase font-bold opacity-70">Total Due</div>
              <div className="text-2xl md:text-3xl font-extrabold">P{totalAmount}</div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="flex border-b">
            <button 
              onClick={() => setActiveTab("details")}
              className={cn(
                "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "details" ? "border-teal-600 text-teal-600 bg-teal-50/50" : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              1. Passenger Details
            </button>
            <button 
              onClick={() => setActiveTab("seats")}
              className={cn(
                "flex-1 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "seats" ? "border-teal-600 text-teal-600 bg-teal-50/50" : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              2. Seat Selection ({passengers.filter(p => p.seatNumber).length}/{passengers.length})
            </button>
          </div>

          <div className="p-4 md:p-6">
            {activeTab === "details" ? (
              <div className="space-y-6 md:space-y-8">
                {/* Contact & Route Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-100">
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Boarding Points
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label>Pick-up Location</Label>
                                <Select value={points.boarding} onValueChange={(val) => setPoints({...points, boarding: val})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {boardingOptions.map(opt => (
                                            <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Drop-off Location</Label>
                                <Select value={points.dropping} onValueChange={(val) => setPoints({...points, dropping: val})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {droppingOptions.map(opt => (
                                            <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <CreditCard className="w-4 h-4" /> Payment Status
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label>Payment Method</Label>
                                <Select value={contactInfo.paymentMode} onValueChange={(val) => setContactInfo({...contactInfo, paymentMode: val})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cash">Cash (Instant Confirm)</SelectItem>
                                        <SelectItem value="Swipe in Person">Card Swipe (Instant Confirm)</SelectItem>
                                        <SelectItem value="Bank Deposit">Bank Deposit (Pending)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Primary Contact Email (Optional)</Label>
                                <Input 
                                    placeholder="email@example.com"
                                    value={contactInfo.email}
                                    onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Passengers Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold text-gray-800">Passengers</h4>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddPassenger}
                      className="text-teal-600 border-teal-600 hover:bg-teal-50"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Person
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {passengers.map((passenger, index) => (
                      <div key={index} className="relative p-4 md:p-6 border rounded-xl md:rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                        {passengers.length > 1 && (
                          <button 
                            onClick={() => handleRemovePassenger(index)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                        )}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                                {index + 1}
                            </div>
                            <span className="font-bold text-gray-700">Passenger Details</span>
                            {passenger.seatNumber ? (
                                <span className="ml-2 bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">
                                    Seat {passenger.seatNumber}
                                </span>
                            ) : (
                                <span className="ml-2 bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs">
                                    No seat selected
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Select value={passenger.title} onValueChange={(val) => updatePassenger(index, "title", val)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Mr">Mr</SelectItem>
                                <SelectItem value="Ms">Ms</SelectItem>
                                <SelectItem value="Mrs">Mrs</SelectItem>
                                <SelectItem value="Miss">Miss</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-1 space-y-2">
                            <Label>First Name</Label>
                            <Input value={passenger.firstName} onChange={(e) => updatePassenger(index, "firstName", e.target.value)} />
                          </div>
                          <div className="md:col-span-1 space-y-2">
                            <Label>Last Name</Label>
                            <Input value={passenger.lastName} onChange={(e) => updatePassenger(index, "lastName", e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={passenger.type} onValueChange={(val) => updatePassenger(index, "type", val)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="adult">Adult</SelectItem>
                                <SelectItem value="child">Child (Under 12)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Passport/ID Number</Label>
                                <Input value={passenger.passportNumber} onChange={(e) => updatePassenger(index, "passportNumber", e.target.value)} />
                            </div>
                            <div className="flex items-center gap-6 h-full pt-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`infant-${index}`} 
                                        checked={passenger.hasInfant} 
                                        onCheckedChange={(val) => updatePassenger(index, "hasInfant", !!val)} 
                                    />
                                    <Label htmlFor={`infant-${index}`} className="flex items-center gap-1 cursor-pointer">
                                        <Baby className="w-4 h-4 text-pink-500" /> Traveling with infant?
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {passenger.hasInfant && (
                            <div className="mt-4 p-4 bg-pink-50/50 rounded-xl border border-pink-100 animate-in fade-in slide-in-from-top-2">
                                <h5 className="text-xs font-bold text-pink-700 uppercase mb-3 flex items-center gap-1">
                                    <Baby className="w-3 h-3" /> Infant Details (+P250)
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Infant Full Name</Label>
                                        <Input className="h-8" value={passenger.infantName} onChange={(e) => updatePassenger(index, "infantName", e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Passport/ID</Label>
                                        <Input className="h-8" value={passenger.infantPassportNumber} onChange={(e) => updatePassenger(index, "infantPassportNumber", e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Birthdate</Label>
                                        <Input type="date" className="h-8" value={passenger.infantBirthdate} onChange={(e) => updatePassenger(index, "infantBirthdate", e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
                /* Visual Seat Map Section */
              <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1 space-y-4">
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 flex items-start gap-3">
                          <Info className="w-5 h-5 text-orange-500 mt-0.5" />
                          <div>
                              <p className="text-sm font-bold text-orange-900">Seat Assignment</p>
                              <p className="text-xs text-orange-700">Click a seat to assign it to the next unseated passenger.</p>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                          <h4 className="font-bold text-gray-700 mb-2">Assigning to:</h4>
                          {passengers.map((p, idx) => (
                              <div key={idx} className={cn(
                                  "p-3 rounded-lg border flex justify-between items-center transition-all",
                                  p.seatNumber ? "bg-teal-50 border-teal-200" : "bg-white border-gray-200 shadow-sm ring-1 ring-teal-500 ring-offset-1"
                              )}>
                                 <div className="flex items-center gap-2">
                                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", p.seatNumber ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-600")}>
                                          {idx + 1}
                                      </div>
                                      <span className="text-sm font-medium">{p.firstName || "New"} {p.lastName || "Passenger"}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     {p.seatNumber ? (
                                         <>
                                            <span className="text-sm font-bold text-teal-700">Seat {p.seatNumber}</span>
                                            <button onClick={() => updatePassenger(idx, "seatNumber", "")} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                         </>
                                     ) : (
                                         <span className="text-xs text-orange-600 animate-pulse font-bold uppercase">Pending Selection...</span>
                                     )}
                                 </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Bus Map */}
                  <div className="relative border-4 border-gray-100 rounded-[3rem] p-8 pt-16 bg-white shadow-inner max-w-sm mx-auto">
                      {/* Driver & Door - Flipped positions as requested: Door Left, Driver Right */}
                      <div className="absolute top-4 left-8 right-8 flex justify-between items-center px-4">
                          <div className="w-12 h-6 bg-yellow-100 border-2 border-yellow-200 rounded-sm text-[8px] font-bold text-yellow-600 flex items-center justify-center">DOOR</div>
                          <div className="w-12 h-12 bg-gray-100 border-2 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-400">DRIVER</div>
                      </div>

                      <div className="space-y-4">
                          {seatGrid.map((row) => (
                              <div key={row.row} className="flex items-center gap-3">
                                  <div className="w-4 text-[10px] font-bold text-gray-300 text-center">{row.row}</div>
                                  {!row.isBack ? (
                                      <>
                                        <div className="flex gap-1.5">
                                            {row.left?.map(seatId => {
                                                const isOccupied = unavailable.has(seatId);
                                                const isSelected = passengers.some(p => p.seatNumber === seatId);
                                                return (
                                                    <button
                                                        key={seatId}
                                                        disabled={isOccupied && !isSelected}
                                                        onClick={() => isSelected ? null : handleSeatSelect(seatId)}
                                                        className={cn(
                                                            "w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold border-2 transition-all",
                                                            isSelected 
                                                                ? "bg-teal-600 border-teal-700 text-white shadow-md scale-110" 
                                                                : isOccupied 
                                                                    ? "bg-orange-100 border-orange-200 text-orange-400 cursor-not-allowed" 
                                                                    : "bg-white border-gray-200 text-gray-500 hover:border-teal-500 hover:bg-teal-50"
                                                        )}
                                                    >
                                                        <Armchair className={cn("w-4 h-4 mb-0.5", isSelected ? "text-white" : isOccupied ? "text-orange-300" : "text-gray-400")} />
                                                        {seatId}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="w-10 h-10 border-x border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50">
                                            <div className="w-[1px] h-full bg-gray-200" />
                                        </div>
                                        <div className="flex gap-1.5">
                                            {row.right?.map(seatId => {
                                                const isOccupied = unavailable.has(seatId);
                                                const isSelected = passengers.some(p => p.seatNumber === seatId);
                                                return (
                                                    <button
                                                        key={seatId}
                                                        disabled={isOccupied && !isSelected}
                                                        onClick={() => isSelected ? null : handleSeatSelect(seatId)}
                                                        className={cn(
                                                            "w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold border-2 transition-all",
                                                            isSelected 
                                                                ? "bg-teal-600 border-teal-700 text-white shadow-md scale-110" 
                                                                : isOccupied 
                                                                    ? "bg-orange-100 border-orange-200 text-orange-400 cursor-not-allowed" 
                                                                    : "bg-white border-gray-200 text-gray-500 hover:border-teal-500 hover:bg-teal-50"
                                                        )}
                                                    >
                                                        <Armchair className={cn("w-4 h-4 mb-0.5", isSelected ? "text-white" : isOccupied ? "text-orange-300" : "text-gray-400")} />
                                                        {seatId}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                      </>
                                  ) : (
                                      <div className="flex gap-1.5 w-full justify-center">
                                          {row.seats?.map(seatId => {
                                              const isOccupied = unavailable.has(seatId);
                                              const isSelected = passengers.some(p => p.seatNumber === seatId);
                                              return (
                                                  <button
                                                      key={seatId}
                                                      disabled={isOccupied && !isSelected}
                                                      onClick={() => isSelected ? null : handleSeatSelect(seatId)}
                                                      className={cn(
                                                          "w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold border-2 transition-all",
                                                          isSelected 
                                                              ? "bg-teal-600 border-teal-700 text-white shadow-md scale-110" 
                                                              : isOccupied 
                                                                  ? "bg-orange-100 border-orange-200 text-orange-400 cursor-not-allowed" 
                                                                  : "bg-white border-gray-200 text-gray-500 hover:border-teal-500 hover:bg-teal-50"
                                                      )}
                                                  >
                                                      <Armchair className={cn("w-4 h-4 mb-0.5", isSelected ? "text-white" : isOccupied ? "text-orange-300" : "text-gray-400")} />
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
          </div>
        </div>

        <DialogFooter className="p-4 md:p-6 bg-gray-50 border-t shrink-0">
          <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">
              <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-sm w-full md:w-auto">
                  <div className="flex-1 md:flex-none p-2 bg-white rounded border flex items-center justify-center md:justify-start gap-2">
                      <User className="w-3 h-3 md:w-4 md:h-4 text-teal-600" />
                      <span className="font-bold">{passengers.length} Pax</span>
                  </div>
                  <div className="flex-1 md:flex-none p-2 bg-white rounded border flex items-center justify-center md:justify-start gap-2">
                      <Armchair className="w-3 h-3 md:w-4 md:h-4 text-orange-600" />
                      <span className="font-bold">{passengers.filter(p => p.seatNumber).length} Seats</span>
                  </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 md:flex-none h-10 md:h-12 px-4 md:px-6">
                    Cancel
                </Button>
                {activeTab === "details" ? (
                    <Button 
                        onClick={() => setActiveTab("seats")} 
                        className="flex-1 md:flex-none h-10 md:h-12 px-6 md:px-8 bg-teal-600 hover:bg-teal-700 text-white font-bold"
                    >
                        Next: Seats
                    </Button>
                ) : (
                    <Button 
                        onClick={handleSubmit} 
                        disabled={loading} 
                        className="flex-1 md:flex-none h-10 md:h-12 px-6 md:px-10 bg-orange-600 hover:bg-orange-700 text-white font-extrabold"
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                        Confirm
                    </Button>
                )}
              </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
