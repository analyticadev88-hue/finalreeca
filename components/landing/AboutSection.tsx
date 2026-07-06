"use client";

export default function AboutSection() {
  return (
    <section id="about" className="py-20 md:py-28 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-gray-500">
              About Us
            </span>
            <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight text-gray-900">
              We connect people across Southern Africa, offering every traveler a{" "}
              <span className="font-serif italic font-normal">seamless</span>{" "}
              and{" "}
              <span className="font-serif italic font-normal">personalized</span>{" "}
              journey.
            </h2>
            <p className="mt-6 text-gray-600 leading-relaxed">
              Reeca Travel provides premium intercity bus services between Botswana
              and South Africa. Whether you are heading to the airport, visiting
              family, or traveling for business, we ensure comfort, safety, and
              reliability on every trip.
            </p>
          </div>

          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-gray-100 aspect-[4/3]">
            <video
              src="https://zo1zv0g4tz.ufs.sh/f/lfByGtJ28C7IbHzpOnk9QlB83EoGPhZW0F5fydUs1kuzgIp4"
              poster="/images/1.webp"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
