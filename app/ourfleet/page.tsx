"use client";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";
import HireBusModal from "../booking/hirebusmodal";
import { Facebook, Instagram, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function FleetPage() {
  const [showHireModal, setShowHireModal] = useState(false);

  const vehicles = [
    {
      type: "Luxury Coach",
      name: "SCANIA TOURING",
      description: "Our flagship service with premium comfort for long-distance travel between Gaborone and Johannesburg. Features reclining seats, onboard entertainment, and climate control.",
      capacity: "57 passengers",
      image: "/images/tl.webp",
      features: [
        "Air conditioning",
        "Reclining seats",
        "Onboard entertainment",
        "USB charging ports",
        "Ample legroom",
        "WC",
      ]
    },
    {
      type: "25 Seater Mini Bus",
      name: "Mercedes-Benz Sprinter",
      description: "Premium combi service for smaller groups with luxury amenities. Perfect for business travelers or small family trips.",
      capacity: "25 passengers",
      image: "/images/sp.webp",
      features: [
        "Luxury leather seats",
        "Climate control",
        "Charging ports",
        "Complimentary water",
        "Executive class service"
      ]
    },
    {
      type: "Luxurious Quantum",
      name: "Toyota Quantum GL",
      description: "Reliable and comfortable transport for small groups at affordable rates. Our most economical option for regional travel.",
      capacity: "13 passengers",
      image: "/images/lq.webp",
      features: [
        "Comfortable seating",
        "Air conditioning",
        "Reliable service",
        "Affordable rates",
        "Frequent departures"
      ]
    }
  ];

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
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-4">
              <Sheet>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="outline" size="icon" className="h-8 w-8 sm:h-10 sm:w-10">
                    <Menu className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <div className="flex flex-col space-y-4 mt-8">
                    <NavLinks />
                  </div>
                </SheetContent>
              </Sheet>
              <div className="w-16 h-10 sm:w-20 sm:h-12 md:w-24 md:h-14 bg-white rounded-lg flex items-center justify-center p-1">
                <Image
                  src="/images/reeca-travel-logo.png"
                  alt="Reeca Transport"
                  width={150}
                  height={150}
                  className="object-contain"
                />
              </div>
              <div className="hidden xs:block">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#007F7F] leading-tight">REECA TRANSPORT</h1>
                <p className="text-xs text-[#B9B28F] hidden sm:block">Clean & serviced vehicles</p>
              </div>
            </div>
            <nav className="hidden lg:flex gap-6">
              <NavLinks />
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#007F7F] mb-3 sm:mb-4">Our Fleet</h1>
          <p className="text-base sm:text-lg lg:text-xl text-[#B9B28F] max-w-2xl mx-auto px-2">
            Travel in comfort and style with our modern fleet
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
          {vehicles.map((vehicle, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
              <div className="relative bg-gray-100 h-80">
                <Image
                  src={vehicle.image}
                  alt={vehicle.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4">
                  <span className="text-xs font-semibold text-white bg-[#007F7F] px-2 py-1 rounded">{vehicle.type}</span>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-2">{vehicle.name}</h3>
                </div>
              </div>
              <div className="p-4 sm:p-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-sm font-medium text-[#007F7F]">{vehicle.capacity}</span>
                  <span className="text-xs font-semibold bg-[#FFC002]/20 text-[#007F7F] px-2 py-1 rounded">Available</span>
                </div>
                <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">{vehicle.description}</p>
                <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6 flex-1">
                  {vehicle.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[#007F7F] mt-1 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-[#FFD700] hover:bg-[#006B6B] text-white py-2.5 sm:py-3 text-sm sm:text-base font-medium"
                  onClick={() => setShowHireModal(true)}
                >
                  Hire This Vehicle
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-r from-[#007F7F] to-[#006B6B] rounded-xl p-4 sm:p-6 lg:p-8 text-white mb-8 sm:mb-12 lg:mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">Need a Custom Solution?</h2>
            <p className="text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 opacity-90 leading-relaxed px-2">
              Whether you need transportation for a corporate event, wedding, or group tour,
              we can provide customized solutions to meet your specific requirements.
            </p>
            <Button
              className="bg-[#B9B28F] hover:bg-[#A8A088] text-white px-6 sm:px-8 py-3 sm:py-4 lg:py-6 text-sm sm:text-base lg:text-lg font-medium"
              onClick={() => setShowHireModal(true)}
            >
              Hire a Coach for Your Group
            </Button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-[#007F7F] mb-4 sm:mb-6 text-center sm:text-left">Why Choose Our Fleet?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="flex flex-col sm:flex-row items-start text-center sm:text-left">
              <div className="bg-[#007F7F]/10 p-2.5 sm:p-3 rounded-full mb-3 sm:mb-0 sm:mr-4 mx-auto sm:mx-0 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#007F7F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#007F7F] mb-2">Safety First</h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">All our vehicles undergo regular maintenance and safety checks by certified technicians.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start text-center sm:text-left">
              <div className="bg-[#007F7F]/10 p-2.5 sm:p-3 rounded-full mb-3 sm:mb-0 sm:mr-4 mx-auto sm:mx-0 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#007F7F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#007F7F] mb-2">Punctual Service</h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">We pride ourselves on timely departures and arrivals for all our scheduled services.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start text-center sm:text-left sm:col-span-2 lg:col-span-1">
              <div className="bg-[#007F7F]/10 p-2.5 sm:p-3 rounded-full mb-3 sm:mb-0 sm:mr-4 mx-auto sm:mx-0 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#007F7F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path>
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#007F7F] mb-2">Comfort Guaranteed</h3>
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">Modern amenities and spacious seating ensure a comfortable journey every time.</p>
              </div>
            </div>
          </div>
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

      {showHireModal && (
        <HireBusModal
          onClose={() => setShowHireModal(false)}
          onSubmit={async (formData) => {
            await fetch("/api/inquiries", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(formData),
            });
            setShowHireModal(false);
            alert("Your hire inquiry has been submitted. We'll contact you soon!");
          }}
        />
      )}
    </div>
  );
}