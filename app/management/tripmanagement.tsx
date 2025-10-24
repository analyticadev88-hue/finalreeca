import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, MapPin, Clock, AlertTriangle, X } from "lucide-react";
import { format, addDays } from "date-fns";
import { Booking } from "@/lib/types";

interface TripManagementProps {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
}

export default function TripManagement({ bookings, setBookings }: TripManagementProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showAddonsDialog, setShowAddonsDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState<Date>();
  const [newTime, setNewTime] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [addonsPrice, setAddonsPrice] = useState(0);
  const [finalizing, setFinalizing] = useState(false);

  // Helper to get trip details
  const getTrip = (booking: any) => booking.trip || {};
  const getReturnTrip = (booking: any) => booking.returnTrip || {};
  const getSeats = (booking: any) => (booking.seats ? booking.seats.split(",") : []);

  // Helper for date checks
  const getDepartureDate = (booking: any) => getTrip(booking).departureDate ? new Date(getTrip(booking).departureDate) : null;
  const isChangeAllowed = (booking: any) => {
    const depDate = getDepartureDate(booking);
    return depDate && depDate > addDays(new Date(), 1);
  };

  const handleCancelTrip = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelDialog(true);
  };

  const handleRescheduleTrip = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowRescheduleDialog(true);
  };

  const handleAddons = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowAddonsDialog(true);
    setSelectedAddons([]);
    setAddonsPrice(0);
  };

  const confirmCancel = () => {
    if (selectedBooking) {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === selectedBooking.id ? { ...booking, bookingStatus: "Cancelled" } : booking
        )
      );
    }
    setShowCancelDialog(false);
    setSelectedBooking(null);
    setCancelReason("");
  };

  const confirmReschedule = () => {
    if (selectedBooking && newDate && newTime) {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === selectedBooking.id ? { ...booking, date: newDate, time: newTime } : booking
        )
      );
    }
    setShowRescheduleDialog(false);
    setSelectedBooking(null);
    setNewDate(undefined);
    setNewTime("");
  };

  const confirmAddons = async () => {
    // Call backend to update booking with addons and handle payment if needed
    // For demo, just update local state
    if (selectedBooking) {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === selectedBooking.id
            ? { ...booking, addons: selectedAddons, addonsPrice }
            : booking
        )
      );
    }
    setShowAddonsDialog(false);
    setSelectedBooking(null);
    setSelectedAddons([]);
    setAddonsPrice(0);
  };

  const handleFinalizeReschedule = async () => {
    setFinalizing(true);
    const res = await fetch("/api/booking/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: selectedBooking?.orderId,
        newDepartureDate: newDate ? format(newDate, "yyyy-MM-dd") : undefined,
        newDepartureTime: newTime,
        newReturnDate: selectedBooking?.returnTripId ? newDate ? format(newDate, "yyyy-MM-dd") : undefined : undefined,
        newReturnTime: selectedBooking?.returnTripId ? newTime : undefined,
      }),
    });
    const result = await res.json();
    if (result.success) {
      setBookings([result.booking]);
      setShowRescheduleDialog(false);
      alert("Booking rescheduled successfully!");
    } else {
      alert("Reschedule failed: " + result.error);
    }
    setFinalizing(false);
  };

  // Example route times data
  const routeTimes: Record<string, string[]> = {
    "Gaborone to OR Tambo": ["07:00", "15:00"],
    "OR Tambo to Gaborone": ["10:00", "18:00"],
  };

  const [selectedRoute, setSelectedRoute] = useState(getTrip(bookings[0])?.routeName);
  const [selectedTime, setSelectedTime] = useState("");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 text-gray-800">Manage Your Trips</h2>
        <p className="text-gray-600">View, reschedule, or cancel your Reeca Travel bookings</p>
      </div>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id} className="border-0 shadow-lg border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge
                    className={`px-3 py-1 ${
                      booking.bookingStatus === "confirmed"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-red-100 text-red-800 border-red-300"
                    }`}
                  >
                    {booking.bookingStatus === "confirmed" ? "Confirmed" : "Cancelled"}
                  </Badge>
                  <span className="font-bold text-lg text-gray-800">#{booking.orderId}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-teal-600">P {booking.totalPrice}</div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span className="font-semibold">{getTrip(booking).routeName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-teal-600" />
                    <span className="">{getTrip(booking).departureDate ? format(new Date(getTrip(booking).departureDate), "EEEE, MMMM do, yyyy") : "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span className="">{getTrip(booking).departureTime}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600">Bus: </span>
                    <span className="font-semibold">{getTrip(booking).bus || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Seats: </span>
                    <span className="font-semibold">{getSeats(booking).join(", ")}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Passengers: </span>
                    <span className="font-semibold">{getSeats(booking).length}</span>
                  </div>
                </div>
              </div>

              {booking.bookingStatus === "confirmed" && (
                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => handleRescheduleTrip(booking)}
                    className="flex-1 border-teal-600 text-teal-600 hover:bg-teal-50"
                    disabled={!isChangeAllowed(booking)}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAddons(booking)}
                    className="flex-1 border-amber-600 text-amber-600 hover:bg-amber-50"
                  >
                    Add Addons
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelTrip(booking)}
                    className="flex-1"
                    disabled={!isChangeAllowed(booking)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Trip
                  </Button>
                </div>
              )}

              {getDepartureDate(booking) && getDepartureDate(booking)! < addDays(new Date(), 1) && booking.bookingStatus === "confirmed" && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">Changes not allowed within 24 hours of departure</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Cancel Trip
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this trip? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBooking && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Trip:</strong> {getTrip(selectedBooking).routeName}
                  </div>
                  <div>
                    <strong>Date:</strong> {getTrip(selectedBooking).departureDate ? format(new Date(getTrip(selectedBooking).departureDate), "PPP") : "N/A"}
                  </div>
                  <div>
                    <strong>Time:</strong> {getTrip(selectedBooking).departureTime}
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="cancelReason">Reason for cancellation (optional)</Label>
              <Textarea
                id="cancelReason"
                placeholder="Please let us know why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)} className="flex-1">
                Keep Trip
              </Button>
              <Button variant="destructive" onClick={confirmCancel} className="flex-1">
                Cancel Trip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-teal-500" />
              Reschedule Trip
            </DialogTitle>
            <DialogDescription>Select a new date and time for your trip.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedBooking && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Current Trip:</strong> {getTrip(selectedBooking).routeName}
                  </div>
                  <div>
                    <strong>Current Date:</strong> {getTrip(selectedBooking).departureDate ? format(new Date(getTrip(selectedBooking).departureDate), "PPP") : "N/A"}
                  </div>
                  <div>
                    <strong>Current Time:</strong> {getTrip(selectedBooking).departureTime}
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label>New Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start mt-1">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDate ? format(newDate, "PPP") : "Select new date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    initialFocus
                    disabled={(date) => date < addDays(new Date(), 1)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>New Time</Label>
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select new time" />
                </SelectTrigger>
                <SelectContent>
                  {(selectedBooking &&
                    routeTimes[
                      getTrip(selectedBooking).routeName || ""
                    ])?.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowRescheduleDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleFinalizeReschedule}
                disabled={!newDate || !newTime || finalizing}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              >
                {finalizing ? "Finalizing..." : "Finalize Reschedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddonsDialog} onOpenChange={setShowAddonsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Add Addons
            </DialogTitle>
            <DialogDescription>
              Select addons to enhance your trip. Some may require additional payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">Choose Addons:</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedAddons.includes("baggage-insurance")}
                    onChange={e => {
                      setSelectedAddons(prev =>
                        e.target.checked
                          ? [...prev, "baggage-insurance"]
                          : prev.filter(a => a !== "baggage-insurance")
                      );
                      setAddonsPrice(prev => e.target.checked ? prev + 50 : prev - 50);
                    }}
                  />
                  Baggage Insurance (+P50)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedAddons.includes("extra-baggage")}
                    onChange={e => {
                      setSelectedAddons(prev =>
                        e.target.checked
                          ? [...prev, "extra-baggage"]
                          : prev.filter(a => a !== "extra-baggage")
                      );
                      setAddonsPrice(prev => e.target.checked ? prev + 30 : prev - 30);
                    }}
                  />
                  Extra Baggage (+P30)
                </label>
              </div>
            </div>
            <div className="font-bold text-teal-700">Total Addons Price: P{addonsPrice}</div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAddonsDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={confirmAddons}
                disabled={selectedAddons.length === 0}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Add Addons
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
