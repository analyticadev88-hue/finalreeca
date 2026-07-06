"use client";

import Image from "next/image";
import { Facebook, Instagram } from "lucide-react";

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-5">
            <div className="bg-white rounded-xl px-4 py-3 w-fit">
              <Image
                src="/images/reeca-travel-logo.png"
                alt="Reeca Travel"
                width={140}
                height={56}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Premium bus services connecting Botswana and South Africa with
              comfort, safety, and reliability.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.facebook.com/ReecaTravel/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:bg-white/20 hover:text-white transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/ReecaTravel/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:bg-white/20 hover:text-white transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/schedulebuspage"
                  className="hover:text-white transition-colors"
                >
                  Bus Schedule
                </a>
              </li>
              <li>
                <a href="/ourfleet" className="hover:text-white transition-colors">
                  Our Fleet
                </a>
              </li>
              <li>
                <a href="/lostnfound" className="hover:text-white transition-colors">
                  Lost & Found
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-5">
              Information
            </h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a
                  href="/privacypolicy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/traveldocs"
                  className="hover:text-white transition-colors"
                >
                  Travel Documents
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-5">
              Sales Office
            </h4>
            <address className="not-italic text-sm text-gray-400 space-y-3 leading-relaxed">
              <p>Mogobe Plaza, Gaborone CBD, 4th Floor</p>
              <p>Emergency: +267 77655348</p>
              <p>Office: +267 73061124</p>
              <p>WhatsApp: +267 76506348</p>
              <p>tickets@reecatravel.co.bw</p>
            </address>
          </div>
        </div>

        <div className="border-t border-white/10 mt-14 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {currentYear} REECA Travel. All rights reserved.</p>
          <a
            href="https://toporapula.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400 transition-colors"
          >
            Developed by Topo Rapula
          </a>
        </div>
      </div>
    </footer>
  );
}
