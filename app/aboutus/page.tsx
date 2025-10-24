"use client";
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
  Menu, User, Plane, Globe, Hotel, Bus, Ticket, ShieldCheck, MapPin, Calendar, Users, Facebook, Instagram
} from "lucide-react";

export default function AboutUs() {
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
              <Globe className="text-teal-600" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-teal-900 mb-2">
              About Us
            </h1>
            <p className="text-xl" style={{ color: 'rgb(148,138,84)' }}>
              Welcome to Reeca Travel
            </p>
          </div>

          {/* Introduction Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <div className="prose max-w-none text-gray-700">
              <p className="text-lg mb-6">
                Welcome to <strong>Reeca Travel</strong>, where every journey is designed to create unforgettable memories!
              </p>
              <p className="text-lg mb-6">
                At Reeca Travel, we are passionate about curating travel experiences that go beyond sightseeing. We specialize in crafting personalized travel packages that cater to every traveler's dream, ensuring your journey is as unique as you are. Whether you're looking for serene beaches, majestic mountains, vibrant cities, or rich cultural explorations, we've got you covered.
              </p>
            </div>
          </section>

          {/* Services Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <ShieldCheck className="text-teal-600" size={24} />
              Our Services
            </h2>
            <p className="text-gray-700 mb-6">
              With a commitment to excellence and a deep understanding of the travel industry, our team works tirelessly to ensure every trip is seamless, enjoyable, and memorable. We handle every detail—from flights and accommodations to local experiences—so you can focus on what matters most: enjoying your journey.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Service Card 1 */}
              <div className="bg-teal-50 p-6 rounded-lg border border-teal-200">
                <div className="flex items-center justify-center bg-teal-100 w-12 h-12 rounded-full mb-4 mx-auto">
                  <Plane className="text-teal-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-teal-800 text-center mb-3">Tailor-Made Holidays</h3>
                <p className="text-gray-700 text-center">
                  Custom holiday packages to exotic destinations around the world, designed just for you.
                </p>
              </div>

              {/* Service Card 2 */}
              <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                <div className="flex items-center justify-center bg-amber-100 w-12 h-12 rounded-full mb-4 mx-auto">
                  <Hotel className="text-amber-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-amber-800 text-center mb-3">Accommodation & Tickets</h3>
                <p className="text-gray-700 text-center">
                  Air ticketing, hotel reservations, travel insurance, and visa assistance for hassle-free travel.
                </p>
              </div>

              {/* Service Card 3 */}
              <div className="bg-teal-50 p-6 rounded-lg border border-teal-200">
                <div className="flex items-center justify-center bg-teal-100 w-12 h-12 rounded-full mb-4 mx-auto">
                  <Bus className="text-teal-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-teal-800 text-center mb-3">Transport Services</h3>
                <p className="text-gray-700 text-center">
                  Daily transport between Gaborone (7am & 3pm) and OR Tambo (8am & 5pm), plus international bus and train tickets.
                </p>
              </div>

              {/* Service Card 4 */}
              <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                <div className="flex items-center justify-center bg-amber-100 w-12 h-12 rounded-full mb-4 mx-auto">
                  <Ticket className="text-amber-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-amber-800 text-center mb-3">Event Tickets</h3>
                <p className="text-gray-700 text-center">
                  Sport tickets, cruise ships, and special event bookings to make your trip extraordinary.
                </p>
              </div>

              {/* Service Card 5 */}
              <div className="bg-teal-50 p-6 rounded-lg border border-teal-200">
                <div className="flex items-center justify-center bg-teal-100 w-12 h-12 rounded-full mb-4 mx-auto">
                  <Users className="text-teal-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-teal-800 text-center mb-3">MICE Travel</h3>
                <p className="text-gray-700 text-center">
                  Meetings, Incentives, Conferences, and Exhibitions travel solutions for corporate clients.
                </p>
              </div>

              {/* Service Card 6 */}
              <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                <div className="flex items-center justify-center bg-amber-100 w-12 h-12 rounded-full mb-4 mx-auto">
                  <MapPin className="text-amber-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-amber-800 text-center mb-3">Adventure Travel</h3>
                <p className="text-gray-700 text-center">
                  Thrilling adventures like cruises, water sports, and wildlife safaris for the adventurous soul.
                </p>
              </div>
            </div>
          </section>

          {/* Image Gallery Section */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-3">
              <Calendar className="text-amber-600" size={24} />
              Travel Memories
            </h2>
            <p className="text-gray-700 mb-6">
              Let Reeca Travel be your trusted travel partner as we turn your travel dreams into reality.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Image Placeholder 1 */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border border-teal-200">
                <Image
                  src="/images/1.webp"
                  alt="Travel in style"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Image Placeholder 2 */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border border-teal-200">
                <Image
                  src="/images/cons.webp"
                  alt="Unique travel experience"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Image Placeholder 3 */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border border-teal-200">
                <Image
                  src="/images/tl.webp"
                  alt="New fleet"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-teal-600 text-white p-6 md:p-8 rounded-xl shadow-md text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Explore?</h2>
            <p className="text-lg mb-6">
              Contact us today to start planning your dream vacation with Reeca Travel!
            </p>
            <button
              className="bg-white text-teal-600 font-semibold py-2 px-6 rounded-lg hover:bg-teal-100 transition-colors"
              onClick={() => window.location.href = "/contact"}
            >
              Get in Touch
            </button>
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
