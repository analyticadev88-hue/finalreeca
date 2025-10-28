"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function ComingSoon() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 45);

    const updateCountdown = () => {
      const now = new Date();
      const diff = launchDate.getTime() - now.getTime();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Logo */}
        <div className="flex justify-center mb-8 md:mb-12">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
            <Image
              src="/images/reeca-travel-logo.png"
              alt="Reeca Travel Logo"
              width={140}
              height={140}
              className="object-contain md:w-40 md:h-40"
              priority
            />
          </div>
        </div>

        {/* Red Alert Banner */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
            <span className="text-red-600 font-bold text-sm md:text-base flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              NEW ROUTE ALERT
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            </span>
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
            Gaborone <span className="text-[#009999]">↔</span> Johannesburg
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto">
            New bus booking system launching soon
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 md:p-8 mb-8 md:mb-12">
          <p className="text-gray-800 text-base md:text-lg leading-relaxed text-center">
            <span className="font-semibold text-[#009999]">Reeca Travel</span> is launching in{" "}
            <span className="font-bold text-[#febf00]">45 days</span>. 
            Book your tickets between Botswana and South Africa with our reliable daily services.
          </p>
        </div>

        {/* Schedule Cards */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-10 md:mb-14">
          <div className="border-l-4 border-l-green-500 bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h3 className="font-bold text-gray-900 text-lg">Gaborone → Johannesburg</h3>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700 flex items-center gap-2">
                <span className="text-sm text-gray-500">•</span>
                Morning: <span className="font-semibold">7:00 AM</span>
              </p>
              <p className="text-gray-700 flex items-center gap-2">
                <span className="text-sm text-gray-500">•</span>
                Afternoon: <span className="font-semibold">3:00 PM</span>
              </p>
            </div>
          </div>

          <div className="border-l-4 border-l-blue-500 bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h3 className="font-bold text-gray-900 text-lg">OR Tambo → Gaborone</h3>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700 flex items-center gap-2">
                <span className="text-sm text-gray-500">•</span>
                Morning: <span className="font-semibold">8:00 AM</span>
              </p>
              <p className="text-gray-700 flex items-center gap-2">
                <span className="text-sm text-gray-500">•</span>
                Evening: <span className="font-semibold">5:00 PM</span>
              </p>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="text-center mb-12 md:mb-16">
          <h3 className="text-gray-700 font-medium mb-6 text-lg">Launching In</h3>
          <div className="flex justify-center gap-2 md:gap-4 max-w-md mx-auto">
            {[
              { label: "Days", value: timeLeft.days },
              { label: "Hours", value: timeLeft.hours },
              { label: "Minutes", value: timeLeft.minutes },
              { label: "Seconds", value: timeLeft.seconds },
            ].map((item) => (
              <div key={item.label} className="flex-1 min-w-[60px] md:min-w-[80px]">
                <div className="bg-gray-900 text-white rounded-lg py-3 md:py-4 mb-2">
                  <span className="text-xl md:text-2xl font-mono font-bold">
                    {item.value.toString().padStart(2, "0")}
                  </span>
                </div>
                <span className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="border-t border-gray-200 pt-8 md:pt-12">
          <h3 className="text-center font-bold text-gray-900 mb-6 md:mb-8 text-lg">
            Contact For Bookings & Inquiries
          </h3>
          
          <div className="grid md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="text-center p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
              <div className="text-[#009999] font-bold text-sm mb-2">Orange</div>
              <div className="text-gray-800 font-semibold text-base">+267 76 506 348</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
              <div className="text-[#847B4B] font-bold text-sm mb-2">Be Mobile</div>
              <div className="text-gray-800 font-semibold text-base">+267 73 061 124</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
              <div className="text-[#febf00] font-bold text-sm mb-2">Mascom</div>
              <div className="text-gray-800 font-semibold text-base">+267 77 655 348</div>
            </div>
          </div>

          <div className="text-center p-4 md:p-5 bg-gray-50 rounded-xl border border-gray-200 max-w-md mx-auto">
            <div className="font-bold text-gray-900 mb-2 text-lg">Email Us</div>
            <div className="text-[#009999] font-semibold text-base">tickets@reecatravel.co.bw</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 md:mt-12 pt-6 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            © 2024 Reeca Travel. Making your journey better.
          </p>
        </div>
      </div>
    </main>
  );
}