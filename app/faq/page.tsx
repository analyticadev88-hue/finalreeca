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
  Menu, User, Shield, Lock, CreditCard, Mail, Phone, ShieldCheck, Cookie,
  FileText, Briefcase, CheckCircle, ShieldAlert, UserCheck, MapPin, AlertCircle, Bus, Clock, DollarSign, BookOpen, Luggage, Wifi, Utensils, Home, Info, HelpCircle, Instagram,
  Facebook
} from "lucide-react";

export default function FAQ() {
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

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "Do you operate daily between Gaborone and OR Tambo Airport?",
      answer: "Yes, we operate a reliable daily shuttle service from Gaborone to OR Tambo International Airport (Johannesburg), available 7 days a week.",
      icon: <Bus className="text-teal-600" size={20} />
    },
    {
      question: "What time does the shuttle depart from Gaborone & OR Tambo?",
      answer: "Our shuttle typically departs from Gaborone at 07:00 AM & 3:00 PM, and from OR Tambo at 08:00 AM & 5:00 PM. Please arrive at least 15 minutes early for check-in.",
      icon: <Clock className="text-teal-600" size={20} />
    },
    {
      question: "What time does the shuttle arrive at OR Tambo or Gaborone?",
      answer: "The estimated journey duration is 6 hours from either country, depending on traffic and border crossing times.",
      icon: <Clock className="text-teal-600" size={20} />
    },
    {
      question: "Where is the departure point in Gaborone?",
      answer: "We depart from Wimpy Western Bypass and Mogobe Plaza.",
      icon: <MapPin className="text-teal-600" size={20} />
    },
    {
      question: "How much is the fare?",
      answer: "The one-way fare is BWP 500 per passenger.",
      icon: <DollarSign className="text-teal-600" size={20} />
    },
    {
      question: "How can I book a seat?",
      answer: "Seats can be booked via: Our website: www.reecabus.co.bw, Phone or WhatsApp: 00267 73061124 / 00267 76506348, or in person at our Gaborone office: Mogobe Plaza, Gaborone.",
      icon: <BookOpen className="text-teal-600" size={20} />
    },
    {
      question: "Is advance booking required?",
      answer: "Yes, we recommend booking at least 24 hours in advance to secure your seat, especially during peak travel periods.",
      icon: <Info className="text-teal-600" size={20} />
    },
    {
      question: "What documents are needed to cross the border?",
      answer: "Passengers must carry: A valid passport, Visa or residence permit (if required). Please ensure your documents are up to date before travel.",
      icon: <FileText className="text-teal-600" size={20} />
    },
    {
      question: "Are there luggage restrictions?",
      answer: "Each passenger is allowed one large suitcase and one hand luggage. Extra luggage may incur additional charges.",
      icon: <Luggage className="text-teal-600" size={20} />
    },
    {
      question: "Is the shuttle air-conditioned and comfortable?",
      answer: "Yes, our vehicles are modern, air-conditioned, and offer a comfortable, safe travel experience with professional drivers.",
      icon: <Bus className="text-teal-600" size={20} />
    },
    {
      question: "Do you offer return trips from OR Tambo to Gaborone?",
      answer: "Yes, we offer a daily return service from OR Tambo back to Gaborone at 08:00 AM & 5:00 PM.",
      icon: <Bus className="text-teal-600" size={20} />
    },
    {
      question: "What if I miss my flight due to delays?",
      answer: "We plan our schedule to allow adequate time for check-in, but we are not liable for missed flights due to unexpected delays (e.g., border hold-ups or traffic). Travel insurance is recommended.",
      icon: <ShieldAlert className="text-amber-600" size={20} />
    },
    {
      question: "Can I cancel or change my booking?",
      answer: "Yes, cancellations or changes must be made at least 24 hours in advance. Cancellation fees may apply.",
      icon: <Info className="text-teal-600" size={20} />
    },
    {
      question: "Do you accept cash?",
      answer: "No, we are cashless. You can request a payment link or make a bank deposit after requesting bank details through email/WhatsApp.",
      icon: <CreditCard className="text-teal-600" size={20} />
    },
    {
      question: "Can I pay through a bank transfer?",
      answer: "Yes, as long as the funds reflect before departure.",
      icon: <CreditCard className="text-teal-600" size={20} />
    },
    {
      question: "When will my ticket be issued?",
      answer: "Your ticket is issued when payment has reflected for in-person bookings.",
      icon: <BookOpen className="text-teal-600" size={20} />
    },
    {
      question: "What meals do you offer?",
      answer: "We provide standard snacks like soft drinks, water, chips, or peanuts unless you opt for a Wimpy meal.",
      icon: <Utensils className="text-teal-600" size={20} />
    },
    {
      question: "What are your hours of operation?",
      answer: "08:00–18:30 (Mon–Fri), 08:00–15:00 (Sat).",
      icon: <Clock className="text-teal-600" size={20} />
    },
    {
      question: "Where is your office located?",
      answer: "Mogobe Plaza, Gaborone CBD, Botswana, Africa.",
      icon: <Home className="text-teal-600" size={20} />
    },
    {
      question: "Are there additional fees?",
      answer: "Yes, depending on the extras selected.",
      icon: <DollarSign className="text-teal-600" size={20} />
    },
    {
      question: "Do you offer travel packages?",
      answer: "Yes, we are a one-stop shop selling air tickets, bus tickets, hotel reservations, cruise ships, and assist with visas.",
      icon: <ShieldCheck className="text-teal-600" size={20} />
    },
    {
      question: "Is there Wi-Fi onboard?",
      answer: "Our buses are equipped with comfortable reclining seats, air conditioning, and may offer Wi-Fi and USB charging ports.",
      icon: <Wifi className="text-teal-600" size={20} />
    },
    {
      question: "Is there a toilet onboard?",
      answer: "Yes, for urinal services only.",
      icon: <Info className="text-teal-600" size={20} />
    },
    {
      question: "Do you offer private and shared shuttle options?",
      answer: "Yes, we offer both private (direct service for you and your group) and shared shuttles (with other passengers on similar schedules).",
      icon: <Bus className="text-teal-600" size={20} />
    },
    {
      question: "What happens at the border?",
      answer: "All passengers must disembark with their luggage for customs and immigration clearance at the Tlokweng Border Post.",
      icon: <Shield className="text-teal-600" size={20} />
    },
    {
      question: "Is the shuttle service safe and insured?",
      answer: "Yes. All our shuttles are fully licensed, insured, driven by trained professionals, and regularly maintained for safety and comfort.",
      icon: <ShieldCheck className="text-teal-600" size={20} />
    },
    {
      question: "Do you offer any other shuttle services from Gaborone, Botswana?",
      answer: "Yes, we offer Gaborone to Madikwe transfers (P8000.00 per vehicle, max 13 pax) and Gaborone to Sun City transfers (P10,000.00 per vehicle, max 13 pax). For larger groups, contact the office.",
      icon: <Bus className="text-teal-600" size={20} />
    },
    {
      question: "What documents do I need to board the bus?",
      answer: "You will be asked to present your ticket and/or ticket number with your passport at check-in to board.",
      icon: <FileText className="text-teal-600" size={20} />
    },
    {
      question: "I haven’t received my booking confirmation email, what should I do?",
      answer: "Contact the office immediately at +267 77655348 or tickets@reecatravel.co.bw.",
      icon: <HelpCircle className="text-amber-600" size={20} />
    },
    {
      question: "Can I trust the porters who offer assistance at boarding and disembarking points?",
      answer: "Yes, but be careful and only accept assistance from our staff in labeled uniforms. Do not leave your bags unattended.",
      icon: <UserCheck className="text-teal-600" size={20} />
    }
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
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center bg-teal-100 p-3 rounded-full mb-4">
              <HelpCircle className="text-teal-600" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-teal-900 mb-2">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-amber-700">
              Reeca Bus - Daily Route: Gaborone – OR Tambo International Airport
            </p>
          </div>

          {/* FAQ Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border-b border-teal-100 pb-4"
                >
                  <button
                    className="w-full flex justify-between items-center py-4 text-left"
                    onClick={() => toggleFAQ(index)}
                  >
                    <div className="flex items-center gap-3">
                      {faq.icon}
                      <h3 className="text-lg font-semibold text-teal-800">{faq.question}</h3>
                    </div>
                    <span className="text-teal-600">
                      {openIndex === index ? "−" : "+"}
                    </span>
                  </button>
                  {openIndex === index && (
                    <p className="text-gray-700 pl-8 pr-4">{faq.answer}</p>
                  )}
                </div>
              ))}
            </div>
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
