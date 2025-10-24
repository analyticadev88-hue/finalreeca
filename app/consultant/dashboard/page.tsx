// app/consultant/dashboard/page.tsx
"use client";

import dynamic from "next/dynamic";
// Dynamically import BookingsManagement to avoid SSR issues
const BookingsManagement = dynamic(() => import("@/app/admin/bookings/page"), { ssr: false });
// Import the consultant bus schedule page directly
import ConsultantBusSchedulePage from "@/app/consultant/busschedule/page";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import * as XLSX from "xlsx";

// Inline manifest panel for consultant
const AdminManifestPage = dynamic(() => import("@/app/admin/manifest/[busId]/page"), { ssr: false });

function ManifestPanel({ busId, onBack }: { busId: string, onBack: () => void }) {
  return <AdminManifestPage params={{ busId }} onBack={onBack} />;
}

export default function ConsultantDashboard() {
  const [activeSection, setActiveSection] = useState<'dashboard' | 'bookings' | 'busschedule' | 'manifest'>('dashboard');
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [consultant, setConsultant] = useState<{ name: string; email: string; id: string } | null>(null);
  const [stats, setStats] = useState<{ bookings: number; revenue: number }>({ bookings: 0, revenue: 0 });
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Handle view manifest from bus schedule
  const handleViewManifest = (busId: string) => {
    setSelectedBusId(busId);
    setActiveSection('manifest');
  };

  // Auto-lock logic
  function resetTimeout() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLocked(true);
      sessionStorage.setItem("consultant_last_path", window.location.pathname);
      router.push("/consultant/auth?locked=1");
    }, 60000);
  }

  useEffect(() => {
    const events = ["mousemove", "keydown", "mousedown", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimeout));
    resetTimeout();
    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimeout));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Restore session after login
  useEffect(() => {
    const lastPath = sessionStorage.getItem("consultant_last_path");
    if (window.location.search.includes("locked=1") && lastPath && window.location.pathname !== lastPath) {
      router.replace(lastPath);
      sessionStorage.removeItem("consultant_last_path");
    }
  }, [router]);

  // Consultant data fetch
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/consultant/me").then(async res => {
      if (res.ok) {
        const consultantData = await res.json();
        setConsultant(consultantData);
      } else {
        router.push("/consultant/auth");
      }
      setIsLoading(false);
    });
  }, [router]);

  useEffect(() => {
    if (consultant?.id) {
      setIsLoading(true);
      fetch(`/api/consultants/${consultant.id}/bookings`)
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            setBookings(data.bookings || []);
            setStats({
              bookings: data.bookings.length,
              revenue: data.bookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0),
            });
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [consultant?.id]);

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
    XLSX.writeFile(wb, "consultant_bookings.xlsx");
  };

  const handleLogout = async () => {
    await fetch("/api/consultant/logout", { method: "POST" });
    document.cookie = "consultant_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/consultant/auth");
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
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

  if (isLoading || !consultant) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-[#009393] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-600 font-medium">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-sm z-20 hidden md:block">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Image
                src="/images/reeca-travel-logo.png"
                alt="Reeca Travel Logo"
                width={150}
                height={150}
                className="rounded-md"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-4 space-y-1">
              <button
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg ${activeSection === 'dashboard' ? 'bg-[#009393]/10 text-[#009393]' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setActiveSection('dashboard')}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>
              <button
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg ${activeSection === 'bookings' ? 'bg-[#009393]/10 text-[#009393]' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setActiveSection('bookings')}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Bookings
              </button>
              <button
                className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg ${activeSection === 'busschedule' ? 'bg-[#009393]/10 text-[#009393]' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setActiveSection('busschedule')}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4h16v2H4zm0 6h16v2H4zm0 6h16v2H4z" />
                </svg>
                Bus Schedule
              </button>
              <a href="#" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Clients
              </a>
              <a href="#" className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-100">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Reports
              </a>
            </nav>
          </div>
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-[#009393] flex items-center justify-center text-white font-medium">
                {consultant.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{consultant.name}</p>
                <p className="text-xs text-gray-500">{consultant.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <Image
              src="/images/reeca-travel-logo.png"
              alt="Reeca Travel Logo"
              width={150}
              height={150}
              className="rounded-md"
            />
            <span className="text-lg font-semibold text-gray-800">Dashboard</span>
          </div>
          <button className="p-1 rounded-md text-gray-500 hover:text-gray-600" onClick={toggleProfileMenu}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md overflow-hidden shadow-xl z-20">
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-gray-900">{consultant.name}</p>
              <p className="text-xs text-gray-500">{consultant.email}</p>
            </div>
            <div className="border-t border-gray-200">
              <button
                onClick={() => {
                  toggleProfileMenu();
                  handleLogout();
                }}
                className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="md:pl-64 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {activeSection === 'dashboard' ? (
            <>
              {/* Header */}
              <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Welcome back, {consultant.name.split(' ')[0]}</h1>
                  <p className="mt-1 text-sm text-gray-500">Here's what's happening with your bookings today</p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                  <Button
                    variant="outline"
                    className="border-[#958c55] text-[#958c55] hover:bg-[#958c55]/10"
                    onClick={handleExport}
                  >
                    Export
                  </Button>
                  <Button
                    className="bg-[#009393] hover:bg-[#007a7a]"
                    onClick={() => router.push("/")}
                  >
                    New Booking
                  </Button>
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-[#009393]/10 p-3 rounded-md">
                        <svg className="h-6 w-6 text-[#009393]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">{stats.bookings}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-[#febf00]/10 p-3 rounded-md">
                        <svg className="h-6 w-6 text-[#febf00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Most Booked Route</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900 truncate">{getMostBookedRoute(bookings)}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-[#958c55]/10 p-3 rounded-md">
                        <svg className="h-6 w-6 text-[#958c55]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              P {stats.revenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent bookings */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
                    <div className="ml-4 mt-2">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Bookings</h3>
                    </div>
                    <div className="ml-4 mt-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        className="border-[#009393] text-[#009393] hover:bg-[#009393]/10"
                        onClick={() => router.push("/")}
                      >
                        View Schedule
                      </Button>
                    </div>
                  </div>
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No bookings yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new booking for your clients.</p>
                    <div className="mt-6">
                      <Button
                        onClick={() => router.push("/")}
                        className="bg-[#009393] hover:bg-[#007a7a] px-6 py-3 shadow-sm"
                      >
                        Create New Booking
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trip Details
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.slice(0, 5).map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-[#009393]">#{b.orderId}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                <span className="px-2 py-1 bg-gray-100 rounded-full">{b.seatCount} {b.seatCount === 1 ? 'seat' : 'seats'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#958c55]/10 flex items-center justify-center text-[#958c55] font-medium">
                                  {b.userName?.charAt(0).toUpperCase() || 'C'}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{b.userName || 'Customer'}</div>
                                  <div className="text-xs text-gray-500">{b.userEmail || ''}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{b.trip?.routeName}</div>
                              <div className="text-xs text-gray-500">{b.trip?.busType}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date(b.trip?.departureDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">{b.trip?.departureTime}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              P {b.totalPrice?.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#009393] hover:text-[#007a7a] hover:bg-[#009393]/10"
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {bookings.length > 5 && (
                      <div className="px-6 py-4 border-t border-gray-200 text-right">
                        <Button
                          variant="ghost"
                          className="text-[#009393] hover:text-[#007a7a]"
                        >
                          View all bookings
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : activeSection === 'bookings' ? (
            <BookingsManagement />
          ) : activeSection === 'busschedule' ? (
            <ConsultantBusSchedulePage onViewManifest={handleViewManifest} />
          ) : activeSection === 'manifest' && selectedBusId ? (
            <ManifestPanel busId={selectedBusId} onBack={() => setActiveSection('busschedule')} />
          ) : null}
        </div>
      </div>
    </div>
  );
}