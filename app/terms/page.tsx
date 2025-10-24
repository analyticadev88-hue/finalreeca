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
import { Facebook, Instagram, Menu, User } from "lucide-react";

export default function TermsAndConditions() {
  const [activeSection, setActiveSection] = useState<string | null>("booking");

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
      <a href="/help" className="text-teal-800 hover:text-amber-600 font-medium">
        Help
      </a>
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

  const sections = [
    { id: "booking", title: "1. Booking & Ticketing" },
    { id: "pricing", title: "2. Pricing & Payments" },
    { id: "cancellations", title: "3. Cancellations & Refunds" },
    { id: "documents", title: "4. Travel Documents" },
    { id: "baggage", title: "5. Baggage Policy" },
    { id: "departures", title: "6. Departures & Delays" },
    { id: "children", title: "7. Children & Minors" },
    { id: "pets", title: "8. Pet Policy" },
    { id: "special-assistance", title: "9. Special Assistance Policy" },
    { id: "authorized-agents", title: "10. Authorised Sales Agents" },
    { id: "passenger-responsibility", title: "11. Passenger Responsibility" },
    { id: "indemnity", title: "12. General Indemnity Statement" },
    { id: "conduct", title: "13. Conduct & Safety" },
    { id: "liability", title: "14. Liability" },
    { id: "privacy", title: "15. Privacy" },
    { id: "law", title: "16. Governing Law" },
  ];

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
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-teal-900 mb-4">
              General Terms and Conditions of Service
            </h1>
            <p className="text-xl " style={{ color: 'rgb(148,138,84)' }}>
              Reeca Bus - Daily Route: Gaborone - OR Tambo International Airport
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="md:w-64 flex-shrink-0">
              <div className="sticky top-24 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h2 className="text-lg font-bold text-teal-800 mb-4">Quick Navigation</h2>
                <ul className="space-y-2">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${activeSection === section.id ? 'bg-teal-100 text-teal-800 font-medium' : 'text-gray-700 hover:bg-amber-50 hover:text-amber-700'}`}
                      >
                        {section.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white p-8 rounded-xl shadow-md border border-gray-200">
              {/* Booking and Ticketing */}
              <section id="booking" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">1. Booking and Ticketing</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>1.1.</strong> All passengers must book tickets in advance through our website, authorized agents, at our office in person or through email – tickets@reecatravel.co.bw.</p>
                  <p><strong>1.2.</strong> Email bookings should be made during working hours 08:00hrs -18:30hrs CAT Mon-Sat.</p>
                  <p><strong>1.3.</strong> Tickets are valid only for the date, time, and passenger indicated.</p>
                  <p><strong>1.4.</strong> Ticket is not transferable/no name swap. Ticket can only be used by the person whose name is on the ticket, and the passenger must carry a matching travel document.</p>
                  <p><strong>1.5.</strong> Passengers must present a valid ticket and identification (Valid Passport) when boarding.</p>
                  <p><strong>1.6.</strong> Children under 12 must be accompanied by an adult.</p>
                </div>
              </section>

              {/* Pricing and Payments */}
              <section id="pricing" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">2. Pricing and Payments</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>2.1.</strong> All fares are quoted in Botswana Pula.</p>
                  <p><strong>2.2.</strong> Payment must be made in full at the time of booking, online or bank deposit to secure a booking.</p>
                  <p><strong>2.3.</strong> Bank deposit should be made within a hour of booking and proof of payment emailed to secure seat.</p>
                  <p><strong>2.4.</strong> Discounts and promotions are subject to availability and may be withdrawn without notice.</p>
                  <p><strong>2.5.</strong> For bank deposit payments, request for bank details through email – tickets@reecatravel.co.bw or WhatsApp at 267 76506348 and reference with your names.</p>
                  <p><strong>2.6.</strong> Always share pop through mediums you received bank details and call to verify receipt.</p>
                  <p><strong>2.7.</strong> Infants under 2 years travel free but must be accompanied by an adult. Children aged 2-11 years are eligible for discounted fares.</p>
                </div>
              </section>

              {/* Cancellations and Refunds */}
              <section id="cancellations" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">3. Cancellations, Rescheduling and Refunds</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>3.1.</strong> Cancellations made at least 24 hours before departure are eligible for a refund minus a service fee of 10%.</p>
                  <p><strong>3.2.</strong> No refunds are given for cancellations made within 24 hours of departure or for no-shows or after departure.</p>
                  <p><strong>3.3.</strong> Notify the office for any cancellation at tickets@reecatravel.co.bw or call 267 73061124.</p>
                  <p><strong>3.4.</strong> Refunds will be processed within 7–14 business days.</p>
                  <p><strong>3.5.</strong> Rescheduling a ticket can only be done once by notifying us at least 12 hours before departure time or manage your booking online to rescheduled. Once a ticket is rescheduled, it cannot be cancelled or refunded.</p>
                </div>
              </section>

              {/* Travel Documents */}
              <section id="documents" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">4. Travel Documents and Border Requirements</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>4.1.</strong> Passengers are responsible for ensuring they carry all required travel documents, including a valid passport, visa (if required), and COVID-19 documentation (if applicable), Affidavits etc.</p>
                  <p><strong>4.2.</strong> Reeca Travel will not be liable for delays, denied boarding, or penalties due to incomplete or invalid travel documentation.</p>
                  <p><strong>4.3.</strong> Immigration and customs checks will occur at the Botswana-South Africa border. Passengers must comply with all relevant regulations.</p>
                </div>
              </section>

              {/* Baggage Policy */}
              <section id="baggage" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">5. Baggage Policy</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>5.1.</strong> Each passenger is allowed:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>1 checked-in bag (Apparent mass- max 23kg Regional/ 30kg International)</li>
                    <li>1 small hand luggage (Apparent mass-max 7kg)</li>
                  </ul>
                  <p><strong>5.2.</strong> Excess baggage may incur additional charges and is subject to space availability.</p>
                  <p><strong>5.3.</strong> The company is not responsible for loss or damage to valuables (e.g., electronics, cash, jewelry) unless stored securely with our staff.</p>
                  <p><strong>5.4.</strong> Reeca Travel is not responsible for loss or damage to passenger's luggage, except if such loss or damage arises directly or indirectly from the gross negligence or willful misconduct of Reeca Travel or any person acting for and controlled by Reeca Travel.</p>
                </div>
              </section>

              {/* Departures and Delays */}
              <section id="departures" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">6. Departure and Delays</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>6.1.</strong> Passengers must arrive at the departure point at least 15 minutes before scheduled departure.</p>
                  <p><strong>6.2.</strong> The company is not liable for missed connections due to delays caused by traffic, weather, strikes, border closures or border processing times and pandemics.</p>
                  <p><strong>6.3.</strong> We strive to maintain schedules but do not guarantee arrival or departure times. Customers are advised to plan connections with sufficient time buffers.</p>
                  <p><strong>6.4.</strong> If the bus is delayed or canceled, alternative arrangements or refunds may be offered at the company's discretion.</p>
                  <p><strong>6.5.</strong> Travel insurance is highly recommended.</p>
                  <p><strong>6.6.</strong> Reeca Travel partners with reputable insurance providers for comprehensive coverage options. Always liaise with the office once opted for the travel insurance in order to receive the travel insurance policy.</p>
                </div>
              </section>

              {/* Children and Minors */}
              <section id="children" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">7. Children and Minors</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>7.1.</strong> Infants under 2 years travel free and do not occupy a seat but must be accompanied by an adult.</p>
                  <p><strong>7.2.</strong> Children aged 2-11 years are eligible for discounted fares.</p>
                  <p><strong>7.3.</strong> Strollers and car seats can be checked in free of charge.</p>
                  <p><strong>7.4.</strong> Children under 18 must be accompanied by an adult and must comply with Botswana and South African laws regarding minor travel.</p>
                  <p><strong>7.5.</strong> Unaccompanied minors are not permitted unless pre-approved by the Company in writing.</p>
                </div>
              </section>

              {/* Pet Policy */}
              <section id="pets" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">8. Pet Policy</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>8.1.</strong> Pets are not allowed to ensure safety, hygiene, and comfort of all passengers.</p>
                </div>
              </section>

              {/* Special Assistance Policy */}
              <section id="special-assistance" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">9. Special Assistance Policy</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>9.1.</strong> Passengers requiring special assistance should notify Reeca Travel at least 48 hours in advance.</p>
                  <p><strong>9.2.</strong> We strive to accommodate all passengers' needs to ensure a comfortable journey.</p>
                </div>
              </section>

              {/* Authorised Sales Agents */}
              <section id="authorized-agents" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">10. Authorised Sales Agents</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>10.1.</strong> Tickets may only be purchased through agents authorized by Reeca Travel.</p>
                  <p><strong>10.2.</strong> The list of authorized agents can be verified on our website <a href="https://www.reecabus.co.bw" className="text-blue-600">www.reecabus.co.bw</a> or by contacting our customer service at 267 73061124.</p>
                  <p><strong>10.3.</strong> Tickets purchased from authorized agents are valid only when issued through our official system and accompanied by a valid receipt or e-ticket.</p>
                  <p><strong>10.4.</strong> Reeca Travel is not liable for any losses caused by unauthorized agents or third parties.</p>
                  <p><strong>10.5.</strong> Agents are not allowed to charge extra fees or offer unauthorized discounts.</p>
                </div>
              </section>

              {/* Passenger Responsibility */}
              <section id="passenger-responsibility" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">11. Passenger Responsibility</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>11.1.</strong> Passengers are responsible for securing their own travel insurance if desired.</p>
                  <p><strong>11.2.</strong> Passengers must adhere to all company policies (e.g., safety, luggage, pet, and behavior policies).</p>
                  <p><strong>11.3.</strong> Passengers must board on time and retain valid travel documents and identification.</p>
                </div>
              </section>

              {/* General Indemnity Statement */}
              <section id="indemnity" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">12. General Indemnity Statement</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>12.1.</strong> By purchasing a ticket and/or using transport services provided by Reeca Travel, the passenger agrees to the following terms:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>The passenger shall indemnify, defend, and hold harmless Reeca Travel, its officers, drivers, employees, agents, and contractors against any and all losses, claims, damages, liabilities, penalties, legal costs, or expenses (including reasonable attorney fees) arising from or related to:</li>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>The passenger’s actions, omissions, negligence, or misconduct during transport;</li>
                      <li>Violation of the company's policies, laws, or regulations by the passenger;</li>
                      <li>Damage caused by the passenger to the vehicle, equipment, or other passengers;</li>
                      <li>Transportation of undeclared or prohibited items (e.g., hazardous materials, illegal goods, live animals not in compliance with pet policy);</li>
                      <li>Any injury, illness, or death arising from conditions beyond the company’s control, including but not limited to road accidents, weather events, strikes, delays, or third-party actions.</li>
                    </ul>
                  </ul>
                </div>
              </section>

              {/* Conduct and Safety */}
              <section id="conduct" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">13. Conduct and Safety</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>13.1.</strong> Passengers must behave respectfully and comply with all instructions from the driver and staff.</p>
                  <p><strong>13.2.</strong> Alcohol, drugs, and smoking are prohibited on board.</p>
                  <p><strong>13.3.</strong> The Company reserves the right to refuse service to intoxicated, disruptive, or non-compliant individuals without refund.</p>
                </div>
              </section>

              {/* Liability */}
              <section id="liability" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">14. Liability</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>14.1.</strong> The Company will make every effort to ensure timely departure and arrival but is not liable for delays caused by traffic, border procedures, mechanical failure, or other events beyond our control.</p>
                  <p><strong>14.2.</strong> Therefore Reeca Travel does not take responsibility for missed onward connections. Reeca Travel does not guarantee any arrival or departure times, neither does it accept any liability for any inconveniences experienced due to unforeseen circumstances.</p>
                </div>
              </section>

              {/* Privacy */}
              <section id="privacy" className="mb-12">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">15. Privacy</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>15.1.</strong> We collect and process personal data in accordance with our Privacy Policy. By using our services, you consent to such processing.</p>
                </div>
              </section>

              {/* Governing Law */}
              <section id="law">
                <h2 className="text-2xl font-bold text-teal-800 mb-4">16. Governing Law</h2>
                <div className="space-y-4 text-gray-700">
                  <p><strong>16.1.</strong> These Terms shall be governed by the laws of the Republic of Botswana.</p>
                </div>
              </section>

              {/* Contact Information */}
              <div className="mt-16 p-6 bg-gradient-to-r from-teal-50 to-amber-50 rounded-xl border border-teal-200">
                <h2 className="text-xl font-bold text-teal-800 mb-4">Contact Information</h2>
                <p className="text-gray-700 mb-4">For inquiries or complaints, please contact:</p>
                <address className="not-italic text-gray-700 space-y-2">
                  <p><strong>Reeca Travel</strong></p>
                  <p>Mogobe Plaza, Gaborone CBD 4th Floor Botswana</p>
                  <p>Tel: 00267 73061124</p>
                  <p>Email: tickets@reecatravel.co.bw</p>
                  <p>Website: www.reecabus.co.bw</p>
                  <p>Office operating times: weekdays 08:00hrs-18:00hrs, Saturday 08:00hrs-15:30hrs. Sundays: 0900-12:00</p>
                </address>
                <p className="mt-4 text-gray-700 italic">By purchasing a ticket and boarding the bus, you agree to abide by the above Terms and Conditions.</p>
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
