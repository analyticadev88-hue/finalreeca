"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Search, CheckCircle, XCircle, QrCode, Download, Users, ChevronLeft, ChevronRight, Mail, CalendarClock, Edit3, Utensils, Calendar, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrintableTicket } from "@/components/printable-ticket";
import * as XLSX from "xlsx";
import { AmendBookingModal } from "@/components/admin/AmendBookingModal";
import { RescheduleSeatPicker } from "@/components/admin/RescheduleSeatPicker";

// Define color scheme
const colors = {
  primary: '#009393',       // Teal
  secondary: '#febf00',     // Gold
  accent: '#958c55',        // Olive
  muted: '#f5f5f5',         // Light gray
  dark: '#1a1a1a',          // Dark gray
  light: '#ffffff',         // White
  destructive: '#ef4444'    // Red
};

interface Passenger {
  name: string;
  seat: string;
  title?: string;
  isReturn?: boolean;
  type?: string;
  passportNumber?: string;
  hasInfant?: boolean;
  infantName?: string;
  infantBirthdate?: string;
  infantPassportNumber?: string;
}

interface TripData {
  id?: string;
  route: string;
  date: Date | string;
  time: string;
  bus: string;
  boardingPoint: string;
  droppingPoint: string;
  seats: string[];
  passengers?: Passenger[];
}

interface Booking {
  id: string;
  bookingRef: string;
  passengerName: string;
  purchaserName: string;
  email: string;
  phone: string;
  passengers: number;
  returnPassengers?: number;
  totalPassengers?: number;
  route: string;
  date: Date | string;
  time: string;
  bus: string;
  boardingPoint: string;
  droppingPoint: string;
  seats: string[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  bookingStatus: string;
  specialRequests?: string;
  passengerList?: Passenger[];
  trip?: { id?: string };
  returnTrip?: TripData;
  addons?: any;
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingData, setSelectedBookingData] = useState<any>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showPrintTicket, setShowPrintTicket] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, tomorrow, custom
  const [customDate, setCustomDate] = useState<string>("");
  const [routeFilter, setRouteFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showSendTicketModal, setShowSendTicketModal] = useState(false);
  const [newDepartureDate, setNewDepartureDate] = useState("");
  const [newDepartureTime, setNewDepartureTime] = useState("");
  const [newReturnDate, setNewReturnDate] = useState("");
  const [newReturnTime, setNewReturnTime] = useState("");
  const [changeRoute, setChangeRoute] = useState(false);
  const [newRouteOrigin, setNewRouteOrigin] = useState("");
  const [newRouteDestination, setNewRouteDestination] = useState("");
  const [newRouteName, setNewRouteName] = useState("");
  const [newBoardingPoint, setNewBoardingPoint] = useState("");
  const [newDroppingPoint, setNewDroppingPoint] = useState("");
  const [overridePrice, setOverridePrice] = useState(false);
  const [newTotalPrice, setNewTotalPrice] = useState("");
  const [email, setEmail] = useState("");
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [markPaidLoading, setMarkPaidLoading] = useState(false);
  const [nullifyLoading, setNullifyLoading] = useState(false);
  const [sendTicketLoading, setSendTicketLoading] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'success' | 'error' | null>(null);

  // Trip-selection reschedule state
  const [departureDatePicker, setDepartureDatePicker] = useState("");
  const [returnDatePicker, setReturnDatePicker] = useState("");
  const [availableDepartureTrips, setAvailableDepartureTrips] = useState<any[]>([]);
  const [availableReturnTrips, setAvailableReturnTrips] = useState<any[]>([]);
  const [selectedDepartureTripId, setSelectedDepartureTripId] = useState<string>("");
  const [selectedReturnTripId, setSelectedReturnTripId] = useState<string>("");
  const [selectedDepartureSeats, setSelectedDepartureSeats] = useState<string[]>([]);
  const [selectedReturnSeats, setSelectedReturnSeats] = useState<string[]>([]);
  const [expandedDepartureTripId, setExpandedDepartureTripId] = useState<string>("");
  const [expandedReturnTripId, setExpandedReturnTripId] = useState<string>("");
  const [fetchingTrips, setFetchingTrips] = useState(false);

  // Compute unique routes and times from bookings for filter dropdowns
  const uniqueRoutes = Array.from(new Set(bookings.map(b => b.route).filter(Boolean))).sort();
  const uniqueTimes = Array.from(new Set(bookings.map(b => b.time).filter(Boolean))).sort((a, b) => a.localeCompare(b));

  // Today's route summary for quick focus (includes outbound AND return trips for today)
  const todaySummary = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const summary: Record<string, { count: number; times: Record<string, number> }> = {};
    bookings.forEach(b => {
      const bDate = new Date(b.date);
      bDate.setHours(0, 0, 0, 0);
      const rDate = b.returnTrip ? new Date(b.returnTrip.date) : null;
      if (rDate) rDate.setHours(0, 0, 0, 0);

      const isOutboundToday = bDate.getTime() === today.getTime();
      const isReturnToday = rDate?.getTime() === today.getTime();

      if (isOutboundToday) {
        if (!summary[b.route]) summary[b.route] = { count: 0, times: {} };
        summary[b.route].count += 1;
        summary[b.route].times[b.time] = (summary[b.route].times[b.time] || 0) + 1;
      }
      if (isReturnToday && b.returnTrip) {
        const returnRoute = b.returnTrip.route;
        if (!summary[returnRoute]) summary[returnRoute] = { count: 0, times: {} };
        summary[returnRoute].count += 1;
        summary[returnRoute].times[b.returnTrip.time] = (summary[returnRoute].times[b.returnTrip.time] || 0) + 1;
      }
    });
    return summary;
  })();

  const formatDate = (date: Date | string | undefined, formatStr: string) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "N/A";

    const options: Intl.DateTimeFormatOptions = {};
    if (formatStr.includes("EEEE")) options.weekday = "long";
    if (formatStr.includes("MMMM")) options.month = "long";
    else if (formatStr.includes("MMM")) options.month = "short";
    if (formatStr.includes("dd")) options.day = "2-digit";
    if (formatStr.includes("yyyy")) options.year = "numeric";

    return dateObj.toLocaleDateString("en-US", options);
  };

  const toInputDate = (date: Date | string | undefined): string => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper to refetch bookings
  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/admin/booking", { credentials: 'include' });
      if (!response.ok) throw new Error("Failed to fetch bookings");
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Reset to page 1 whenever any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentMethodFilter, dateFilter, customDate, routeFilter, timeFilter]);

  // Pre-fill reschedule form with current booking data when modal opens
  useEffect(() => {
    if (showRescheduleModal && selectedBooking) {
      setDepartureDatePicker(toInputDate(selectedBooking.date));
      setReturnDatePicker(selectedBooking.returnTrip ? toInputDate(selectedBooking.returnTrip.date) : "");
      setSelectedDepartureTripId("");
      setSelectedReturnTripId("");
      setSelectedDepartureSeats([]);
      setSelectedReturnSeats([]);
      setExpandedDepartureTripId("");
      setExpandedReturnTripId("");
      setAvailableDepartureTrips([]);
      setAvailableReturnTrips([]);
      setChangeRoute(false);
      setNewRouteOrigin('');
      setNewRouteDestination('');
      setNewRouteName('');
      setNewBoardingPoint('');
      setNewDroppingPoint('');
      setOverridePrice(false);
      setNewTotalPrice('');
    }
  }, [showRescheduleModal, selectedBooking]);

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.purchaserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.passengerList || []).some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      booking.bookingRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.time.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "pending" ?
        booking.paymentStatus?.toLowerCase() === "pending" :
        statusFilter === "confirmed" ? 
          ["confirmed", "completed"].includes(booking.bookingStatus.toLowerCase()) :
          booking.bookingStatus.toLowerCase() === statusFilter);
    const matchesPaymentMethod = paymentMethodFilter === "all" ||
      booking.paymentMethod === paymentMethodFilter;
    const matchesRoute = routeFilter === "all" ||
      booking.route === routeFilter;
    const matchesTime = timeFilter === "all" ||
      booking.time === timeFilter;

    // Date filtering - checks BOTH outbound and return trip dates
    const bookingDate = new Date(booking.date);
    const returnDate = booking.returnTrip ? new Date(booking.returnTrip.date) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const bDate = new Date(bookingDate);
    bDate.setHours(0, 0, 0, 0);
    const rDate = returnDate ? new Date(returnDate) : null;
    if (rDate) rDate.setHours(0, 0, 0, 0);

    let matchesDate = true;
    if (dateFilter === "today") {
      matchesDate = bDate.getTime() === today.getTime() || (rDate?.getTime() === today.getTime());
    } else if (dateFilter === "tomorrow") {
      matchesDate = bDate.getTime() === tomorrow.getTime() || (rDate?.getTime() === tomorrow.getTime());
    } else if (dateFilter === "custom" && customDate) {
      const cDate = new Date(customDate);
      cDate.setHours(0, 0, 0, 0);
      matchesDate = bDate.getTime() === cDate.getTime() || (rDate?.getTime() === cDate.getTime());
    }

    return matchesSearch && matchesStatus && matchesPaymentMethod && matchesDate && matchesRoute && matchesTime;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
    setEmail(booking.email);
  };

  const handlePrintTicket = async (booking: Booking) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/booking/${booking.bookingRef}`);
      if (!response.ok) throw new Error('Failed to fetch ticket data');
      const ticketData = await response.json();
      setSelectedBookingData(ticketData);
    } catch (error) {
      console.error("Error fetching ticket data:", error);
      // Fallback to basic data if API fails
      setSelectedBookingData({
        bookingRef: booking.bookingRef,
        userName: booking.purchaserName,
        userEmail: booking.email,
        userPhone: booking.phone,
        totalAmount: booking.totalAmount,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        departureTrip: {
          route: booking.route,
          date: booking.date,
          time: booking.time,
          bus: booking.bus,
          boardingPoint: booking.boardingPoint,
          droppingPoint: booking.droppingPoint,
          seats: booking.seats,
          passengers: booking.passengerList || []
        },
        returnTrip: booking.returnTrip ? {
          route: booking.returnTrip.route,
          date: booking.returnTrip.date,
          time: booking.returnTrip.time,
          bus: booking.returnTrip.bus,
          boardingPoint: booking.returnTrip.boardingPoint,
          droppingPoint: booking.returnTrip.droppingPoint,
          seats: booking.returnTrip.seats,
          passengers: booking.returnTrip.passengers || []
        } : undefined
      });
    } finally {
      setLoading(false);
      setShowPrintTicket(true);
    }
  };

  const hasMeal = (booking: Booking) => {
    if (booking.specialRequests?.toLowerCase().includes('meal')) return true;
    if (!booking.addons) return false;
    try {
      const addons = typeof booking.addons === 'string' ? JSON.parse(booking.addons) : booking.addons;
      return addons.wimpyMeal1?.departure || addons.wimpyMeal1?.return || 
             addons.wimpyMeal2?.departure || addons.wimpyMeal2?.return;
    } catch (e) {
      return false;
    }
  };

  // Detect neighbour-free companion seats using same heuristic as manifest
  // (same normalized name in same booking = companion)
  const getPassengersWithNeighbourFree = (passengers?: Passenger[]) => {
    if (!passengers || passengers.length === 0) return [];
    const seen = new Set<string>();
    const result: (Passenger & { isNeighbourFree?: boolean; companionSeat?: string })[] = [];

    for (const p of passengers) {
      const normName = p.name.toLowerCase().trim();
      const key = `${normName}`;
      if (seen.has(key)) {
        const existing = result.find(r => r.name.toLowerCase().trim() === normName);
        if (existing) {
          existing.companionSeat = p.seat;
          existing.seat = `${existing.seat}, ${p.seat}`;
        }
      } else {
        seen.add(key);
        result.push({ ...p });
      }
    }
    return result;
  };

  // Update both paymentStatus and bookingStatus in bookings and selectedBooking
  const handleUpdateBookingStatus = (bookingId: string, newStatus: "Confirmed" | "Pending" | "Cancelled", newPaymentStatus?: string) => {
    setBookings(prev =>
      prev.map(booking =>
        booking.id === bookingId
          ? { ...booking, bookingStatus: newStatus, paymentStatus: newPaymentStatus || booking.paymentStatus }
          : booking
      )
    );
    // If modal is open and this is the selected booking, update it too
    setSelectedBooking(prev =>
      prev && prev.id === bookingId
        ? { ...prev, bookingStatus: newStatus, paymentStatus: newPaymentStatus || prev.paymentStatus }
        : prev
    );
  };

  // Mark as Paid with loading
  const handleMarkAsPaid = async (booking: Booking) => {
    setMarkPaidLoading(true);
    try {
      const response = await fetch(`/api/booking/${booking.bookingRef}/update-payment-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "Paid" }),
      });
      if (!response.ok) throw new Error("Failed to update payment status");
      // Optionally get updated booking from response
      const data = await response.json();
      // Update both paymentStatus and bookingStatus in state
      handleUpdateBookingStatus(booking.id, "Confirmed", "Paid");
      alert("Payment status updated to PAID.");
    } catch (error) {
      alert("Failed to update payment status.");
    } finally {
      setMarkPaidLoading(false);
    }
  };

  // Nullify booking with loading
  const handleNullifyBooking = async (booking: Booking) => {
    setNullifyLoading(true);
    try {
      const response = await fetch("/api/admin/booking/nullify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }), credentials: 'include'
      });
      if (!response.ok) throw new Error("Failed to nullify booking");
      // Refetch bookings to ensure UI is in sync
      await fetchBookings();
      setShowBookingDetails(false);
      alert("Booking nullified and seats freed.");
    } catch (error) {
      alert("Failed to nullify booking.");
    } finally {
      setNullifyLoading(false);
    }
  };

  // --- Export to Excel handler ---
  const handleExportExcel = () => {
    // Prepare data for export
    const exportData = filteredBookings.map((booking) => ({
      'Booking Ref': booking.bookingRef,
      'Passenger Name': booking.passengerName,
      'Purchaser Name': booking.purchaserName,
      'Email': booking.email,
      'Phone': booking.phone,
      'Passengers': booking.passengers,
      'Route': booking.route,
      'Date': formatDate(booking.date, 'yyyy-MM-dd'),
      'Time': booking.time,
      'Bus': booking.bus,
      'Boarding Point': booking.boardingPoint,
      'Dropping Point': booking.droppingPoint,
      'Seats': booking.seats.join(', '),
      'Total Amount': booking.totalAmount,
      'Payment Method': booking.paymentMethod,
      'Payment Status': booking.paymentStatus,
      'Booking Status': booking.bookingStatus,
      'Special Requests': booking.specialRequests || '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
    XLSX.writeFile(wb, `bookings_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // --- Send Ticket handler ---
  const handleSendTicket = async () => {
    if (!selectedBooking) return;
    setSendTicketLoading(true);
    try {
      const res = await fetch('/api/send-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedBooking.bookingRef, email }),
      });
      if (!res.ok) throw new Error('Failed to send ticket');
      setModalType('success');
      setModalMessage('Ticket sent successfully!');
      setShowSendTicketModal(false);
    } catch (err) {
      setModalType('error');
      setModalMessage('Failed to send ticket.');
    } finally {
      setSendTicketLoading(false);
    }
  };

  // --- Fetch available trips for reschedule ---
  const fetchAvailableTrips = async (
    routeOrigin: string,
    routeDestination: string,
    date: string,
    currentSeats: string[],
    isReturn: boolean
  ) => {
    if (!date || !routeOrigin || !routeDestination) return;
    setFetchingTrips(true);
    try {
      const currentTripId = isReturn
        ? selectedBooking?.returnTrip?.id
        : selectedBooking?.trip?.id;
      const url = `/api/trips/available-for-reschedule?routeOrigin=${encodeURIComponent(routeOrigin)}&routeDestination=${encodeURIComponent(routeDestination)}&date=${date}&currentSeats=${encodeURIComponent(currentSeats.join(','))}&excludeTripId=${currentTripId || ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch trips');
      const data = await res.json();
      if (isReturn) {
        setAvailableReturnTrips(data.trips || []);
        setSelectedReturnSeats([]);
        setExpandedReturnTripId("");
      } else {
        setAvailableDepartureTrips(data.trips || []);
        setSelectedDepartureSeats([]);
        setExpandedDepartureTripId("");
      }
    } catch (err) {
      console.error('Error fetching available trips:', err);
    } finally {
      setFetchingTrips(false);
    }
  };

  // --- Reschedule Booking handler ---
  const handleRescheduleBooking = async () => {
    if (!selectedBooking) return;
    if (!selectedDepartureTripId) {
      alert('Please select a departure trip');
      return;
    }
    if (selectedBooking.returnTrip && !selectedReturnTripId) {
      alert('Please select a return trip');
      return;
    }
    // Validate seat counts
    const outboundCount = selectedBooking.passengers;
    const returnCount = selectedBooking.returnPassengers || 0;
    if (selectedDepartureSeats.length !== outboundCount) {
      alert(`Please select exactly ${outboundCount} seat${outboundCount !== 1 ? 's' : ''} for the departure trip`);
      return;
    }
    if (selectedBooking.returnTrip && selectedReturnSeats.length !== returnCount) {
      alert(`Please select exactly ${returnCount} seat${returnCount !== 1 ? 's' : ''} for the return trip`);
      return;
    }
    setRescheduleLoading(true);
    try {
      const res = await fetch('/api/booking/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedBooking.bookingRef,
          newTripId: selectedDepartureTripId,
          newDepartureSeats: selectedDepartureSeats,
          ...(selectedBooking.returnTrip && selectedReturnTripId
            ? { newReturnTripId: selectedReturnTripId, newReturnSeats: selectedReturnSeats }
            : {}),
          ...(overridePrice && newTotalPrice ? { newTotalPrice: Number(newTotalPrice) } : {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Reschedule failed');
      }

      await fetchBookings();
      alert('Booking rescheduled successfully!');
      setShowRescheduleModal(false);
      setDepartureDatePicker('');
      setReturnDatePicker('');
      setSelectedDepartureTripId('');
      setSelectedReturnTripId('');
      setSelectedDepartureSeats([]);
      setSelectedReturnSeats([]);
      setExpandedDepartureTripId('');
      setExpandedReturnTripId('');
      setAvailableDepartureTrips([]);
      setAvailableReturnTrips([]);
      setOverridePrice(false);
      setNewTotalPrice('');
    } catch (err: any) {
      alert('Failed to reschedule booking: ' + (err.message || 'Unknown error'));
    } finally {
      setRescheduleLoading(false);
    }
  };

  return (
    <div className="p-2 sm:p-6" style={{ backgroundColor: colors.muted, minHeight: '100vh' }}>
      <Card className="border border-gray-200 shadow-sm mb-4" style={{ backgroundColor: colors.light }}>
        <CardHeader className="p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base font-semibold" style={{ color: colors.primary }}>
            Manage Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, ref, email, route or time..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-xs sm:text-sm"
                style={{ borderColor: colors.accent }}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full text-xs sm:text-sm h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.light }}>
                  <SelectItem value="all" className="text-xs sm:text-sm">All Statuses</SelectItem>
                  <SelectItem value="confirmed" className="text-xs sm:text-sm">Confirmed & Completed</SelectItem>
                  <SelectItem value="pending" className="text-xs sm:text-sm">Pending Payment</SelectItem>
                  <SelectItem value="cancelled" className="text-xs sm:text-sm">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-full text-xs sm:text-sm h-9">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.light }}>
                  <SelectItem value="all" className="text-xs sm:text-sm">All Methods</SelectItem>
                  <SelectItem value="Credit Card" className="text-xs sm:text-sm">Credit Card</SelectItem>
                  <SelectItem value="Bank Deposit" className="text-xs sm:text-sm">Bank Deposit</SelectItem>
                  <SelectItem value="Swipe in Person" className="text-xs sm:text-sm">Swipe In Person</SelectItem>
                  <SelectItem value="Cash" className="text-xs sm:text-sm">Paid Cash</SelectItem>
                  <SelectItem value="Free Voucher" className="text-xs sm:text-sm">Free Voucher</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full text-xs sm:text-sm h-9">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.light }}>
                  <SelectItem value="10" className="text-xs sm:text-sm">10</SelectItem>
                  <SelectItem value="25" className="text-xs sm:text-sm">25</SelectItem>
                  <SelectItem value="50" className="text-xs sm:text-sm">50</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="border-teal-600 text-teal-600 hover:bg-teal-50 text-xs sm:text-sm h-9"
                onClick={handleExportExcel}
                size="sm"
                style={{ borderColor: colors.primary, color: colors.primary }}
              >
                <Download className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
              <Select value={routeFilter} onValueChange={setRouteFilter}>
                <SelectTrigger className="w-full text-xs sm:text-sm h-9">
                  <SelectValue placeholder="Route" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.light }}>
                  <SelectItem value="all" className="text-xs sm:text-sm">All Routes</SelectItem>
                  {uniqueRoutes.map(route => (
                    <SelectItem key={route} value={route} className="text-xs sm:text-sm">{route}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-full text-xs sm:text-sm h-9">
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: colors.light }}>
                  <SelectItem value="all" className="text-xs sm:text-sm">All Times</SelectItem>
                  {uniqueTimes.map(time => (
                    <SelectItem key={time} value={time} className="text-xs sm:text-sm">{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-600 hover:bg-gray-50 text-xs sm:text-sm h-9"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setPaymentMethodFilter("all");
                  setDateFilter("all");
                  setRouteFilter("all");
                  setTimeFilter("all");
                  setCustomDate("");
                  setCurrentPage(1);
                }}
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Clear Filters</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
              <div className="flex bg-white border border-gray-200 rounded-md p-1 gap-1">
                <Button 
                  variant={dateFilter === 'all' ? 'default' : 'ghost'} 
                  size="sm" 
                  className="flex-1 text-[10px] sm:text-xs h-7"
                  style={dateFilter === 'all' ? { backgroundColor: colors.primary } : {}}
                  onClick={() => setDateFilter('all')}
                >
                  All Dates
                </Button>
                <Button 
                  variant={dateFilter === 'today' ? 'default' : 'ghost'} 
                  size="sm" 
                  className="flex-1 text-[10px] sm:text-xs h-7"
                  style={dateFilter === 'today' ? { backgroundColor: colors.primary } : {}}
                  onClick={() => setDateFilter('today')}
                >
                  Today
                </Button>
                <Button 
                  variant={dateFilter === 'tomorrow' ? 'default' : 'ghost'} 
                  size="sm" 
                  className="flex-1 text-[10px] sm:text-xs h-7"
                  style={dateFilter === 'tomorrow' ? { backgroundColor: colors.primary } : {}}
                  onClick={() => setDateFilter('tomorrow')}
                >
                  Tomorrow
                </Button>
                <Button 
                  variant={dateFilter === 'custom' ? 'default' : 'ghost'} 
                  size="sm" 
                  className="flex-1 text-[10px] sm:text-xs h-7 px-2"
                  style={dateFilter === 'custom' ? { backgroundColor: colors.primary } : {}}
                  onClick={() => setDateFilter('custom')}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Pick Date
                </Button>
              </div>
              
              {dateFilter === 'custom' && (
                <div className="flex items-center gap-2">
                  <Input 
                    type="date" 
                    value={customDate} 
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="h-9 text-xs sm:text-sm"
                    style={{ borderColor: colors.accent }}
                  />
                </div>
              )}
            </div>

            {/* Today's Route Focus Summary */}
            {Object.keys(todaySummary).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" style={{ color: colors.primary }} />
                  <span className="text-xs sm:text-sm font-semibold" style={{ color: colors.dark }}>
                    Today's Focus — {Object.values(todaySummary).reduce((sum, r) => sum + r.count, 0)} bookings
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(todaySummary).map(([route, data]) => (
                    <button
                      key={route}
                      onClick={() => {
                        setDateFilter('today');
                        setRouteFilter(route);
                        setCurrentPage(1);
                      }}
                      className="flex flex-col items-start px-3 py-2 rounded-md border text-left hover:shadow-sm transition-shadow"
                      style={{
                        backgroundColor: routeFilter === route && dateFilter === 'today' ? colors.primary + '15' : colors.light,
                        borderColor: routeFilter === route && dateFilter === 'today' ? colors.primary : colors.accent + '40',
                      }}
                    >
                      <span className="text-xs font-semibold" style={{ color: colors.dark }}>{route}</span>
                      <span className="text-[10px]" style={{ color: colors.accent }}>
                        {data.count} booking{data.count !== 1 ? 's' : ''} · {Object.entries(data.times).map(([t, c]) => `${t} (${c})`).join(', ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* Bookings Table Card */}
      <Card className="border border-gray-200 shadow-sm" style={{ backgroundColor: colors.light }}>
        <CardHeader className="p-3 sm:p-4">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-sm sm:text-base font-semibold" style={{ color: colors.dark }}>
              Bookings
            </CardTitle>
            <div className="flex justify-between items-center">
              <CardDescription className="text-xs sm:text-sm" style={{ color: colors.accent }}>
                {filteredBookings.length} bookings found
              </CardDescription>
              {filteredBookings.length > 0 && (
                <div className="text-xs sm:text-sm" style={{ color: colors.accent }}>
                  Page {currentPage} of {totalPages}
                </div>
              )}
            </div>
            
            {/* Color Legend (Key) */}
            <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="w-3 h-3 rounded-sm bg-yellow-100 border border-yellow-400 shrink-0"></div>
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-tight">Pending</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="w-3 h-3 rounded-sm bg-orange-100 border border-orange-400 shrink-0"></div>
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-tight">Swipe</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="w-3 h-3 rounded-sm bg-[#efebe9] border border-[#8b4513] shrink-0"></div>
                <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-tight">Cash</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredBookings.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto h-8 w-8 sm:h-10 sm:w-10" style={{ color: colors.accent }} />
              <h3 className="mt-2 text-xs sm:text-sm font-medium" style={{ color: colors.dark }}>No bookings found</h3>
              <p className="mt-1 text-xs sm:text-sm" style={{ color: colors.accent }}>
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.dark }}>
                        Booking
                      </th>
                      <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: colors.dark }}>
                        Passenger
                      </th>
                      <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.dark }}>
                        Route
                      </th>
                      <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: colors.dark }}>
                        Date
                      </th>
                      <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.dark }}>
                        Status
                      </th>
                      <th scope="col" className="px-3 py-2 sm:px-4 sm:py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: colors.dark }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((booking) => {
                      const method = (booking.paymentMethod || "").toLowerCase();
                      const status = (booking.paymentStatus || "").toLowerCase();
                      
                      let rowClass = "hover:bg-gray-50";
                      
                      if (method === 'cash') {
                        rowClass = "bg-[#efebe9] hover:bg-[#e0d7d3] transition-colors border-l-4 border-[#8b4513]";
                      } else if (method === 'swipe in person' || method.includes('swipe')) {
                        rowClass = "bg-orange-50 hover:bg-orange-100 transition-colors border-l-4 border-orange-400";
                      } else if (status === 'pending') {
                        rowClass = "bg-yellow-50 hover:bg-yellow-100 transition-colors border-l-4 border-yellow-400";
                      }

                      return (
                        <tr key={booking.id} className={rowClass}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-medium" style={{ color: colors.primary }}>{booking.bookingRef}</div>
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell">
                          <div className="text-xs sm:text-sm font-medium" style={{ color: colors.dark }}>{booking.passengerName}</div>
                          <div className="text-xs" style={{ color: colors.accent }}>{booking.email}</div>
                          <div className="text-xs mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {booking.totalPassengers && booking.totalPassengers !== booking.passengers
                                ? `${booking.passengers} out + ${booking.returnPassengers || 0} ret = ${booking.totalPassengers} pax`
                                : `${booking.passengers} ${booking.passengers === 1 ? 'passenger' : 'passengers'}`
                              }
                            </Badge>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="text-xs sm:text-sm" style={{ color: colors.dark }}>{booking.route}</div>
                          <div className="text-xs" style={{ color: colors.accent }}>{booking.bus}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-xs sm:text-sm" style={{ color: colors.dark }}>
                            {formatDate(booking.date, "MMM dd")}
                          </div>
                          <div className="text-xs" style={{ color: colors.accent }}>{booking.time}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <Badge
                            className={cn(
                              "text-xs",
                              booking.bookingStatus === "Confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.bookingStatus === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            )}
                          >
                            {booking.bookingStatus}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBooking(booking)}
                              className="text-gray-600 hover:text-teal-600 p-1"
                              style={{ color: colors.primary }}
                            >
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            {booking.returnTrip && (
                              <div className="flex items-center justify-center px-1 text-blue-500 bg-blue-50 rounded-full" title="Round Trip">
                                <Repeat className="h-3 w-3 sm:h-4 sm:w-4" />
                              </div>
                            )}
                            {hasMeal(booking) && (
                              <div className="flex items-center justify-center px-1 text-orange-500 bg-orange-50 rounded-full" title="Meal Included">
                                <Utensils className="h-3 w-3 sm:h-4 sm:w-4" />
                              </div>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintTicket(booking)}
                              className="text-gray-600 hover:text-amber-600 p-1"
                              disabled={loading}
                              style={{ color: colors.secondary }}
                            >
                              {loading ? (
                                <span className="h-3 w-3 sm:h-4 sm:w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <QrCode className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 gap-2">
                  <div className="text-xs sm:text-sm" style={{ color: colors.dark }}>
                    Showing {indexOfFirstItem + 1} to{" "}
                    {Math.min(indexOfLastItem, filteredBookings.length)} of{" "}
                    {filteredBookings.length} bookings
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className="h-8 px-2 text-xs"
                      style={{ borderColor: colors.primary, color: colors.primary }}
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sr-only sm:not-sr-only">Prev</span>
                    </Button>

                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage === 1) {
                        pageNum = i + 1;
                      } else if (currentPage === totalPages) {
                        pageNum = totalPages - 2 + i;
                      } else {
                        pageNum = currentPage - 1 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => paginate(pageNum)}
                          className="h-8 w-8 text-xs"
                          style={{
                            backgroundColor: currentPage === pageNum ? colors.primary : colors.light,
                            borderColor: currentPage === pageNum ? colors.primary : colors.accent,
                            color: currentPage === pageNum ? colors.light : colors.dark
                          }}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    {totalPages > 3 && currentPage < totalPages - 1 && (
                      <span className="px-1 text-xs sm:text-sm" style={{ color: colors.accent }}>...</span>
                    )}

                    {totalPages > 3 && currentPage < totalPages - 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(totalPages)}
                        className="h-8 w-8 text-xs"
                        style={{ borderColor: colors.primary, color: colors.primary }}
                      >
                        {totalPages}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2 text-xs"
                      style={{ borderColor: colors.primary, color: colors.primary }}
                    >
                      <span className="sr-only sm:not-sr-only">Next</span>
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Booking Details Modal */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.light }}>
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base" style={{ color: colors.primary }}>Booking Details</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm" style={{ color: colors.accent }}>
              Manage booking <span className="font-bold">{selectedBooking?.bookingRef}</span>
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              {/* Booking Info */}
              <section>
                <h4 className="font-semibold mb-2 text-xs sm:text-sm" style={{ color: colors.dark }}>Booking Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div><span style={{ color: colors.accent }}>Contact:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.purchaserName}</span></div>
                  <div><span style={{ color: colors.accent }}>Email:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.email}</span></div>
                  <div><span style={{ color: colors.accent }}>Phone:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.phone}</span></div>
                  <div><span style={{ color: colors.accent }}>Passengers:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.totalPassengers || selectedBooking.passengers} total ({selectedBooking.passengers} outbound{selectedBooking.returnPassengers ? `, ${selectedBooking.returnPassengers} return` : ''})</span></div>
                  <div><span style={{ color: colors.accent }}>Status:</span> <Badge>{selectedBooking.bookingStatus}</Badge></div>
                </div>
              </section>

              {/* Passenger List */}
              {selectedBooking.passengerList && (
                <section>
                  <h4 className="font-semibold mb-2 text-xs sm:text-sm" style={{ color: colors.dark }}>Passenger List</h4>
                  {/* Outbound Passengers */}
                  <div className="mb-3">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Outbound</div>
                    <div className="border rounded-lg overflow-hidden" style={{ borderColor: colors.accent }}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm">
                          <thead style={{ backgroundColor: colors.muted }}>
                            <tr>
                              <th className="px-2 py-1 sm:px-3 sm:py-2 text-left" style={{ color: colors.dark }}>Name</th>
                              <th className="px-2 py-1 sm:px-3 sm:py-2 text-left" style={{ color: colors.dark }}>Seat</th>
                              <th className="px-2 py-1 sm:px-3 sm:py-2 text-left hidden sm:table-cell" style={{ color: colors.dark }}>Type</th>
                              <th className="px-2 py-1 sm:px-3 sm:py-2 text-left hidden sm:table-cell" style={{ color: colors.dark }}>Passport</th>
                              <th className="px-2 py-1 sm:px-3 sm:py-2 text-left" style={{ color: colors.dark }}>Infant</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getPassengersWithNeighbourFree(selectedBooking.passengerList?.filter(p => !p.isReturn)).map((p, idx) => (
                              <tr key={`out-${idx}`} className={idx % 2 === 0 ? "" : "bg-gray-50"}>
                                <td className="px-2 py-1 sm:px-3 sm:py-2" style={{ color: colors.dark }}>
                                  <div className="flex items-center gap-2">
                                    {p.name}
                                    {p.companionSeat && (
                                      <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 font-bold uppercase">Neighbour Free</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-1 sm:px-3 sm:py-2" style={{ color: colors.dark }}>
                                  {p.companionSeat
                                    ? p.seat.split(', ').map((s: string, i: number) => (
                                        <span key={i} className={`inline-block mr-1 px-1.5 py-0.5 rounded text-xs font-bold ${i === 0 ? 'bg-slate-100 text-slate-700' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>{s}</span>
                                      ))
                                    : p.seat
                                  }
                                </td>
                                <td className="px-2 py-1 sm:px-3 sm:py-2 hidden sm:table-cell" style={{ color: colors.dark }}>{p.type || "Adult"}</td>
                                <td className="px-2 py-1 sm:px-3 sm:py-2 hidden sm:table-cell" style={{ color: colors.dark }}>{p.passportNumber || "-"}</td>
                                <td className="px-2 py-1 sm:px-3 sm:py-2" style={{ color: colors.dark }}>
                                  {p.hasInfant ? (
                                    <>
                                      Yes
                                      {p.infantName && ` (${p.infantName})`}
                                      {p.infantBirthdate && `, DOB: ${p.infantBirthdate}`}
                                      {p.infantPassportNumber && `, Cert: ${p.infantPassportNumber}`}
                                    </>
                                  ) : "No"}
                                </td>
                              </tr>
                            ))}
                            {(!selectedBooking.passengerList?.filter(p => !p.isReturn).length) && (
                              <tr><td colSpan={5} className="px-2 py-2 text-xs text-gray-400">No outbound passengers</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Return Passengers */}
                  {selectedBooking.returnTrip && selectedBooking.returnTrip.passengers && selectedBooking.returnTrip.passengers.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Return</div>
                      <div className="border rounded-lg overflow-hidden" style={{ borderColor: colors.accent }}>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs sm:text-sm">
                            <thead style={{ backgroundColor: colors.muted }}>
                              <tr>
                                <th className="px-2 py-1 sm:px-3 sm:py-2 text-left" style={{ color: colors.dark }}>Name</th>
                                <th className="px-2 py-1 sm:px-3 sm:py-2 text-left" style={{ color: colors.dark }}>Seat</th>
                                <th className="px-2 py-1 sm:px-3 sm:py-2 text-left hidden sm:table-cell" style={{ color: colors.dark }}>Type</th>
                                <th className="px-2 py-1 sm:px-3 sm:py-2 text-left hidden sm:table-cell" style={{ color: colors.dark }}>Passport</th>
                                <th className="px-2 py-1 sm:px-3 sm:py-2 text-left" style={{ color: colors.dark }}>Infant</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getPassengersWithNeighbourFree(selectedBooking.returnTrip.passengers).map((p, idx) => (
                                <tr key={`ret-${idx}`} className={idx % 2 === 0 ? "" : "bg-gray-50"}>
                                  <td className="px-2 py-1 sm:px-3 sm:py-2" style={{ color: colors.dark }}>
                                    <div className="flex items-center gap-2">
                                      {p.name}
                                      {p.companionSeat && (
                                        <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 font-bold uppercase">Neighbour Free</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-2 py-1 sm:px-3 sm:py-2" style={{ color: colors.dark }}>
                                    {p.companionSeat
                                      ? p.seat.split(', ').map((s: string, i: number) => (
                                          <span key={i} className={`inline-block mr-1 px-1.5 py-0.5 rounded text-xs font-bold ${i === 0 ? 'bg-slate-100 text-slate-700' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>{s}</span>
                                        ))
                                      : p.seat
                                    }
                                  </td>
                                  <td className="px-2 py-1 sm:px-3 sm:py-2 hidden sm:table-cell" style={{ color: colors.dark }}>{p.type || "Adult"}</td>
                                  <td className="px-2 py-1 sm:px-3 sm:py-2 hidden sm:table-cell" style={{ color: colors.dark }}>{p.passportNumber || "-"}</td>
                                  <td className="px-2 py-1 sm:px-3 sm:py-2" style={{ color: colors.dark }}>
                                    {p.hasInfant ? (
                                      <>
                                        Yes
                                        {p.infantName && ` (${p.infantName})`}
                                        {p.infantBirthdate && `, DOB: ${p.infantBirthdate}`}
                                        {p.infantPassportNumber && `, Cert: ${p.infantPassportNumber}`}
                                      </>
                                    ) : "No"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Journey Info */}
              <section>
                <h4 className="font-semibold mb-2 text-xs sm:text-sm" style={{ color: colors.primary }}>Journey Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <span style={{ color: colors.primary }}>Route:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.route}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.primary }}>Date:</span> <span className="font-semibold" style={{ color: colors.dark }}>{formatDate(selectedBooking.date, "EEEE, MMMM dd, yyyy")}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.primary }}>Time:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.time}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.primary }}>Bus:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.bus}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.primary }}>Boarding:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.boardingPoint}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.primary }}>Dropping:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.droppingPoint}</span>
                  </div>
                </div>
              </section>

              {/* Payment Info & Update Payment Status */}
              <section>
                <h4 className="font-semibold mb-2 text-xs sm:text-sm" style={{ color: colors.secondary }}>Payment Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div><span style={{ color: colors.accent }}>Method:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.paymentMethod || (selectedBooking as any).paymentMode || "N/A"}</span></div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: colors.accent }}>Payment Status:</span>
                    <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.paymentStatus}</span>
                    {selectedBooking.paymentStatus?.toLowerCase() !== 'paid' && (
                      <Button
                        size="sm"
                        className="ml-2 text-xs h-7 px-3"
                        style={{ backgroundColor: colors.primary, color: colors.light }}
                        onClick={() => handleMarkAsPaid(selectedBooking)}
                        disabled={markPaidLoading}
                      >
                        {markPaidLoading ? <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span> : "Mark as Paid"}
                      </Button>
                    )}
                  </div>
                  <div><span style={{ color: colors.accent }}>Amount:</span> <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.totalAmount?.toFixed ? selectedBooking.totalAmount.toFixed(2) : selectedBooking.totalAmount} BWP</span></div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: colors.accent }}>Booking Status:</span>
                    <span className="font-semibold" style={{ color: colors.dark }}>{selectedBooking.bookingStatus}</span>
                  </div>
                </div>
              </section>

              {/* Actions */}
              <section>
                <h4 className="font-semibold mb-2 text-xs sm:text-sm" style={{ color: colors.dark }}>Actions</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-xs sm:text-sm h-9"
                    onClick={() => {
                      setShowRescheduleModal(true);
                      setShowBookingDetails(false);
                    }}
                    style={{ borderColor: colors.primary, color: colors.primary }}
                  >
                    <CalendarClock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-xs sm:text-sm h-9"
                    onClick={() => {
                      setShowSendTicketModal(true);
                      setShowBookingDetails(false);
                    }}
                    style={{ borderColor: colors.primary, color: colors.primary }}
                  >
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Send Ticket
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-xs sm:text-sm h-9"
                    onClick={() => {
                      setShowAmendModal(true);
                      setShowBookingDetails(false);
                    }}
                    style={{ borderColor: colors.secondary, color: colors.secondary }}
                  >
                    <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Amend Details
                  </Button>
                  {(selectedBooking.paymentStatus?.toLowerCase() === 'pending' || selectedBooking.bookingStatus?.toLowerCase() === 'confirmed') && (
                    <Button
                      variant="outline"
                      className="flex-1 text-xs sm:text-sm h-9 border-red-400 text-red-800 bg-red-50 hover:bg-red-100"
                      style={{ borderColor: colors.destructive, color: '#991b1b', backgroundColor: '#fee2e2' }}
                      onClick={() => handleNullifyBooking(selectedBooking)}
                      disabled={nullifyLoading}
                    >
                      {nullifyLoading ? <span className="h-3 w-3 border-2 border-red-800 border-t-transparent rounded-full animate-spin inline-block"></span> : "Nullify Booking"}
                    </Button>
                  )}
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule Modal */}
      <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg" style={{ backgroundColor: colors.light }}>
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base" style={{ color: colors.primary }}>Reschedule Booking</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm" style={{ color: colors.accent }}>
              Select an existing trip for booking {selectedBooking?.bookingRef}
              {selectedBooking?.returnTrip && (
                <span className="block mt-1 text-xs sm:text-sm font-medium" style={{ color: colors.secondary }}>
                  (Round Trip Booking)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {/* Current Info Summary */}
            {selectedBooking && (
              <div className="p-2 bg-gray-50 rounded-md text-xs space-y-1">
                <div><span style={{ color: colors.accent }}>Current Route:</span> <span className="font-medium">{selectedBooking.route}</span></div>
                <div><span style={{ color: colors.accent }}>Current Date:</span> <span className="font-medium">{formatDate(selectedBooking.date, 'yyyy-MM-dd')}</span></div>
                <div><span style={{ color: colors.accent }}>Current Time:</span> <span className="font-medium">{selectedBooking.time}</span></div>
                <div><span style={{ color: colors.accent }}>Seats:</span> <span className="font-medium">{selectedBooking.seats?.join?.(', ') || selectedBooking.seats}</span></div>
                {selectedBooking.returnTrip && (
                  <>
                    <div className="pt-1 border-t border-gray-200 mt-1"><span style={{ color: colors.secondary }}>Return Date:</span> <span className="font-medium">{formatDate(selectedBooking.returnTrip.date, 'yyyy-MM-dd')}</span></div>
                    <div><span style={{ color: colors.secondary }}>Return Time:</span> <span className="font-medium">{selectedBooking.returnTrip.time}</span></div>
                    <div><span style={{ color: colors.secondary }}>Return Seats:</span> <span className="font-medium">{selectedBooking.returnTrip.seats?.join?.(', ') || selectedBooking.returnTrip.seats}</span></div>
                  </>
                )}
              </div>
            )}

            {/* Departure Trip Selection */}
            <div className="pt-2">
              <h4 className="text-xs sm:text-sm font-semibold mb-2" style={{ color: colors.primary }}>Select New Departure Trip</h4>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={departureDatePicker}
                  onChange={(e) => {
                    setDepartureDatePicker(e.target.value);
                    setSelectedDepartureTripId('');
                    setAvailableDepartureTrips([]);
                  }}
                  className="text-xs sm:text-sm h-9 flex-1"
                  style={{ borderColor: colors.accent }}
                  min={formatDate(new Date(), 'yyyy-MM-dd')}
                />
                <Button
                  size="sm"
                  className="h-9 text-xs"
                  style={{ backgroundColor: colors.primary }}
                  disabled={!departureDatePicker || fetchingTrips}
                  onClick={() => {
                    if (!selectedBooking) return;
                    const routeParts = selectedBooking.route.split(/ to | → |->| - /);
                    const origin = routeParts[0]?.trim() || '';
                    const dest = routeParts[1]?.trim() || '';
                    fetchAvailableTrips(origin, dest, departureDatePicker, selectedBooking.seats as string[] || [], false);
                  }}
                >
                  {fetchingTrips ? <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span> : 'Find Trips'}
                </Button>
              </div>

              {availableDepartureTrips.length > 0 && (
                <div className="mt-2 space-y-2">
                  {availableDepartureTrips.map((trip) => {
                    const isExpanded = expandedDepartureTripId === trip.id;
                    const isSelected = selectedDepartureTripId === trip.id;
                    const seatsOk = selectedDepartureSeats.length === selectedBooking?.passengers;
                    return (
                      <div
                        key={trip.id}
                        className={`rounded-lg border transition-all ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedDepartureTripId('');
                            } else {
                              setExpandedDepartureTripId(trip.id);
                              setSelectedDepartureTripId(trip.id);
                              if (trip.allSeatsAvailable && selectedBooking?.seats) {
                                setSelectedDepartureSeats(selectedBooking.seats as string[]);
                              } else {
                                setSelectedDepartureSeats([]);
                              }
                            }
                          }}
                          className="p-2 cursor-pointer"
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-xs sm:text-sm font-medium" style={{ color: colors.dark }}>
                              {trip.departureTime} — {trip.serviceType}
                            </div>
                            <div className="flex items-center gap-2">
                              {isSelected && seatsOk && (
                                <span className="text-[10px] text-green-600 font-bold">✓ Seats OK</span>
                              )}
                              <div className="text-[10px] sm:text-xs font-bold" style={{ color: trip.availableSeats > 5 ? colors.primary : colors.destructive }}>
                                {trip.availableSeats} left
                              </div>
                            </div>
                          </div>
                          <div className="text-[10px] sm:text-xs mt-1" style={{ color: colors.accent }}>
                            {trip.routeName}
                          </div>
                          {!isExpanded && trip.seatConflicts?.length > 0 && (
                            <div className="text-[10px] text-amber-600 font-medium mt-1">
                              ⚠ Seats {trip.seatConflicts.join(', ')} taken — click to pick new seats
                            </div>
                          )}
                          {!isExpanded && trip.allSeatsAvailable && (
                            <div className="text-[10px] text-green-600 font-medium mt-1">✓ Current seats free — click to keep or change</div>
                          )}
                        </div>

                        {isExpanded && selectedBooking && (
                          <div className="px-2 pb-3">
                            <div className="border-t border-gray-200 pt-2">
                              <RescheduleSeatPicker
                                totalSeats={trip.totalSeats}
                                occupiedSeats={trip.occupiedSeats}
                                tempLockedSeats={trip.tempLockedSeats}
                                requiredCount={selectedBooking.passengers}
                                selectedSeats={selectedDepartureSeats}
                                onSelectionChange={setSelectedDepartureSeats}
                                label="Departure Seats"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {availableDepartureTrips.length === 0 && departureDatePicker && !fetchingTrips && (
                <div className="text-xs text-gray-400 mt-2">No trips found for this date. Click Find Trips to search.</div>
              )}
            </div>

            {/* Return Trip Selection */}
            {selectedBooking?.returnTrip && (
              <div className="pt-3 border-t border-gray-200">
                <h4 className="text-xs sm:text-sm font-semibold mb-2" style={{ color: colors.secondary }}>Select New Return Trip</h4>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={returnDatePicker}
                    onChange={(e) => {
                      setReturnDatePicker(e.target.value);
                      setSelectedReturnTripId('');
                      setAvailableReturnTrips([]);
                    }}
                    className="text-xs sm:text-sm h-9 flex-1"
                    style={{ borderColor: colors.accent }}
                    min={departureDatePicker || formatDate(new Date(), 'yyyy-MM-dd')}
                  />
                  <Button
                    size="sm"
                    className="h-9 text-xs"
                    style={{ backgroundColor: colors.secondary }}
                    disabled={!returnDatePicker || fetchingTrips}
                    onClick={() => {
                      if (!selectedBooking?.returnTrip) return;
                      const routeParts = selectedBooking.returnTrip.route.split(/ to | → |->| - /);
                      const origin = routeParts[0]?.trim() || '';
                      const dest = routeParts[1]?.trim() || '';
                      fetchAvailableTrips(origin, dest, returnDatePicker, selectedBooking.returnTrip.seats as string[] || [], true);
                    }}
                  >
                    {fetchingTrips ? <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span> : 'Find Trips'}
                  </Button>
                </div>

                {availableReturnTrips.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {availableReturnTrips.map((trip) => {
                      const isExpanded = expandedReturnTripId === trip.id;
                      const isSelected = selectedReturnTripId === trip.id;
                      const returnCount = selectedBooking?.returnPassengers || 0;
                      const seatsOk = selectedReturnSeats.length === returnCount;
                      return (
                        <div
                          key={trip.id}
                          className={`rounded-lg border transition-all ${
                            isSelected
                              ? 'border-teal-500 bg-teal-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            onClick={() => {
                              if (isExpanded) {
                                setExpandedReturnTripId('');
                              } else {
                                setExpandedReturnTripId(trip.id);
                                setSelectedReturnTripId(trip.id);
                                if (trip.allSeatsAvailable && selectedBooking?.returnTrip?.seats) {
                                  setSelectedReturnSeats(selectedBooking.returnTrip.seats as string[]);
                                } else {
                                  setSelectedReturnSeats([]);
                                }
                              }
                            }}
                            className="p-2 cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <div className="text-xs sm:text-sm font-medium" style={{ color: colors.dark }}>
                                {trip.departureTime} — {trip.serviceType}
                              </div>
                              <div className="flex items-center gap-2">
                                {isSelected && seatsOk && (
                                  <span className="text-[10px] text-green-600 font-bold">✓ Seats OK</span>
                                )}
                                <div className="text-[10px] sm:text-xs font-bold" style={{ color: trip.availableSeats > 5 ? colors.primary : colors.destructive }}>
                                  {trip.availableSeats} left
                                </div>
                              </div>
                            </div>
                            <div className="text-[10px] sm:text-xs mt-1" style={{ color: colors.accent }}>
                              {trip.routeName}
                            </div>
                            {!isExpanded && trip.seatConflicts?.length > 0 && (
                              <div className="text-[10px] text-amber-600 font-medium mt-1">
                                ⚠ Seats {trip.seatConflicts.join(', ')} taken — click to pick new seats
                              </div>
                            )}
                            {!isExpanded && trip.allSeatsAvailable && (
                              <div className="text-[10px] text-green-600 font-medium mt-1">✓ Current seats free — click to keep or change</div>
                            )}
                          </div>

                          {isExpanded && selectedBooking && (
                            <div className="px-2 pb-3">
                              <div className="border-t border-gray-200 pt-2">
                                <RescheduleSeatPicker
                                  totalSeats={trip.totalSeats}
                                  occupiedSeats={trip.occupiedSeats}
                                  tempLockedSeats={trip.tempLockedSeats}
                                  requiredCount={returnCount}
                                  selectedSeats={selectedReturnSeats}
                                  onSelectionChange={setSelectedReturnSeats}
                                  label="Return Seats"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {availableReturnTrips.length === 0 && returnDatePicker && !fetchingTrips && (
                  <div className="text-xs text-gray-400 mt-2">No trips found for this date. Click Find Trips to search.</div>
                )}
              </div>
            )}

            {/* Pricing Override Section */}
            <div className="pt-3 border-t border-gray-200">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium mb-2" style={{ color: colors.dark }}>
                <input
                  type="checkbox"
                  checked={overridePrice}
                  onChange={(e) => setOverridePrice(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Override Price
              </label>

              {overridePrice && (
                <div className="pl-1">
                  <label className="block text-xs sm:text-sm font-medium mb-1" style={{ color: colors.dark }}>New Total Price (BWP)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 1200"
                    value={newTotalPrice}
                    onChange={(e) => setNewTotalPrice(e.target.value)}
                    className="text-xs sm:text-sm h-9"
                    style={{ borderColor: colors.accent }}
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRescheduleModal(false)}
              className="text-xs sm:text-sm h-9"
              style={{ borderColor: colors.primary, color: colors.primary }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleBooking}
              className="text-xs sm:text-sm h-9 flex items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              disabled={
                rescheduleLoading ||
                !selectedDepartureTripId ||
                selectedDepartureSeats.length !== (selectedBooking?.passengers || 0) ||
                !!(selectedBooking?.returnTrip && (!selectedReturnTripId || selectedReturnSeats.length !== (selectedBooking?.returnPassengers || 0)))
              }
            >
              {rescheduleLoading ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></span>
              ) : null}
              Reschedule & Send Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Ticket Modal */}
      <Dialog open={showSendTicketModal} onOpenChange={setShowSendTicketModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-md" style={{ backgroundColor: colors.light }}>
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base" style={{ color: colors.primary }}>Send Ticket</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm" style={{ color: colors.accent }}>
              Send booking confirmation to the passenger
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1" style={{ color: colors.dark }}>Recipient Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs sm:text-sm h-9"
                style={{ borderColor: colors.accent }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSendTicketModal(false)}
              className="text-xs sm:text-sm h-9"
              style={{ borderColor: colors.primary, color: colors.primary }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTicket}
              className="text-xs sm:text-sm h-9 flex items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              disabled={sendTicketLoading}
            >
              {sendTicketLoading ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></span>
              ) : null}
              Send Ticket
            </Button>
            {/* Success/Error Modal */}
            {modalMessage && (
              <Dialog open={!!modalMessage} onOpenChange={() => setModalMessage(null)}>
                <DialogContent className="max-w-xs mx-auto text-center">
                  <DialogHeader>
                    <DialogTitle className={modalType === 'success' ? 'text-green-700' : 'text-red-700'}>
                      {modalType === 'success' ? 'Success' : 'Error'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="py-4 text-sm">
                    {modalMessage}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setModalMessage(null)} className="w-full" style={{ backgroundColor: colors.primary, color: colors.light }}>
                      OK
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Ticket Modal */}
      <Dialog open={showPrintTicket} onOpenChange={setShowPrintTicket}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: colors.light }}>
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base" style={{ color: colors.primary }}>Printable Ticket</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm" style={{ color: colors.accent }}>
              Print or download ticket for {selectedBookingData?.bookingRef}
            </DialogDescription>
          </DialogHeader>
          {selectedBookingData && (
            <div className="space-y-3">
              <PrintableTicket bookingData={selectedBookingData} />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="text-xs sm:text-sm h-9"
                  style={{ borderColor: colors.primary, color: colors.primary }}
                >
                  Print Ticket
                </Button>
                <Button
                  onClick={() => {
                    setShowSendTicketModal(true);
                    setShowPrintTicket(false);
                  }}
                  className="text-xs sm:text-sm h-9"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Send to Passenger
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AmendBookingModal 
        isOpen={showAmendModal}
        onClose={() => setShowAmendModal(false)}
        booking={selectedBooking}
        onSuccess={() => fetchBookings()}
      />
    </div>
  );
}

