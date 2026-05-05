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
import { Menu, User, FileText, ShieldAlert, CalendarCheck, Ticket, Hotel, Briefcase, ClipboardCheck, Bus, Search, CreditCard, UserCheck, Car, MapPin, Clock, Wifi, Luggage, Utensils, ShieldCheck, Mail, Download, Clock4, Facebook, Instagram } from "lucide-react";

export default function BookingHelp() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-teal-50">
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
              <div
                className="bg-white rounded-lg flex items-center justify-center p-1"
                style={{ width: 180, height: 72 }}
              >
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

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-teal-900 mb-4">
              How to Book: Reeca Bus Daily Route
            </h1>
            <p className="text-xl  mb-6"  style={{ color: 'rgb(148,138,84)' }}>
              Gaborone - OR Tambo International Airport
            </p>
            <div className="bg-white p-6 rounded-xl shadow-md border border-teal-200">
              <p className="text-lg text-gray-700">
                Step-by-step guide to booking your bus ticket online
              </p>
              <p className="text-gray-600 mt-2">
                Follow these simple steps to secure your seat and enjoy a comfortable journey
              </p>
            </div>
          </div>

          {/* Visit Website Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <Bus className="text-teal-600" size={24} />
              1. Visit the Official Website
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Bus className="text-teal-600" size={16} />
                </div>
                <span>Go to <a href="https://www.reecabus.co.bw" className="text-amber-600 hover:underline">www.reecabus.co.bw</a> to start your booking.</span>
              </li>
            </ul>
          </section>

          {/* Enter Travel Details Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-3">
              <Search className="text-amber-600" size={24} />
              2. Enter Your Travel Details
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <MapPin className="text-amber-600" size={16} />
                </div>
                <span>Select your departure city (From) and destination (To).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <CalendarCheck className="text-amber-600" size={16} />
                </div>
                <span>Choose your travel date. If it's a round trip, also select your return date.</span>
              </li>
            </ul>
          </section>

          {/* Search for Buses Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <Search className="text-teal-600" size={24} />
              3. Search for Available Buses
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Search className="text-teal-600" size={16} />
                </div>
                <span>Click on "Book Now" to see available options.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Clock className="text-teal-600" size={16} />
                </div>
                <span>The system will display morning and afternoon buses with their fares.</span>
              </li>
            </ul>
          </section>

          {/* Compare and Choose Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-3">
              <ClipboardCheck className="text-amber-600" size={24} />
              4. Compare and Choose a Bus
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <Clock className="text-amber-600" size={16} />
                </div>
                <span>Select your preferred departure time.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <Wifi className="text-amber-600" size={16} />
                </div>
                <span>Review amenities such as Wi-Fi, charging ports, snacks, and baggage allowance.</span>
              </li>
            </ul>
          </section>

          {/* Select Seat Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <Car className="text-teal-600" size={24} />
              5. Select Your Seat
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Car className="text-teal-600" size={16} />
                </div>
                <span>Pick your preferred seat from the seat map.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Car className="text-teal-600" size={16} />
                </div>
                <span>For extra space, click "travel neighbour free" and select two seats.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Car className="text-teal-600" size={16} />
                </div>
                <span>Click "Proceed" after selecting your seat(s).</span>
              </li>
            </ul>
          </section>

          {/* Passenger Details Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-3">
              <UserCheck className="text-amber-600" size={24} />
              6. Enter Passenger Details
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <FileText className="text-amber-600" size={16} />
                </div>
                <span>Fill in full passenger details as they appear on your passport.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <UserCheck className="text-amber-600" size={16} />
                </div>
                <span>Provide the purchaser's details and emergency contact information.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <MapPin className="text-amber-600" size={16} />
                </div>
                <span>Select your boarding and dropping off points.</span>
              </li>
            </ul>
          </section>

          {/* Personalise Trip Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <ShieldCheck className="text-teal-600" size={24} />
              7. Personalise Your Trip
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Luggage className="text-teal-600" size={16} />
                </div>
                <span>Add extra baggage if you have more than one checked-in bag.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Utensils className="text-teal-600" size={16} />
                </div>
                <span>Wimpy Meal is available for morning departures from Gaborone only.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <ShieldCheck className="text-teal-600" size={16} />
                </div>
                <span>Travel insurance is available for trips of 1-7 days (excluding America). For travel to America or long stays, contact the office directly.</span>
              </li>
            </ul>
          </section>

          {/* Payment Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-3">
              <CreditCard className="text-amber-600" size={24} />
              8. Make Payment
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <CreditCard className="text-amber-600" size={16} />
                </div>
                <span>Choose your payment method: credit card, debit card, or bank deposit.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <Mail className="text-amber-600" size={16} />
                </div>
                <span>If paying by bank deposit, email your proof of payment to <a href="mailto:tickets@reecatravel.co.bw" className="text-amber-600 hover:underline">tickets@reecatravel.co.bw</a> to secure your booking.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <FileText className="text-amber-600" size={16} />
                </div>
                <span>Read and accept the Terms & Conditions, then click "Pay".</span>
              </li>
            </ul>
          </section>

          {/* Confirmation Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <Mail className="text-teal-600" size={24} />
              9. Receive Confirmation
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Mail className="text-teal-600" size={16} />
                </div>
                <span>You will receive a booking confirmation on screen and via email.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Download className="text-teal-600" size={16} />
                </div>
                <span>You can download your ticket for your records.</span>
              </li>
            </ul>
          </section>

          {/* Day of Travel Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-3">
              <Clock4 className="text-amber-600" size={24} />
              10. Day of Travel
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <Clock4 className="text-amber-600" size={16} />
                </div>
                <span>Arrive at the boarding point early.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <Ticket className="text-amber-600" size={16} />
                </div>
                <span>Show your ticket (digital or printed) and passport at the boarding point.</span>
              </li>
            </ul>
          </section>

          {/* Tips Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200">
            <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-3">
              <ClipboardCheck className="text-amber-600" size={24} />
              Travel Tips
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <ClipboardCheck className="text-amber-600" size={16} />
                </div>
                <span>Keep your ticket and passport handy.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <ClipboardCheck className="text-amber-600" size={16} />
                </div>
                <span>Arrive at least 30 minutes before departure.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <ClipboardCheck className="text-amber-600" size={16} />
                </div>
                <span>Check your email for any last-minute updates or changes.</span>
              </li>
            </ul>

            <div className="mt-8 p-4 bg-gradient-to-r from-teal-600 to-amber-600 rounded-lg text-center">
              <p className="text-white font-semibold text-lg">
                For any questions or assistance, contact us at <a href="mailto:tickets@reecatravel.co.bw" className="underline">tickets@reecatravel.co.bw</a> or call +267 77655348.
              </p>
            </div>
          </section>
        </div>
      </main>

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
        href="https://toporapula.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 hover:text-gray-400"
      >
        Developed by Topo Rapula
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
