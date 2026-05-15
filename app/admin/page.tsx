"use client";
import CreateCharterQuickAction from "./CreateCharterQuickAction";
import MaintenanceQuickAction from "./MaintenanceQuickAction";
import { useState, useEffect } from "react";
import { Users, DollarSign, AlertTriangle, Bus, TrendingUp, BarChart3, QrCode, FileText, Clock, ArrowUpRight, Wrench } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { PolicyModal } from "@/components/PolicyModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Trip {
  id: string;
  routeName: string;
  routeOrigin: string;
  routeDestination: string;
  departureDate: Date;
  departureTime: string;
  totalSeats: number;
}

interface Booking {
  id: string;
  createdAt: Date;
  totalPrice: number;
  bookingStatus: string;
  trip: Trip;
  seatCount: number;
}

interface DashboardData {
  stats: {
    totalBookings: number;
    totalRevenue: number;
    monthlyBookings: number;
    monthlyRevenue: number;
    pendingRequests: number;
    todayDepartures: number;
  };
  recentBookings: Booking[];
  morningOccupancy: {
    bus: string;
    route: string;
    totalSeats: number;
    bookedSeats: number;
    departureTime: string;
  }[];
  afternoonOccupancy: {
    bus: string;
    route: string;
    totalSeats: number;
    bookedSeats: number;
    departureTime: string;
  }[];
}

export default function DashboardOverview() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [showPolicyEditor, setShowPolicyEditor] = useState(false);
  const [showFareEditor, setShowFareEditor] = useState(false);
  const [infantFare, setInfantFare] = useState<number>(250);
  const [childFare, setChildFare] = useState<number>(400);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data: DashboardData = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchInquiryCount = async () => {
      try {
        const response = await fetch('/api/inquiries');
        if (!response.ok) {
          throw new Error('Failed to fetch inquiry data');
        }
        const data = await response.json();
        const pending = (data.inquiries || []).filter((inq: any) => inq.status === "pending").length;
        setInquiryCount(pending);
      } catch (err) {
        console.error("Error fetching inquiry data:", err);
      }
    };

    fetchDashboardData();
    fetchInquiryCount();
  }, []);

  useEffect(() => {
    fetch('/api/getfareprices')
      .then(res => res.json())
      .then(data => {
        setInfantFare(data.infant ?? 250);
        setChildFare(data.child ?? 400);
      });
  }, []);

  const handleSaveFares = async () => {
    await fetch("/api/setfareprices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ infant: infantFare, child: childFare }),
    });
    setShowFareEditor(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0d9488] mx-auto"></div>
          <p className="text-[#4b5563] font-medium">Loading dashboard data...</p>
          <p className="text-sm text-[#6b7280]">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] p-4">
        <div className="text-center max-w-md space-y-4">
          <div className="inline-flex items-center justify-center rounded-full bg-[#fee2e2] p-4">
            <AlertTriangle className="h-8 w-8 text-[#dc2626]" />
          </div>
          <h3 className="text-lg font-medium text-[#111827]">Failed to load dashboard</h3>
          <p className="text-[#4b5563]">{error}</p>
          <button
            className="mt-4 bg-[#0d9488] hover:bg-[#0f766e] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <div className="text-center space-y-2">
          <p className="text-[#4b5563] font-medium">No dashboard data available</p>
          <p className="text-sm text-[#6b7280]">Please check your connection and try again</p>
        </div>
      </div>
    );
  }

  const { stats, recentBookings, morningOccupancy, afternoonOccupancy } = dashboardData;

  return (
    <div className="space-y-8 p-4 md:p-6 bg-[#f9fafb]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Dashboard Overview</h1>
          <p className="text-[#4b5563]">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 border border-[#e5e7eb] rounded-md px-3 py-1.5 text-sm font-medium text-[#4b5563] hover:bg-[#f3f4f6]">
            <Clock className="h-4 w-4" />
            Last 30 days
          </button>
            <div className="flex items-center gap-2">
            <CreateCharterQuickAction />
            <MaintenanceQuickAction />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Bookings */}
        <div className="border border-[#e5e7eb] rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
          <div className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-[#f0fdfa] p-3">
                  <Users className="h-5 w-5 text-[#0d9488]" />
                </div>
                <span className="bg-[#ecfdf5] text-[#059669] text-xs font-medium px-2.5 py-0.5 rounded-full">
                  +12%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#6b7280]">Total Bookings</p>
                <p className="text-2xl font-semibold text-[#111827]">{stats.totalBookings}</p>
                <p className="text-xs text-[#6b7280] mt-1">{stats.monthlyBookings} bookings this month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="border border-[#e5e7eb] rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
          <div className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-[#fffbeb] p-3">
                  <DollarSign className="h-5 w-5 text-[#d97706]" />
                </div>
                <span className="bg-[#ecfdf5] text-[#059669] text-xs font-medium px-2.5 py-0.5 rounded-full">
                  +24%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#6b7280]">Total Revenue</p>
                <p className="text-2xl font-semibold text-[#111827]">P {stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-[#6b7280] mt-1">P {stats.monthlyRevenue.toLocaleString()} this month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="border border-[#e5e7eb] rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
          <div className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-[#fee2e2] p-3">
                  <AlertTriangle className="h-5 w-5 text-[#dc2626]" />
                </div>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  stats.pendingRequests > 0 
                    ? 'bg-[#fee2e2] text-[#dc2626]' 
                    : 'bg-[#ecfdf5] text-[#059669]'
                }`}>
                  {stats.pendingRequests > 0 ? 'Action needed' : 'All clear'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#6b7280]">Pending Inquiries</p>
                <p className="text-2xl font-semibold text-[#111827]">{inquiryCount}</p>
                <p className="text-xs text-[#6b7280] mt-1">Awaiting approval</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Departures */}
        <div className="border border-[#e5e7eb] rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
          <div className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-[#dcfce7] p-3">
                  <Bus className="h-5 w-5 text-[#16a34a]" />
                </div>
                <span className="bg-[#e0f2fe] text-[#0284c7] text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Active
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#6b7280]">Today's Departures</p>
                <p className="text-2xl font-semibold text-[#111827]">{stats.todayDepartures}</p>
                <p className="text-xs text-[#6b7280] mt-1">Active schedules</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Actions */}
<div className="lg:col-span-1">
  <div className="border border-[#e5e7eb] rounded-lg shadow-sm bg-white">
    <div className="p-6 border-b border-[#e5e7eb]">
      <h2 className="text-lg font-semibold text-[#111827]">Quick Actions</h2>
      <p className="text-sm text-[#6b7280]">
        Common tasks at your fingertips
      </p>
    </div>
    <div className="p-6">
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/validate-ticket">
          <button className="w-full h-24 flex flex-col items-center justify-center gap-3 border border-[#e5e7eb] rounded-lg hover:border-[#99f6e4] hover:bg-[#f0fdfa] transition-colors">
            <div className="rounded-full bg-[#ccfbf1] p-3">
              <QrCode className="h-5 w-5 text-[#0d9488]" />
            </div>
            <span className="text-sm font-medium">Validate Tickets</span>
          </button>
        </Link>
        
        <Link href="/admin/agents">
          <button className="w-full h-24 flex flex-col items-center justify-center gap-3 border border-[#e5e7eb] rounded-lg hover:border-[#bfdbfe] hover:bg-[#eff6ff] transition-colors">
            <div className="rounded-full bg-[#bfdbfe] p-3">
              <Users className="h-5 w-5 text-[#2563eb]" />
            </div>
            <span className="text-sm font-medium">Agents</span>
          </button>
        </Link>
        
        <Link href="/admin/consultants">
          <button className="w-full h-24 flex flex-col items-center justify-center gap-3 border border-[#e5e7eb] rounded-lg hover:border-[#fcd34d] hover:bg-[#fef9c3] transition-colors">
            <div className="rounded-full bg-[#fcd34d]/30 p-3">
              <Users className="h-5 w-5 text-[#b45309]" />
            </div>
            <span className="text-sm font-medium">Consultants</span>
          </button>
        </Link>
        
        <Link href="/admin/charters">
          <button className="w-full h-24 flex flex-col items-center justify-center gap-3 border border-[#e5e7eb] rounded-lg hover:border-[#e0f2fe] hover:bg-[#eff6ff] transition-colors">
            <div className="rounded-full bg-[#e0f2fe] p-3">
              <Bus className="h-5 w-5 text-[#0284c7]" />
            </div>
            <span className="text-sm font-medium">Charters</span>
          </button>
        </Link>
        
        <Link href="/admin/fleet">
          <button className="w-full h-24 flex flex-col items-center justify-center gap-3 border border-[#e5e7eb] rounded-lg hover:border-[#c7d2fe] hover:bg-[#eef2ff] transition-colors">
            <div className="rounded-full bg-[#c7d2fe] p-3">
              <Bus className="h-5 w-5 text-[#4f46e5]" />
            </div>
            <span className="text-sm font-medium">Fleet</span>
          </button>
        </Link>
        
        <Link href="/admin/reservations">
          <button className="w-full h-24 flex flex-col items-center justify-center gap-3 border border-[#e5e7eb] rounded-lg hover:border-[#99f6e4] hover:bg-[#f0fdfa] transition-colors">
            <div className="rounded-full bg-[#ccfbf1] p-3">
              <Users className="h-5 w-5 text-[#0d9488]" />
            </div>
            <span className="text-sm font-medium" style={{ color: '#009393' }}>Reservations</span>
          </button>
        </Link>
        
        <Link href="/admin/busschedule">
          <button className="w-full h-24 flex flex-col items-center justify-center gap-3 border border-[#e5e7eb] rounded-lg hover:border-[#e9d5ff] hover:bg-[#f5f3ff] transition-colors">
            <div className="rounded-full bg-[#e9d5ff] p-3">
              <FileText className="h-5 w-5 text-[#7e22ce]" />
            </div>
            <span className="text-sm font-medium">Schedule</span>
          </button>
        </Link>

        {/* --- NEW: Maintenance Button --- */}
        <Link href="/admin/maintenance">
          <button className="w-full h-24 flex flex-col items-center justify-center gap-3 border border-[#e5e7eb] rounded-lg hover:border-[#fecaca] hover:bg-[#fef2f2] transition-colors">
            <div className="rounded-full bg-[#fecaca] p-3">
              <Wrench className="h-5 w-5 text-[#dc2626]" />
            </div>
            <span className="text-sm font-medium">Maintenance</span>
          </button>
        </Link>
        
        {/* --- NEW: Edit Policy Button --- */}
        <button
          className="w-full h-24 flex flex-col items-center justify-center gap-3 border border-[#e5e7eb] rounded-lg hover:border-[#fbbf24] hover:bg-[#fef3c7] transition-colors"
          onClick={() => setShowPolicyEditor(true)}
        >
          <div className="rounded-full bg-[#fbbf24]/30 p-3">
            <FileText className="h-5 w-5 text-[#f59e42]" />
          </div>
          <span className="text-sm font-medium">Edit Policy</span>
        </button>
        
        {/* --- NEW: Set Fare Prices Button --- */}
        <button
          className="w-full h-24 flex flex-col items-center justify-center gap-3 border border-[#e5e7eb] rounded-lg hover:border-[#a7f3d0] hover:bg-[#f0fdfa] transition-colors"
          onClick={() => setShowFareEditor(true)}
        >
          <div className="rounded-full bg-[#a7f3d0]/30 p-3">
            <DollarSign className="h-5 w-5 text-[#059669]" />
          </div>
          <span className="text-sm font-medium">Set Fare Prices</span>
        </button>
        
        <Link href="/admin/promotions">
          <button className="w-full h-24 flex flex-col items-center justify-center gap-3 border border-[#e5e7eb] rounded-lg hover:border-[#fbbf24] hover:bg-[#fef3c7] transition-colors">
            <div className="rounded-full bg-[#fbbf24]/30 p-3">
              <BarChart3 className="h-5 w-5 text-[#f59e42]" />
            </div>
            <span className="text-sm font-medium">Promotions</span>
          </button>
        </Link>
      </div>
    </div>
  </div>
</div>

        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <div className="border border-[#e5e7eb] rounded-lg shadow-sm h-full bg-white">
            <div className="p-6 border-b border-[#e5e7eb]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#111827]">Recent Bookings</h2>
                  <p className="text-sm text-[#6b7280]">
                    Latest customer reservations
                  </p>
                </div>
                <button className="text-[#0d9488] hover:text-[#0f766e] text-sm font-medium flex items-center">
                  View all
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 hover:bg-[#f9fafb] rounded-lg transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-[#f3f4f6] p-3">
                        <Bus className="h-5 w-5 text-[#4b5563]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#111827]">{booking.trip.routeName}</p>
                        <p className="text-sm text-[#6b7280]">
                          {format(booking.createdAt, "MMM dd, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#0d9488]">P {booking.totalPrice}</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.bookingStatus === 'confirmed' 
                          ? 'bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]' 
                          : 'bg-[#fef3c7] text-[#d97706] border border-[#fde68a]'
                      }`}>
                        {booking.bookingStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bus Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Morning Occupancy */}
        <div className="border border-[#e5e7eb] rounded-lg shadow-sm bg-white">
          <div className="p-6 border-b border-[#e5e7eb]">
            <h2 className="text-lg font-semibold text-[#111827]">Morning Bus Occupancy</h2>
            <p className="text-sm text-[#6b7280]">
              Departures before 12:00 PM
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {morningOccupancy.map((bus, index) => {
                const occupancyPercentage = Math.round((bus.bookedSeats / bus.totalSeats) * 100);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[#111827]">{bus.bus}</p>
                        <p className="text-sm text-[#6b7280]">Route: {bus.route}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-[#111827]">
                          {bus.bookedSeats}/{bus.totalSeats} seats
                        </p>
                        <p className="text-xs text-[#6b7280]">
                          {bus.departureTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-[#f3f4f6] rounded-full h-2.5 flex-1">
                        <div
                          className="bg-[#0d9488] h-2.5 rounded-full"
                          style={{ width: `${occupancyPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-[#374151]">
                        {occupancyPercentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Afternoon Occupancy */}
        <div className="border border-[#e5e7eb] rounded-lg shadow-sm bg-white">
          <div className="p-6 border-b border-[#e5e7eb]">
            <h2 className="text-lg font-semibold text-[#111827]">Afternoon Bus Occupancy</h2>
            <p className="text-sm text-[#6b7280]">
              Departures after 12:00 PM
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {afternoonOccupancy.map((bus, index) => {
                const occupancyPercentage = Math.round((bus.bookedSeats / bus.totalSeats) * 100);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-[#111827]">{bus.bus}</p>
                        <p className="text-sm text-[#6b7280]">Route: {bus.route}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-[#111827]">
                          {bus.bookedSeats}/{bus.totalSeats} seats
                        </p>
                        <p className="text-xs text-[#6b7280]">
                          {bus.departureTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-[#f3f4f6] rounded-full h-2.5 flex-1">
                        <div
                          className="bg-[#0d9488] h-2.5 rounded-full"
                          style={{ width: `${occupancyPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-[#374151]">
                        {occupancyPercentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --- Policy Editor Modal --- */}
      <PolicyModal
          isOpen={showPolicyEditor}
          onClose={() => setShowPolicyEditor(false)}
          mode="admin"
        />

      {/* --- Fare Editor Modal --- */}
      <Dialog open={showFareEditor} onOpenChange={setShowFareEditor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Fare Prices</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Infant Fare</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                placeholder="Enter infant fare (e.g. 250)"
                value={infantFare}
                onChange={e => setInfantFare(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Child Fare</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                placeholder="Enter child fare (e.g. 400)"
                value={childFare}
                onChange={e => setChildFare(Number(e.target.value))}
              />
            </div>
            <button
              className="w-full mt-4 bg-[#009393] hover:bg-[#007575] text-white font-semibold py-2 px-4 rounded"
              onClick={handleSaveFares}
            >
              Save Fare Prices
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}