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
    <main className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <Image
              src="/images/reeca-travel-logo.png"
              alt="Reeca Travel Logo"
              width={120}
              height={120}
              className="mx-auto"
              priority
            />
          </div>
          
          <div className="mb-4">
            <span className="inline-block bg-red-50 text-red-600 text-sm font-semibold px-3 py-1 rounded border border-red-200">
              ‼ NEW ROUTE ALERT ‼
            </span>
          </div>
        </div>

        {/* Main Message */}
        <div className="text-center mb-8">
          <p className="text-gray-700 text-base leading-relaxed">
            Get ready to travel with ease!{" "}
            <span className="text-[#009999] font-medium">Reeca Travel's</span> new bus booking system is launching in{" "}
            <span className="text-[#febf00] font-semibold">45 days</span>. Book your tickets from Gaborone to Johannesburg and back with us soon.
          </p>
        </div>

        {/* Schedule - Simple and clean */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="border border-gray-300 rounded-lg p-4 bg-white">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Gaborone → Johannesburg</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>7AM & 3PM</div>
              <div className="text-xs text-gray-500">from Gabs</div>
            </div>
          </div>

          <div className="border border-gray-300 rounded-lg p-4 bg-white">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">OR Tambo → Gaborone</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>8AM & 5PM</div>
              <div className="text-xs text-gray-500">from OR Tambo</div>
            </div>
          </div>
        </div>

        {/* Countdown */}
        <div className="text-center mb-10">
          <p className="text-gray-600 text-sm font-medium mb-4">LAUNCHING IN</p>
          <div className="flex justify-center gap-3">
            {[
              { label: "Days", value: timeLeft.days },
              { label: "Hours", value: timeLeft.hours },
              { label: "Minutes", value: timeLeft.minutes },
              { label: "Seconds", value: timeLeft.seconds },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="bg-gray-800 text-white rounded px-3 py-2 min-w-[50px]">
                  <span className="font-mono font-bold text-sm">
                    {item.value.toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stay Tuned */}
        <div className="text-center mb-8">
          <p className="text-gray-600 font-medium text-sm">Stay tuned</p>
        </div>

        {/* Contact */}
        <div className="border-t border-gray-200 pt-8">
          <p className="text-center font-medium text-gray-900 mb-4 text-sm">CONTACT US</p>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#009999] font-medium">Orange</span>
              <span className="text-gray-900">+267 76 506 348</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#847B4B] font-medium">Be Mobile</span>
              <span className="text-gray-900">+267 73 061 124</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#febf00] font-medium">Mascom</span>
              <span className="text-gray-900">+267 77 655 348</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-900 font-medium text-sm">tickets@reecatravel.co.bw</p>
          </div>
        </div>
      </div>
    </main>
  );
}