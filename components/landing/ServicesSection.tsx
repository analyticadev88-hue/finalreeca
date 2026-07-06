"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ServicesSectionProps {
  onHireBus?: () => void;
}

export default function ServicesSection({ onHireBus }: ServicesSectionProps) {
  return (
    <section id="services" className="py-20 md:py-28 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-[2rem] md:rounded-[2.5rem] overflow-hidden h-[480px] md:h-[560px]">
          <Image
            src="/images/12.webp"
            alt="Reeca Travel Coach Fleet"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />

          <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-14 lg:p-20">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-medium text-white leading-[1.1]">
                Fleet &{" "}
                <span className="font-serif italic font-normal">Coach Hire</span>
              </h2>
              <p className="mt-5 md:mt-6 text-white/85 text-base md:text-lg leading-relaxed">
                From corporate transfers to school trips and private events, our
                modern fleet and dedicated team handle every detail so you can
                travel with complete peace of mind.
              </p>
              <div className="mt-8">
                <Button
                  onClick={onHireBus}
                  className="h-12 px-8 rounded-full bg-white text-gray-900 hover:bg-gray-100 font-medium"
                >
                  Hire a Coach
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
