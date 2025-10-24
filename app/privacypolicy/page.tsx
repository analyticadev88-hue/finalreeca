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
  FileText, Briefcase, CheckCircle, ShieldAlert, UserCheck, MapPin, AlertCircle,
  Facebook,
  Instagram
} from "lucide-react";

import { useRef } from "react";
import { useEffect } from "react";

const sections = [
  { id: "introduction", label: "1. Introduction" },
  { id: "info", label: "2. Information We Collect" },
  { id: "usage", label: "3. How We Use Your Information" },
  { id: "protection", label: "4. Data Protection and Security" },
  { id: "sharing", label: "5. Sharing Your Information" },
  { id: "rights", label: "6. Your Rights" },
  { id: "cookies", label: "7. Cookies and Website Usage" },
  { id: "contact", label: "8. Contact Us" },
  { id: "updates", label: "9. Policy Updates" },
];

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    const handleScroll = () => {
      let current = sections[0].id;
      for (const sec of sections) {
        const el = sectionRefs.current[sec.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            current = sec.id;
          }
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      <main className="container mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row gap-8">
        <aside className="hidden md:block md:w-64 flex-shrink-0">
          <nav className="sticky top-28 bg-white p-6 rounded-xl shadow-md border border-teal-100">
            <h3 className="text-lg font-bold mb-4 text-teal-800">Quick Navigation</h3>
            <ul className="space-y-2">
              {sections.map((sec) => (
                <li key={sec.id}>
                  <button
                    type="button"
                    onClick={() => {
                      const el = sectionRefs.current[sec.id];
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setActiveSection(sec.id);
                      }
                    }}
                    className={`w-full text-left block px-3 py-2 rounded transition-colors font-medium ${activeSection === sec.id ? 'bg-teal-100 text-teal-900' : 'text-gray-700 hover:bg-teal-50'}`}
                  >
                    {sec.label}
                  </button>
                </li>
              ))}
  // Add smooth scroll behavior for browsers that support it
            </ul>
          </nav>
        </aside>
        <div className="flex-1 max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center bg-teal-100 p-3 rounded-full mb-4">
              <Shield className="text-teal-600" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-teal-900 mb-2">
              Privacy Policy
            </h1>
            <p className="text-xl " style={{ color: 'rgb(148,138,84)' }}>
              Reeca Bus - Daily Route: Gaborone - OR Tambo International Airport
            </p>
          </div>
          {/* Introduction */}
          <section
            id="introduction"
            ref={el => { sectionRefs.current["introduction"] = el; }}
            className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8"
          >
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <Shield className="text-teal-600" size={24} />
              1. Introduction
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>We value your privacy. This policy outlines how we collect, use, protect, and disclose your personal information when you use our airport bus transport services or access our website or booking platforms.</p>
            </div>
          </section>
          {/* Information Collected */}
          <section
            id="info"
            ref={el => { sectionRefs.current["info"] = el; }}
            className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8"
          >
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <FileText className="text-teal-600" size={24} />
              2. Information We Collect
            </h2>
            <p className="text-gray-700 mb-4">We may collect the following personal information:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <User className="text-teal-600" size={16} />
                </div>
                <span>Full name</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Mail className="text-teal-600" size={16} />
                </div>
                <span>Contact details (email, phone number)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Shield className="text-teal-600" size={16} />
                </div>
                <span>Passport or ID number (if required for cross-border travel)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <CreditCard className="text-teal-600" size={16} />
                </div>
                <span>Payment details (processed securely via third-party providers)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Briefcase className="text-teal-600" size={16} />
                </div>
                <span>Travel information (e.g., pick-up/drop-off locations, flight numbers, travel dates)</span>
              </li>
            </ul>
          </section>
          {/* Data Usage */}
          <section
            id="usage"
            ref={el => { sectionRefs.current["usage"] = el; }}
            className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8"
          >
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <ShieldCheck className="text-teal-600" size={24} />
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 mb-4">Your data is used to:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <CheckCircle className="text-teal-600" size={16} />
                </div>
                <span>Confirm and manage bookings</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <CheckCircle className="text-teal-600" size={16} />
                </div>
                <span>Communicate travel updates or service changes</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <CheckCircle className="text-teal-600" size={16} />
                </div>
                <span>Provide receipts or invoices</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <CheckCircle className="text-teal-600" size={16} />
                </div>
                <span>Handle lost & found inquiries</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <CheckCircle className="text-teal-600" size={16} />
                </div>
                <span>Ensure compliance with immigration/border control requirements</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <CheckCircle className="text-teal-600" size={16} />
                </div>
                <span>Improve service delivery and customer experience</span>
              </li>
            </ul>
          </section>
          {/* Data Protection */}
          <section
            id="protection"
            ref={el => { sectionRefs.current["protection"] = el; }}
            className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8"
          >
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <Lock className="text-teal-600" size={24} />
              4. Data Protection and Security
            </h2>
            <p className="text-gray-700 mb-4">We take all reasonable steps to protect your personal information:</p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Lock className="text-teal-600" size={16} />
                </div>
                <span>Data is stored securely on encrypted servers</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Lock className="text-teal-600" size={16} />
                </div>
                <span>Only authorized staff can access your data</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <Lock className="text-teal-600" size={16} />
                </div>
                <span>We do not store credit card information ourselves (payments are handled by secure third-party processors)</span>
              </li>
            </ul>
          </section>
          {/* Data Sharing */}
          <section
            id="sharing"
            ref={el => { sectionRefs.current["sharing"] = el; }}
            className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200 mb-8"
          >
            <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-3">
              <ShieldAlert className="text-amber-600" size={24} />
              5. Sharing Your Information
            </h2>
            <p className="text-gray-700 mb-4">We do not sell or rent your personal information. We may share it only when:</p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <ShieldAlert className="text-amber-600" size={16} />
                </div>
                <span>Required by law (e.g., immigration authorities)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <ShieldAlert className="text-amber-600" size={16} />
                </div>
                <span>Necessary for service delivery (e.g., with our booking partners or payment processors)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-amber-100 p-1 rounded-full mt-0.5">
                  <ShieldAlert className="text-amber-600" size={16} />
                </div>
                <span>You provide explicit consent</span>
              </li>
            </ul>
          </section>
          {/* User Rights */}
          <section
            id="rights"
            ref={el => { sectionRefs.current["rights"] = el; }}
            className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8"
          >
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <UserCheck className="text-teal-600" size={24} />
              6. Your Rights
            </h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700">
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <CheckCircle className="text-teal-600" size={16} />
                </div>
                <span>Access your personal data</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <CheckCircle className="text-teal-600" size={16} />
                </div>
                <span>Request correction of inaccurate information</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <CheckCircle className="text-teal-600" size={16} />
                </div>
                <span>Request deletion of your data (where legally applicable)</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-teal-100 p-1 rounded-full mt-0.5">
                  <CheckCircle className="text-teal-600" size={16} />
                </div>
                <span>Withdraw consent for marketing communications at any time</span>
              </li>
            </ul>
          </section>
          {/* Cookies */}
          <section
            id="cookies"
            ref={el => { sectionRefs.current["cookies"] = el; }}
            className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-gray-200 mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <Cookie className="text-gray-600" size={24} />
              7. Cookies and Website Usage
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>If you use our website:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="bg-gray-100 p-1 rounded-full mt-0.5">
                    <Cookie className="text-gray-600" size={16} />
                  </div>
                  <span>We may use cookies to improve browsing experience and monitor traffic.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-gray-100 p-1 rounded-full mt-0.5">
                    <Cookie className="text-gray-600" size={16} />
                  </div>
                  <span>You can disable cookies in your browser settings if you prefer.</span>
                </li>
              </ul>
            </div>
          </section>
          {/* Contact */}
          <section
            id="contact"
            ref={el => { sectionRefs.current["contact"] = el; }}
            className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8"
          >
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <Mail className="text-teal-600" size={24} />
              8. Contact Us
            </h2>
            <p className="text-gray-700 mb-6">For questions, data requests, or privacy-related concerns, please contact:</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="text-teal-700" size={20} />
                  <h3 className="font-semibold text-teal-800">Email</h3>
                </div>
                <p className="text-gray-700">
                  traveltalk@reecatravel.co.bw
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <div className="flex items-center gap-3 mb-2">
                  <Phone className="text-amber-700" size={20} />
                  <h3 className="font-semibold text-amber-800">Phone/WhatsApp</h3>
                </div>
                <p className="text-gray-700">
                  00267 73061124<br />
                  00267 76506348
                </p>
              </div>
              <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="text-teal-700" size={20} />
                  <h3 className="font-semibold text-teal-800">Office</h3>
                </div>
                <p className="text-gray-700">
                  Mogobe Plaza<br />
                  Gaborone CBD, 4th Floor Botswana
                </p>
              </div>
            </div>
          </section>
          {/* Updates */}
          <section
            id="updates"
            ref={el => { sectionRefs.current["updates"] = el; }}
            className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200"
          >
            <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-3">
              <AlertCircle className="text-amber-600" size={24} />
              9. Policy Updates
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>We may update this Privacy Policy occasionally. Updates will be posted on our website and take effect immediately upon publication.</p>
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
