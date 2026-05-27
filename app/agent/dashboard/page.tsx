"use client";
import { deleteCookie } from "cookies-next";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { Mail, Eye } from "lucide-react";

export default function AgentDashboard() {
  const [agent, setAgent] = useState<{ name: string; email: string; id: string; commissionRate?: number } | null>(null);
  const [stats, setStats] = useState<{ bookings: number; revenue: number; commission: number }>({ bookings: 0, revenue: 0, commission: 0 });
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showSendTicketModal, setShowSendTicketModal] = useState(false);
  const [email, setEmail] = useState("");
  const [sendTicketLoading, setSendTicketLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'success' | 'error' | null>(null);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/agent/me").then(async res => {
      if (res.ok) {
        const agentData = await res.json();
        console.log("[Dashboard] Loaded agent:", agentData);
        setAgent(agentData);
      } else {
        window.location.href = "/agent/auth";
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (agent?.id) {
      setIsLoading(true);
      console.log("[Dashboard] Fetching bookings for agentId:", agent.id);
      Promise.all([
        fetch(`/api/agent/${agent.id}/bookings`),
        fetch(`/api/agents/${agent.id}/sales`),
      ])
        .then(async ([bookingsRes, salesRes]) => {
          if (bookingsRes.ok) {
            const data = await bookingsRes.json();
            console.log("[Dashboard] Bookings fetched:", data.bookings);
            setBookings(data.bookings || []);
          }
          if (salesRes.ok) {
            const salesData = await salesRes.json();
            setStats({
              bookings: salesData.bookings || 0,
              revenue: salesData.revenue || 0,
              commission: salesData.commission || 0,
            });
            // Update agent with commissionRate from server if available
            if (salesData.commissionRate !== undefined && agent) {
              setAgent({ ...agent, commissionRate: salesData.commissionRate });
            }
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [agent?.id]);

  const handleExport = () => {
    const exportData = bookings.map(b => ({
      "Order ID": b.orderId,
      "Client": b.userName,
      "Email": b.userEmail,
      "Trip": b.trip?.routeName,
      "Date": new Date(b.trip?.departureDate).toLocaleDateString(),
      "Time": b.trip?.departureTime,
      "Seats": b.seatCount,
      "Amount": b.totalPrice,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, "agent_bookings.xlsx");
  };

  const handleLogout = () => {
    deleteCookie("agent_token");
    window.location.href = "/agent/auth";
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleViewBooking = async (booking: any) => {
    try {
      const res = await fetch(`/api/booking/${booking.orderId}`);
      if (!res.ok) throw new Error("Failed to fetch booking details");
      const data = await res.json();
      setSelectedBooking(data);
      setEmail(data.userEmail || "");
      setShowBookingDetails(true);
    } catch (err) {
      alert("Failed to load booking details.");
    }
  };

  const handleSendTicket = async () => {
    if (!selectedBooking || !email) return;
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

  function getMostBookedRoute(bookings: any[]) {
    if (!bookings.length) return "-";
    const routeCount: Record<string, number> = {};
    bookings.forEach(b => {
      const route = b.trip?.routeName || "Unknown";
      routeCount[route] = (routeCount[route] || 0) + 1;
    });
    const sorted = Object.entries(routeCount).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "-";
  }

  if (isLoading || !agent) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#009393]/5 to-[#febf00]/5">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-[#009393] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-600 font-medium">Loading agent dashboard...</p>
        <p className="text-sm text-gray-500">Please wait while we fetch your data</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#009393]/5 to-[#febf00]/5">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/images/reeca-travel-logo.png"
                alt="Bus Company Logo"
                width={150}
                height={150}
                className="rounded-md object-cover border-2 border-[#958c55]/30"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">Agent Dashboard</h1>
                <p className="text-sm text-[#958c55]">Manage bookings and clients</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={toggleProfileMenu}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="h-10 w-10 rounded-full bg-[#009393] flex items-center justify-center text-white font-bold shadow-sm">
                {agent.name.charAt(0).toUpperCase()}
              </div>
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md overflow-hidden shadow-xl z-20">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.email}</p>
                </div>
                <div className="border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-[#009393] hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">TOTAL BOOKINGS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">{stats.bookings}</div>
                <div className="p-3 rounded-full bg-[#009393]/10 text-[#009393]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">All time bookings</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-[#febf00] hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">COMMISSION RATE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {agent.commissionRate ?? 10}%
                </div>
                <div className="p-3 rounded-full bg-[#febf00]/10 text-[#febf00]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v7" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">Your earning percentage per sale</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-green-500 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">TOTAL COMMISSION</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  P{stats.commission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="p-3 rounded-full bg-green-500/10 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v7" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">Total earnings from paid bookings</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-[#958c55] hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">MOST ROUTE BOOKED FOR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {getMostBookedRoute(bookings)}
                  </div>
                </div>
                <div className="p-3 rounded-full bg-[#958c55]/10 text-[#958c55]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">Most frequently booked route</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#009393] mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              Recent Bookings
            </h2>
            <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="flex items-center justify-center gap-2 border-[#009393] text-[#009393] hover:bg-[#009393]/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Booking
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-2 border-[#958c55] text-[#958c55] hover:bg-[#958c55]/10"
                onClick={handleExport}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {bookings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto h-24 w-24 flex items-center justify-center rounded-full bg-[#febf00]/10 text-[#febf00] mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No bookings yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new booking for your clients.</p>
                <div className="mt-6">
                  <Button
                    onClick={() => router.push("/")}
                    className="bg-[#009393] hover:bg-[#007a7a] px-6 py-3 shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create New Booking
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trip Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seats
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#009393]">
                          #{b.orderId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#958c55]/10 flex items-center justify-center text-[#958c55] font-medium">
                              {b.userName?.charAt(0).toUpperCase() || 'C'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{b.userName || 'Customer'}</div>
                              <div className="text-sm text-gray-500">{b.userEmail || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{b.trip?.routeName}</div>
                          <div className="text-xs text-gray-500">
                            {b.trip?.departureTime} • {b.trip?.busType}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(b.trip?.departureDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#009393]/10 text-[#009393]">
                            {b.seatCount} {b.seatCount === 1 ? 'seat' : 'seats'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          P{b.totalPrice?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#009393] hover:text-[#007a7a] hover:bg-[#009393]/10"
                            onClick={() => handleViewBooking(b)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{bookings.length}</span> of{' '}
                    <span className="font-medium">{bookings.length}</span> bookings
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="border-gray-300 text-gray-500"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="border-gray-300 text-gray-500"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Booking Details Modal */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg" style={{ backgroundColor: '#ffffff' }}>
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base" style={{ color: '#009393' }}>
              Booking Details #{selectedBooking?.bookingRef}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm" style={{ color: '#958c55' }}>
              View ticket details and send to client
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs sm:text-sm">
              <section>
                <h4 className="font-semibold mb-2" style={{ color: '#1a1a1a' }}>Client Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><span style={{ color: '#958c55' }}>Name:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{selectedBooking.userName}</span></div>
                  <div><span style={{ color: '#958c55' }}>Email:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{selectedBooking.userEmail}</span></div>
                  <div><span style={{ color: '#958c55' }}>Phone:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{selectedBooking.userPhone || '-'}</span></div>
                </div>
              </section>

              <section>
                <h4 className="font-semibold mb-2" style={{ color: '#009393' }}>Journey Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><span style={{ color: '#009393' }}>Route:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{selectedBooking.departureTrip?.route}</span></div>
                  <div><span style={{ color: '#009393' }}>Date:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{selectedBooking.departureTrip?.date ? new Date(selectedBooking.departureTrip.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span></div>
                  <div><span style={{ color: '#009393' }}>Time:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{selectedBooking.departureTrip?.time}</span></div>
                  <div><span style={{ color: '#009393' }}>Bus:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{selectedBooking.departureTrip?.bus}</span></div>
                  <div><span style={{ color: '#009393' }}>Boarding:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{selectedBooking.departureTrip?.boardingPoint}</span></div>
                  <div><span style={{ color: '#009393' }}>Dropping:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{selectedBooking.departureTrip?.droppingPoint}</span></div>
                </div>
              </section>

              {selectedBooking.returnTrip && (
                <section>
                  <h4 className="font-semibold mb-2" style={{ color: '#009393' }}>Return Journey</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div><span style={{ color: '#009393' }}>Route:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{selectedBooking.returnTrip.route}</span></div>
                    <div><span style={{ color: '#009393' }}>Date:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{new Date(selectedBooking.returnTrip.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
                    <div><span style={{ color: '#009393' }}>Time:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{selectedBooking.returnTrip.time}</span></div>
                  </div>
                </section>
              )}

              <section>
                <h4 className="font-semibold mb-2" style={{ color: '#febf00' }}>Payment Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div><span style={{ color: '#958c55' }}>Method:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{selectedBooking.paymentMethod}</span></div>
                  <div><span style={{ color: '#958c55' }}>Status:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>{selectedBooking.paymentStatus}</span></div>
                  <div><span style={{ color: '#958c55' }}>Amount:</span> <span className="font-semibold" style={{ color: '#1a1a1a' }}>BWP {selectedBooking.totalAmount?.toFixed ? selectedBooking.totalAmount.toFixed(2) : selectedBooking.totalAmount}</span></div>
                </div>
              </section>

              <section>
                <h4 className="font-semibold mb-2" style={{ color: '#1a1a1a' }}>Actions</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-xs sm:text-sm h-9"
                    onClick={() => {
                      setShowSendTicketModal(true);
                      setShowBookingDetails(false);
                    }}
                    style={{ borderColor: '#009393', color: '#009393' }}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Send Ticket to Client
                  </Button>
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Ticket Modal */}
      <Dialog open={showSendTicketModal} onOpenChange={setShowSendTicketModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-md" style={{ backgroundColor: '#ffffff' }}>
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base" style={{ color: '#009393' }}>
              Send Ticket
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm" style={{ color: '#958c55' }}>
              Send the ticket PDF to the client email for booking {selectedBooking?.bookingRef}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1" style={{ color: '#1a1a1a' }}>
                Client Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 px-3 text-xs sm:text-sm border rounded-md bg-white"
                style={{ borderColor: '#958c55' }}
                placeholder="client@example.com"
              />
            </div>
            {modalMessage && (
              <div className={`p-2 rounded text-xs ${modalType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {modalMessage}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSendTicketModal(false)}
                style={{ borderColor: '#958c55', color: '#958c55' }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSendTicket}
                disabled={sendTicketLoading || !email}
                style={{ backgroundColor: '#009393', color: '#ffffff' }}
              >
                {sendTicketLoading ? (
                  <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-1"></span>
                ) : (
                  <Mail className="h-4 w-4 mr-1" />
                )}
                Send Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2">
              <Image
                src="/images/reeca-travel-logo.png"
                alt="Bus Company Logo"
                width={150}
                height={150}
                className="rounded-md"
              />
              <span className="text-sm text-gray-500">© {new Date().getFullYear()} Reeca Travel.</span>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-sm text-[#009393] hover:text-[#007a7a]">Privacy</a>
              <a href="#" className="text-sm text-[#009393] hover:text-[#007a7a]">Terms</a>
              <a href="#" className="text-sm text-[#009393] hover:text-[#007a7a]">Help</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
