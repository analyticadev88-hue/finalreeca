"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, X, User, Users, Phone, ShieldAlert, Baby, Armchair, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AdminSeatPicker } from "./AdminSeatPicker";

interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  seat: string;
  title: string;
  type: string;
  passportNumber: string;
  phone?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  hasInfant: boolean;
  infantName?: string;
  infantBirthdate?: string;
  infantPassportNumber?: string;
}

interface AmendBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onSuccess: () => void;
}

export function AmendBookingModal({ isOpen, onClose, booking, onSuccess }: AmendBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    contactDetails: {
      name: "",
      email: "",
      mobile: "",
      idNumber: "",
    },
    emergencyContact: {
      name: "",
      phone: "",
    },
    passengers: [] as Passenger[],
  });

  const [activeSeatPicker, setActiveSeatPicker] = useState<{ index: number; tripId: string } | null>(null);

  const [fullBooking, setFullBooking] = useState<any>(null);

  useEffect(() => {
    async function fetchFullDetails() {
      if (!booking?.bookingRef) return;
      
      // If we already have passengers/passengerList as an array, we might not need to fetch
      if (Array.isArray(booking.passengerList) && booking.passengerList.length > 0) {
        setFullBooking(booking);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/booking/${booking.bookingRef}`);
        const data = await response.json();
        if (data && !data.error) {
          setFullBooking(data);
        } else {
          setFullBooking(booking);
        }
      } catch (err) {
        console.error("Failed to fetch full booking details:", err);
        setFullBooking(booking);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen && booking) {
      fetchFullDetails();
    } else {
      setFullBooking(null);
    }
  }, [isOpen, booking]);

  useEffect(() => {
    if (fullBooking) {
      setFormData({
        contactDetails: {
          name: fullBooking.userName || fullBooking.passengerName || "",
          email: fullBooking.email || fullBooking.userEmail || "",
          mobile: fullBooking.phone || fullBooking.userPhone || "",
          idNumber: fullBooking.contactDetails?.idNumber || fullBooking.contactIdNumber || "",
        },
        emergencyContact: {
          name: fullBooking.emergencyContact?.name || fullBooking.emergencyContactName || "",
          phone: fullBooking.emergencyContact?.phone || fullBooking.emergencyContactPhone || "",
        },
        passengers: (Array.isArray(fullBooking.passengerList) ? fullBooking.passengerList : Array.isArray(fullBooking.passengers) ? fullBooking.passengers : []).map((p: any) => ({
          id: p.id,
          firstName: p.name ? p.name.split(" ")[0] : (p.firstName || ""),
          lastName: p.name ? p.name.split(" ").slice(1).join(" ") : (p.lastName || ""),
          seat: p.seat || p.seatNumber || "",
          title: p.title || "Mr",
          type: (p.type || "adult").toLowerCase(),
          passportNumber: p.passportNumber || "",
          phone: p.phone || "",
          nextOfKinName: p.nextOfKinName || "",
          nextOfKinPhone: p.nextOfKinPhone || p.nokPhone || "",
          hasInfant: !!p.hasInfant,
          infantName: p.infantName || "",
          infantBirthdate: p.infantBirthdate || "",
          infantPassportNumber: p.infantPassportNumber || "",
        })),
      });
    }
  }, [fullBooking]);

  const handlePassengerChange = (index: number, field: string, value: any) => {
    const updatedPassengers = [...formData.passengers];
    updatedPassengers[index] = { ...updatedPassengers[index], [field]: value };
    setFormData({ ...formData, passengers: updatedPassengers });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/booking/${booking.bookingRef}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Booking updated successfully");
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || "Failed to update booking");
      }
    } catch (error) {
      toast.error("An error occurred while updating the booking");
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 bg-teal-700 text-white shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" /> Amend Booking: {booking.bookingRef}
          </DialogTitle>
          <DialogDescription className="text-teal-100">
            Update passenger identities and contact records for this journey.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* Main Contact Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-teal-800 font-bold uppercase text-xs tracking-wider">
               <User className="w-4 h-4" /> Primary Contact Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-gray-400">Full Name</Label>
                <Input 
                   className="bg-white"
                   value={formData.contactDetails.name} 
                   onChange={(e) => setFormData({...formData, contactDetails: {...formData.contactDetails, name: e.target.value}})}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-gray-400">Email Address</Label>
                <Input 
                   className="bg-white"
                   value={formData.contactDetails.email} 
                   onChange={(e) => setFormData({...formData, contactDetails: {...formData.contactDetails, email: e.target.value}})}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-gray-400">Mobile Phone</Label>
                <Input 
                   className="bg-white"
                   value={formData.contactDetails.mobile} 
                   onChange={(e) => setFormData({...formData, contactDetails: {...formData.contactDetails, mobile: e.target.value}})}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-gray-400">ID / Passport Number</Label>
                <Input 
                   className="bg-white"
                   value={formData.contactDetails.idNumber} 
                   onChange={(e) => setFormData({...formData, contactDetails: {...formData.contactDetails, idNumber: e.target.value}})}
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-teal-800 font-bold uppercase text-xs tracking-wider">
               <ShieldAlert className="w-4 h-4" /> Emergency Contact Details
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50/30 p-4 rounded-xl border border-orange-100/50">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-gray-400">Emergency Contact Name</Label>
                <Input 
                   className="bg-white"
                   value={formData.emergencyContact.name} 
                   onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, name: e.target.value}})}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-gray-400">Emergency Phone</Label>
                <Input 
                   className="bg-white"
                   value={formData.emergencyContact.phone} 
                   onChange={(e) => setFormData({...formData, emergencyContact: {...formData.emergencyContact, phone: e.target.value}})}
                />
              </div>
            </div>
          </div>

          {/* Passengers Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-teal-800 font-bold uppercase text-xs tracking-wider">
               <Users className="w-4 h-4" /> Passenger Information
            </div>
            
            {formData.passengers.map((passenger: Passenger, index: number) => (
              <div key={index} className="border rounded-2xl overflow-hidden shadow-sm">
                 <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center">
                     <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-teal-50 border border-teal-100 rounded text-teal-700">
                           <Armchair className="w-3.5 h-3.5" />
                           <span className="font-bold text-xs">SEAT {passenger.seat}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-[10px] text-teal-600 hover:text-teal-700 hover:bg-teal-50 gap-1"
                          onClick={() => setActiveSeatPicker({ 
                            index: index, 
                            tripId: passenger.isReturn && booking.returnTripId ? booking.returnTripId : booking.tripId 
                          })}
                        >
                           Change <ChevronRight className="w-3 h-3" />
                        </Button>

                        <Select value={passenger.title} onValueChange={(val) => handlePassengerChange(index, "title", val)}>
                            <SelectTrigger className="w-24 h-8 text-xs bg-white">
                              <SelectValue placeholder="Title" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mr">Mr</SelectItem>
                              <SelectItem value="Ms">Ms</SelectItem>
                              <SelectItem value="Mrs">Mrs</SelectItem>
                              <SelectItem value="Miss">Miss</SelectItem>
                              <SelectItem value="Dr">Dr</SelectItem>
                            </SelectContent>
                          </Select>
                     </div>
                 </div>
                 
                 <div className="p-5 space-y-6 bg-white">
                    {/* Primary Passenger Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-gray-400">First Name</Label>
                            <Input value={passenger.firstName} onChange={(e) => handlePassengerChange(index, "firstName", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-gray-400">Last Name</Label>
                            <Input value={passenger.lastName} onChange={(e) => handlePassengerChange(index, "lastName", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-gray-400">Passport / ID</Label>
                            <Input value={passenger.passportNumber} onChange={(e) => handlePassengerChange(index, "passportNumber", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-gray-400">Personal Phone</Label>
                            <Input value={passenger.phone} onChange={(e) => handlePassengerChange(index, "phone", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] uppercase font-bold text-gray-400">Traveler Type</Label>
                            <Select value={passenger.type} onValueChange={(val) => handlePassengerChange(index, "type", val)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="adult">Adult</SelectItem>
                                    <SelectItem value="child">Child</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Next of Kin (Passenger Level) */}
                    <div className="pt-4 border-t border-dashed">
                        <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-gray-400 uppercase">
                            <Phone className="w-3 h-3" /> Next of Kin / Companion Contact
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-gray-500">Full Name</Label>
                                <Input value={passenger.nextOfKinName} onChange={(e) => handlePassengerChange(index, "nextOfKinName", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] text-gray-500">Phone Number</Label>
                                <Input value={passenger.nextOfKinPhone} onChange={(e) => handlePassengerChange(index, "nextOfKinPhone", e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Infant Details Section */}
                    <div className="pt-4 border-t border-dashed">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                                <Baby className="w-3 h-3" /> Infant Traveling With Passenger
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`infant-${index}`} 
                                    checked={passenger.hasInfant} 
                                    onCheckedChange={(val) => handlePassengerChange(index, "hasInfant", !!val)}
                                />
                                <Label htmlFor={`infant-${index}`} className="text-xs font-semibold text-teal-700 cursor-pointer">Traveling with Infant</Label>
                            </div>
                        </div>

                        {passenger.hasInfant && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-teal-50/50 p-4 rounded-xl border border-teal-100/50">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-teal-600 font-bold uppercase">Infant Full Name</Label>
                                    <Input className="bg-white border-teal-200" value={passenger.infantName} onChange={(e) => handlePassengerChange(index, "infantName", e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-teal-600 font-bold uppercase">Date of Birth</Label>
                                    <Input className="bg-white border-teal-200" type="date" value={passenger.infantBirthdate} onChange={(e) => handlePassengerChange(index, "infantBirthdate", e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] text-teal-600 font-bold uppercase">Certificate / Passport</Label>
                                    <Input className="bg-white border-teal-200" value={passenger.infantPassportNumber} onChange={(e) => handlePassengerChange(index, "infantPassportNumber", e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t sticky bottom-0 gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading} className="h-11">
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-teal-600 hover:bg-teal-700 h-11 px-8 font-bold">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Apply Amendments
          </Button>
        </DialogFooter>
      </DialogContent>

      {activeSeatPicker && (
        <AdminSeatPicker 
          isOpen={!!activeSeatPicker}
          onClose={() => setActiveSeatPicker(null)}
          tripId={activeSeatPicker.tripId}
          currentSeat={formData.passengers[activeSeatPicker.index].seat}
          currentlySelectedByOtherPassengers={formData.passengers
            .filter((_, idx) => idx !== activeSeatPicker.index)
            .filter(p => (p.isReturn && booking.returnTripId ? booking.returnTripId : booking.tripId) === activeSeatPicker.tripId)
            .map(p => p.seat)}
          onSelect={(newSeat) => {
            handlePassengerChange(activeSeatPicker.index, "seat", newSeat);
            setActiveSeatPicker(null);
            toast.info(`Seat reassigned to ${newSeat}`);
          }}
        />
      )}
    </Dialog>
  );
}
