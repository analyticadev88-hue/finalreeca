export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-[#009999] flex items-center justify-center p-6">
      <div className="max-w-5xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Logo Section */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#febf00] to-[#847B4B] rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
              <div className="relative bg-white p-6 rounded-xl shadow-xl backdrop-blur-sm border border-white/20">
                <img 
                  src="/images/reeca-travel-logo.png" 
                  alt="Reeca Travel"
                  className="w-60 h-60 object-contain transform group-hover:scale-105 transition duration-500"
                />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="space-y-6">
            {/* Header with Modern Badge */}
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-[#febf00] to-[#ffd54a] rounded-full shadow-lg border border-[#febf00]/20">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-[#847B4B] rounded-full animate-pulse"></span>
                  <span className="text-gray-900 font-semibold text-sm tracking-wide">NEW ROUTE ALERT</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-4xl font-light text-white tracking-tight">
                  Reeca Travel
                </h1>
                <div className="w-16 h-0.5 bg-[#febf00] rounded-full"></div>
              </div>
            </div>

            {/* Modern Card with Message */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
              <p className="text-gray-700 text-[15px] leading-relaxed mb-4 font-light">
                Get ready to travel with ease! Reeca Travel's new bus booking system is launching in 45 days. 
                Book your tickets from Gaborone to Johannesburg and back with us soon.
              </p>

              {/* Clear Schedule Layout */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between p-3 bg-[#febf00]/10 rounded-lg border border-[#febf00]/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-8 bg-[#009999] rounded-full"></div>
                    <div>
                      <div className="text-gray-900 font-medium text-sm">From Gaborone</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#009999] font-semibold text-sm">7:00 AM & 3:00 PM</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#847B4B]/10 rounded-lg border border-[#847B4B]/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-8 bg-[#847B4B] rounded-full"></div>
                    <div>
                      <div className="text-gray-900 font-medium text-sm">From OR Tambo</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#847B4B] font-semibold text-sm">8:00 AM & 5:00 PM</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Countdown & Contact */}
            <div className="grid grid-cols-2 gap-4">
              {/* Countdown */}
              <div className="bg-gradient-to-br from-[#847B4B] to-[#6b6440] rounded-xl p-4 text-center shadow-lg border border-[#847B4B]/30">
                <div className="text-white/80 text-xs font-medium mb-1 tracking-wide">LAUNCHING IN</div>
                <div className="text-lg font-bold text-white">
                  45 <span className="text-[#febf00] text-sm">days</span>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-gradient-to-br from-[#febf00] to-[#ffd54a] rounded-xl p-4 text-center shadow-lg border border-[#febf00]/30">
                <div className="text-gray-900/80 text-xs font-medium mb-1 tracking-wide">CONTACT US</div>
                <div className="text-gray-900 font-semibold text-sm">tickets@reecatravel.co.bw</div>
              </div>
            </div>

            {/* Stay Tuned */}
            <div className="text-center pt-2">
              <div className="text-white/60 text-xs font-light tracking-wide">Stay tuned for updates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}