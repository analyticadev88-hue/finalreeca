"use client";

import Image from "next/image";
import { ReactNode } from "react";

interface HeroSectionProps {
  children?: ReactNode;
}

export default function HeroSection({ children }: HeroSectionProps) {
  return (
    <section className="bg-white px-4 pb-28 md:pb-36">
      <div className="max-w-[1400px] mx-auto">
        <div className="relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden h-[620px] md:h-[760px] lg:h-[820px] border border-white/20 shadow-2xl shadow-black/5">
          <Image
            src="/images/1.webp"
            alt="REECA Travel Premium Bus"
            fill
            className="object-cover object-center"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

          <div className="absolute inset-0 flex flex-col justify-start p-6 md:p-10 lg:p-14 pt-24 md:pt-32">
            <div className="max-w-2xl">
              <p className="text-white/80 text-sm md:text-base tracking-wide uppercase mb-3 md:mb-4">
                Premium Intercity Travel
              </p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl text-white font-medium leading-[1.05] tracking-tight text-shadow">
                Travel in
                <br />
                <span className="font-serif italic font-normal">comfort</span>{" "}
                & style
              </h1>
              <p className="mt-4 md:mt-6 text-white/90 text-base md:text-lg max-w-lg leading-relaxed">
                Book your seat and enjoy the journey.
              </p>
            </div>
          </div>
        </div>

        <div className="relative -mt-28 md:-mt-32 z-10 px-2 md:px-10">
          {children}
        </div>
      </div>
    </section>
  );
}
