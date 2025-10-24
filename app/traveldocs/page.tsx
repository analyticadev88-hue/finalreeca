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
import { Menu, User, FileText, ShieldAlert, CalendarCheck, Ticket, Hotel, Briefcase, ClipboardCheck, Facebook, Instagram } from "lucide-react";

export default function TravelDocuments() {
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
              Travel Documents Requirements
            </h1>
            <p className="text-xl mb-6"  style={{ color: 'rgb(148,138,84)' }}>
              Reeca Bus - Daily Route: Gaborone – OR Tambo International Airport
            </p>
            <div className="bg-white p-6 rounded-xl shadow-md border border-teal-200">
              <p className="text-lg text-gray-700">
                Essential documents you'll need for border crossing
              </p>
              <p className="text-gray-600 mt-2">
                Ensure you have all required documents before boarding to avoid travel disruptions
              </p>
            </div>
          </div>

          {/* Passport Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <FileText className="text-teal-600" size={24} />
              1. Valid Passport
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <FileText className="text-teal-600" size={16} />
                </div>
                <span>All travelers must carry a valid passport with at least 6 months' validity from the date of travel.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <FileText className="text-teal-600" size={16} />
                </div>
                <span>Make sure your passport has at least one blank page for immigration stamps.</span>
              </li>
            </ul>
          </section>

          {/* Visa Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-3">
              <ShieldAlert className="text-amber-600" size={24} />
              2. Visa (If Required)
            </h2>
            <p className="text-gray-700 mb-4">
              Depending on your nationality, you may need a South African visa:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                <h3 className="font-semibold text-teal-800 mb-2 flex items-center gap-2">
                  <span className="bg-teal-600 text-white p-1 rounded">✅</span>
                  Botswana citizens:
                </h3>
                <p className="text-gray-700">
                  No visa required for visits of up to 90 days.
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <span className="bg-amber-600 text-white p-1 rounded">❗</span>
                  Other nationalities:
                </h3>
                <p className="text-gray-700">
                  Check with the South African Embassy or DHA (Department of Home Affairs) to see if a visa is required for your country.
                </p>
                <p className="text-gray-700 mt-2 font-medium">
                  Apply in advance if needed — border visas are not issued.
                </p>
              </div>
            </div>
          </section>

          {/* COVID Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-gray-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <CalendarCheck className="text-gray-600" size={24} />
              3. COVID-19 Requirements (If Applicable)
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
              <p className="text-blue-800 font-medium">
                As of August 2025, COVID-19 travel restrictions are generally lifted, but:
              </p>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                  <CalendarCheck className="text-blue-600" size={16} />
                </div>
                <span>Carry proof of vaccination or recent test if required by either country (subject to change).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-blue-100 p-1 rounded-full mt-0.5">
                  <CalendarCheck className="text-blue-600" size={16} />
                </div>
                <span>Keep a mask handy — still required at some border points or transport hubs.</span>
              </li>
            </ul>
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-gray-700 text-sm">
                Always confirm with official government or airline websites before traveling.
              </p>
            </div>
          </section>

          {/* Minors Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-3">
              <ShieldAlert className="text-amber-600" size={24} />
              4. For Minors (Under 18 Years Old)
            </h2>
            <p className="text-gray-700 mb-4">
              South Africa has strict requirements for minors crossing borders, even by bus:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <FileText className="text-amber-600" size={16} />
                </div>
                <span>Valid passport</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <FileText className="text-amber-600" size={16} />
                </div>
                <span>Unabridged birth certificate</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <FileText className="text-amber-600" size={16} />
                </div>
                <span>Parental consent affidavit if traveling with only one parent or someone else (must be signed by the non-traveling parent and certified)</span>
              </li>
            </ul>
          </section>

          {/* Return Ticket Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <Ticket className="text-teal-600" size={24} />
              5. Return or Onward Ticket
            </h2>
            <p className="text-gray-700">
              Some travelers may be asked to show proof of onward or return travel, especially if you're on a tourist visa.
            </p>
          </section>

          {/* Accommodation Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <Hotel className="text-teal-600" size={24} />
              6. Proof of Accommodation or Travel Itinerary
            </h2>
            <p className="text-gray-700 mb-4">
              Immigration officers may ask for:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Briefcase className="text-teal-600" size={16} />
                </div>
                <span>Hotel booking confirmation</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Briefcase className="text-teal-600" size={16} />
                </div>
                <span>Invitation letter from a host</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Briefcase className="text-teal-600" size={16} />
                </div>
                <span>Airport transfer or tour documents</span>
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
                <span>Keep all documents printed and digital copies with you.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <ClipboardCheck className="text-amber-600" size={16} />
                </div>
                <span>Carry your documents in your hand luggage, not checked bags.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <ClipboardCheck className="text-amber-600" size={16} />
                </div>
                <span>Arrive at the bus terminal early to allow time for document checks and border procedures.</span>
              </li>
            </ul>

            <div className="mt-8 p-4 bg-gradient-to-r from-teal-600 to-amber-600 rounded-lg text-center">
              <p className="text-white font-semibold text-lg">
                Confirm with relevant authorities before travel to avoid disappointments.
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