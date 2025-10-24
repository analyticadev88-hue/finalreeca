"use client";
import { useState } from "react";
import Image from "next/image";
import ThemeToggle from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu, User, Bus, Clock, Calendar, MapPin, DollarSign, CheckCircle, AlertCircle, Info,
  Facebook,
  Instagram
} from "lucide-react";

export default function BusSchedule() {
  const NavLinks = () => (
    <>
    <a
        href="/"
      
        className="text-teal-800 hover:text-amber-600 font-medium"
      >
        Home
      </a>
      <a
        href="/aboutus"
      
        className="text-teal-800 hover:text-amber-600 font-medium"
      >
        About Us
      </a>
      <a
        href="/ourfleet"
        className="text-teal-800 hover:text-amber-600 font-medium"
      >
        Our Fleet
      </a>
      <a href="/help" className="text-teal-800 hover:text-amber-600 font-medium">Help</a>
      <a
        href="https://reecatravel.co.bw/?cat=5"
        target="_blank"
        rel="noopener noreferrer"
        className="text-teal-800 hover:text-amber-600 font-medium"
      >
        Reeca Holidays
      </a>
      <a
        href="/contactus"
        className="text-teal-800 hover:text-amber-600 font-medium"
      >
        Contact Us
      </a>
    </>
  );

  // Always show today's date in the schedule
  const today = new Date();
  const dateString = today.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
  const schedule = [
    {
      route: "Gaborone to OR Tambo Airport",
      date: dateString,
      time: "07:00",
      service: "Morning Bus",
      seats: 57,
      fare: "P500",
      status: "Active",
    },
    {
      route: "OR Tambo Airport to Gaborone",
      date: dateString,
      time: "08:00",
      service: "Morning Bus",
      seats: 57,
      fare: "P500",
      status: "Active",
    },
    {
      route: "Gaborone to OR Tambo Airport",
      date: dateString,
      time: "15:00",
      service: "Afternoon Bus",
      seats: 57,
      fare: "P500",
      status: "Active",
    },
    {
      route: "OR Tambo Airport to Gaborone",
      date: dateString,
      time: "17:00",
      service: "Afternoon Bus",
      seats: 57,
      fare: "P500",
      status: "Active",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <button className="p-2 rounded-md hover:bg-gray-100">
                    <Menu className="h-5 w-5 text-teal-800" />
                  </button>
                </SheetTrigger>
                <SheetContent>
                  <div className="flex flex-col space-y-3 mt-6">
                    <NavLinks />
                  </div>
                </SheetContent>
              </Sheet>
              <div className="bg-white rounded-lg flex items-center justify-center p-1" style={{ width: 180, height: 72 }}>
                <Image
                  src="/images/reeca-travel-logo.png"
                  alt="Reeca Travel"
                  width={900}
                  height={360}
                  style={{ width: "100%", height: "auto" }}
                  priority
                />
              </div>
            </div>
            <nav className="hidden md:flex gap-6">
              <NavLinks />
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <User className="h-5 w-5 text-teal-800" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.location.href = "/agent/auth"}>
                    Agent Portal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = "/consultant/auth"}>
                    Consultant Portal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center bg-teal-100 p-3 rounded-full mb-4">
              <Bus className="text-teal-600" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-teal-900 mb-2">
              Bus Schedule
            </h1>
            <p className="text-xl "  style={{ color: 'rgb(148,138,84)' }}>
              Reeca Bus - Daily Route: Gaborone – OR Tambo International Airport
            </p>
          </div>

          {/* Schedule Info */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <Calendar className="text-teal-600" size={24} />
              Daily Schedule
            </h2>
            <p className="text-gray-700 mb-6">
              Schedule times are the same every month.
            </p>

            {/* Schedule Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-teal-200 rounded-lg">
                <thead className="bg-teal-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-teal-800 font-semibold border-b border-teal-200">Route</th>
                    <th className="py-3 px-4 text-left text-teal-800 font-semibold border-b border-teal-200">Date</th>
                    <th className="py-3 px-4 text-left text-teal-800 font-semibold border-b border-teal-200">Time</th>
                    <th className="py-3 px-4 text-left text-teal-800 font-semibold border-b border-teal-200">Service</th>
                    <th className="py-3 px-4 text-left text-teal-800 font-semibold border-b border-teal-200">Seats</th>
                    <th className="py-3 px-4 text-left text-teal-800 font-semibold border-b border-teal-200">Fare</th>
                    <th className="py-3 px-4 text-left text-teal-800 font-semibold border-b border-teal-200">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-teal-50"}>
                      <td className="py-4 px-4 border-b border-teal-100">
                        <div className="flex items-center gap-2">
                          <MapPin className="text-amber-600" size={16} />
                          {item.route}
                        </div>
                      </td>
                      <td className="py-4 px-4 border-b border-teal-100">{item.date}</td>
                      <td className="py-4 px-4 border-b border-teal-100">
                        <div className="flex items-center gap-2">
                          <Clock className="text-teal-600" size={16} />
                          {item.time}
                        </div>
                      </td>
                      <td className="py-4 px-4 border-b border-teal-100">
                        <div className="flex items-center gap-2">
                          <Bus className="text-teal-600" size={16} />
                          {item.service}
                        </div>
                      </td>
                      <td className="py-4 px-4 border-b border-teal-100">
                        <div className="flex items-center gap-2">
                          <User className="text-teal-600" size={16} />
                          {item.seats}
                        </div>
                      </td>
                      <td className="py-4 px-4 border-b border-teal-100">
                        <div className="flex items-center gap-2">
                          {item.fare}
                        </div>
                      </td>
                      <td className="py-4 px-4 border-b border-teal-100">
                        <div className="flex items-center gap-2">
                          {item.status === "Active" ? (
                            <CheckCircle className="text-green-600" size={16} />
                          ) : (
                            <AlertCircle className="text-amber-600" size={16} />
                          )}
                          {item.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Additional Info */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-3">
              <Info className="text-amber-600" size={24} />
              Important Notes
            </h2>
            <ul className="space-y-3 text-gray-700 pl-5 list-disc">
              <li>Please arrive at least 15 minutes before departure for check-in.</li>
              <li>Fares are subject to change without prior notice.</li>
              <li>Seats are available on a first-come, first-served basis.</li>
              <li>For group bookings or private shuttles, contact our office directly.</li>
              <li>Border crossing times may affect the schedule. Plan accordingly.</li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
  <div className="container mx-auto px-4">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <h3 className="text-lg font-bold mb-4">REECA TRAVEL</h3>
        <p className="text-gray-400">
          Premium bus services between Botswana and South Africa.
        </p>
        <div className="flex space-x-4 mt-4">
          <a
            href="https://www.facebook.com/ReecaTravel/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white"
          >
            <Facebook className="h-5 w-5" />
          </a>
          <a
            href="https://www.instagram.com/ReecaTravel/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white"
          >
            <Instagram className="h-5 w-5" />
          </a>
        </div>
      </div>
      <div>
        <h4 className="font-bold mb-4">Quick Links</h4>
        <ul className="space-y-2">
          <li>
            <a href="/" className="text-gray-400 hover:text-white">
              Home
            </a>
          </li>
          <li>
            <a href="/schedulebuspage" className="text-gray-400 hover:text-white">
              Bus Schedule
            </a>
          </li>
          <li>
            <a href="/lostnfound" className="text-gray-400 hover:text-white">
              Lost & Found
            </a>
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-4">Information</h4>
        <ul className="space-y-2">
          <li>
            <a href="/terms" className="text-gray-400 hover:text-white">
              Terms & Conditions
            </a>
          </li>
          <li>
            <a href="/privacypolicy" className="text-gray-400 hover:text-white">
              Privacy Policy
            </a>
          </li>
          <li>
            <a href="/traveldocs" className="text-gray-400 hover:text-white">
              Travel Documents
            </a>
          </li>
          <li>
            <a href="/faq" className="text-gray-400 hover:text-white">
              FAQ
            </a>
          </li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold mb-4">Sales Office</h4>
        <address className="not-italic text-gray-400">
          <p>Mogobe Plaza, Gaborone CBD, 4th Floor</p>
          <p>Emergency Phone: +267 77655348</p>
          <p>Office Line: +267 73061124</p>
          <p>WhatsApp: +267 76506348</p>
          <p>Bus Tickets: tickets@reecatravel.co.bw</p>
          <p>Travel Services: traveltalk@reecatravel.co.bw</p>
        </address>
      </div>
    </div>
    <div className="mt-8 text-center">
      <a
        href="https://toporapuladev.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 hover:text-gray-400"
      >
        Developed by TLR
      </a>
    </div>
    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
      <p>© {new Date().getFullYear()} REECA Travel. All rights reserved.</p>
    </div>
  </div>
</footer>

    </div>
  );
}
