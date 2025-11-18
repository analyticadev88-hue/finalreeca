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
  Menu, User, Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Facebook, Instagram
} from "lucide-react";

export default function ContactUs() {
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

  const [formData, setFormData] = useState({
    fullName: "",
    subject: "",
    email: "",
    phone: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{success: boolean; message: string} | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitStatus({
        success: true,
        message: "Thank you for contacting us! We'll get back to you as soon as possible."
      });

      // Reset form
      setFormData({
        fullName: "",
        subject: "",
        email: "",
        phone: "",
        message: ""
      });

      // Clear status after 5 seconds
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    }, 1500);
  };

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
              <Mail className="text-teal-600" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-teal-900 mb-2">
              Contact Us
            </h1>
            <p className="text-xl "style={{ color: 'rgb(148,138,84)' }}>
              We're here to help with your travel needs
            </p>
          </div>

          {/* Contact Information */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-teal-200 mb-8">
            <h2 className="text-2xl font-bold text-teal-800 mb-6 flex items-center gap-3">
              <Phone className="text-teal-600" size={24} />
              Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Contacts */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-teal-100 p-2 rounded-full mt-1">
                    <Mail className="text-teal-600" size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-teal-800">Bus Bookings</h3>
                    <a href="mailto:tickets@reecatravel.co.bw" className="hover:underline" style={{ color: 'rgb(148,138,84)' }}>
                      tickets@reecatravel.co.bw
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-teal-100 p-2 rounded-full mt-1">
                    <Mail className="text-teal-600" size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-teal-800">Travel Services</h3>
                    <a href="mailto:traveltalk@reecatravel.co.bw" className="hover:underline" style={{ color: 'rgb(148,138,84)' }}>
                      traveltalk@reecatravel.co.bw
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone Contacts */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-full mt-1">
                    <Phone className="text-amber-600" size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-teal-800">Office Line</h3>
                    <a href="tel:+26773061124" className="hover:underline" style={{ color: 'rgb(148,138,84)' }}>
                      +267 7306 1124
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-full mt-1">
                    <Phone className="text-amber-600" size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-teal-800">WhatsApp</h3>
                    <a href="https://wa.me/26776506348" className="hover:underline" style={{ color: 'rgb(148,138,84)' }}>
                      +267 7650 6348
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-full mt-1">
                    <Phone className="text-amber-600" size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-teal-800">Emergency Line</h3>
                    <a href="tel:+26777655348" className="hover:underline" style={{ color: 'rgb(148,138,84)' }}>
                      +267 7765 5348
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Office Address */}
            <div className="flex items-start gap-3 mt-6 pt-6 border-t border-teal-100">
              <div className="bg-teal-100 p-2 rounded-full mt-1">
                <MapPin className="text-teal-600" size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-teal-800">Our Office</h3>
                <address className="not-italic text-gray-700">
                  Mogobe Plaza, Gaborone CBD, Botswana, Africa
                </address>
              </div>
            </div>
          </section>

          {/* Contact Form */}
          <section className="bg-white p-6 md:p-8 rounded-xl shadow-md border border-amber-200 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-6 flex items-center gap-3">
              <Send className="text-amber-600" size={24} />
              Drop Us a Line
            </h2>
            <p className="text-gray-700 mb-6">
              Get in touch via the form below and we will reply as soon as we can.
            </p>

            {submitStatus && (
              <div className={`mb-6 p-4 rounded-md ${submitStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <div className="flex items-center gap-3">
                  {submitStatus.success ? (
                    <CheckCircle2 className="text-green-600" size={20} />
                  ) : (
                    <AlertCircle className="text-red-600" size={20} />
                  )}
                  <span>{submitStatus.message}</span>
                </div>
              </div>
            )

            }

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-teal-800 mb-1">
                  Full Names*
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-teal-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-teal-800 mb-1">
                  Subject*
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-teal-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Subject of your message"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-teal-800 mb-1">
                    Email*
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-teal-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-teal-800 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-teal-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="+267 7123 4567"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-teal-800 mb-1">
                  Message*
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-teal-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Your message..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full md:w-auto px-6 py-2 rounded-md font-medium flex items-center justify-center gap-2 ${isSubmitting ? 'bg-amber-400' : 'bg-amber-600 hover:bg-amber-700'} transition-colors`}
                style={{ color: 'rgb(148,138,84)', backgroundColor: isSubmitting ? undefined : 'rgb(255,193,5)' }}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-pulse">Sending</span>
                    <span className="ml-2">...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>
            </form>
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
