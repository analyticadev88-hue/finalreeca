export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#009999] via-[#006666] to-[#003333] flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        {/* Bus Image */}
        <div className="relative">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-[#ffc000]">
            <img 
              src="/images/1.webp" 
              alt="Bus on the road"
              className="w-full h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center md:text-left space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#ffc000] text-gray-900 text-sm font-bold">
            <span className="w-2 h-2 bg-[#009999] rounded-full mr-2 animate-pulse"></span>
            Coming Soon
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Your Journey
            <span className="block text-[#ffc000]">Starts Soon</span>
          </h1>
          
          <p className="text-lg text-gray-200 leading-relaxed">
            We're building the ultimate bus booking experience with modern features, 
            real-time tracking, and seamless reservations. Get ready for a smoother journey!
          </p>

          {/* Countdown */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-[#948a54]">
            <div className="text-gray-300 mb-2">Launching in</div>
            <div className="text-3xl font-bold text-white">30 <span className="text-[#ffc000] text-xl">days</span></div>
          </div>

          {/* Contact Info */}
          <div className="text-sm text-gray-300">
            For inquiries: <span className="text-[#ffc000] font-semibold">tickets@reecatravel.co.bw</span>
          </div>
        </div>
      </div>
    </div>
  );
}