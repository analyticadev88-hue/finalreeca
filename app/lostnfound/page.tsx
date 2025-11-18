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
import { Menu, User, Phone, Mail, MapPin, Clock, AlertCircle, CheckCircle, Facebook, Instagram } from "lucide-react";

export default function LostAndFound() {
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
              Lost and Found Policy
            </h1>
            <p className="text-xl mb-6"  style={{ color: 'rgb(148,138,84)' }}>
              Reeca Bus - Daily Route: Gaborone - OR Tambo International Airport
            </p>
            <div className="bg-white p-6 rounded-xl shadow-md border border-teal-200">
              <p className="text-lg text-gray-700">
                Did you forget something on the bus? We're here to help!
              </p>
              <p className="text-gray-600 mt-2">
                We understand that items can sometimes be accidentally left behind. Our team is committed to
                helping you recover any lost belongings quickly and efficiently.
              </p>
            </div>
          </div>

          {/* Report Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-2">
              <AlertCircle className="text-amber-600" size={24} />
              How to Report a Lost Item
            </h2>
            <p className="text-gray-700 mb-4">
              If you have lost an item on board, please contact us as soon as possible with the following details:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <li className="flex items-start gap-2">
                <CheckCircle className="text-teal-600 mt-1 flex-shrink-0" size={16} />
                <span>Your full name</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-teal-600 mt-1 flex-shrink-0" size={16} />
                <span>Date and time of travel</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-teal-600 mt-1 flex-shrink-0" size={16} />
                <span>Route taken (e.g., Gaborone to OR Tambo)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-teal-600 mt-1 flex-shrink-0" size={16} />
                <span>Seat number (if known)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-teal-600 mt-1 flex-shrink-0" size={16} />
                <span>Description of the lost item</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-teal-600 mt-1 flex-shrink-0" size={16} />
                <span>Your contact number or email</span>
              </li>
            </ul>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="text-teal-700" size={20} />
                  <h3 className="font-semibold text-teal-800">Call/WhatsApp</h3>
                </div>
                <p className="text-gray-700">
                  267 73061124<br />
                  267 76506348<br />
                  267 77655348
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="text-amber-700" size={20} />
                  <h3 className="font-semibold text-amber-800">Email</h3>
                </div>
                <p className="text-gray-700">
                  traveltalk@reecatravel.co.bw<br />
                  tickets@reecatravel.co.bw
                </p>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="text-teal-700" size={20} />
                  <h3 className="font-semibold text-teal-800">Office Location</h3>
                </div>
                <p className="text-gray-700">
                  Mogobe Plaza<br />
                  Gaborone CBD, Botswana
                </p>
              </div>
            </div>
          </section>

          {/* Storage Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-4">Where are lost items kept?</h2>
            <p className="text-gray-700 mb-4">
              All unclaimed items found on the bus are securely stored at our Lost and Found Department in
              Gaborone. Items will be held for up to 30 days from the date found. After this period,
              unclaimed items may be donated or discarded.
            </p>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mt-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-amber-700" size={20} />
                <h3 className="font-semibold text-amber-800">When can I retrieve my item?</h3>
              </div>
              <p className="text-gray-700">
                You can collect lost items Monday to Friday, from 09:00 – 17:00.<br />
                Bring a valid ID and provide a detailed description of the item when claiming.
              </p>
            </div>
          </section>

          {/* Important Notes */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-4">Important Notes</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <AlertCircle className="text-amber-600 mt-1 flex-shrink-0" size={16} />
                <span>We are not liable for personal belongings left unattended on the bus.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="text-amber-600 mt-1 flex-shrink-0" size={16} />
                <span>Valuables (phones, wallets, passports) should always be kept with you.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="text-amber-600 mt-1 flex-shrink-0" size={16} />
                <span>Found passports and official documents may be handed over to the relevant embassies or police authorities if not claimed within a reasonable period.</span>
              </li>
            </ul>
          </section>

          {/* Prevention Tips */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200">
            <h2 className="text-2xl font-bold text-teal-800 mb-4">Tips to Avoid Losing Items</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="text-teal-600 mt-1 flex-shrink-0" size={16} />
                <span>Double-check your seat and overhead area before leaving the bus.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-teal-600 mt-1 flex-shrink-0" size={16} />
                <span>Label your bags and electronics with your contact information.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="text-teal-600 mt-1 flex-shrink-0" size={16} />
                <span>Keep valuables in a carry-on you don't stow away.</span>
              </li>
            </ul>

            <div className="mt-8 p-4 bg-gradient-to-r from-teal-600 to-amber-600 rounded-lg text-center">
              <p className="text-white font-semibold text-lg">
                Need help now? Contact us at 267 77655348
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