// components/PaymentSuspension.tsx
'use client'
import Image from 'next/image'

export default function PaymentSuspension() {
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
              ⚠ WEBSITE UNDER MAINTENANCE ⚠
            </span>
          </div>
        </div>

        {/* Main Message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            We'll Be Back Soon
          </h1>
          <p className="text-gray-700 text-base leading-relaxed">
            Our website is currently undergoing scheduled maintenance to improve your experience. 
            We apologize for any inconvenience and appreciate your patience.
          </p>
        </div>

        {/* Contact Section */}
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

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Reeca Travel. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  )
}