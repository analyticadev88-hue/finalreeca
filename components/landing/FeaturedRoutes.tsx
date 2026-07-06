"use client";

import Image from "next/image";

const routes = [
  {
    id: 1,
    name: "Gaborone to OR Tambo",
    tag: "Daily departures",
    duration: "6h 30m",
    price: "P500",
    image: "/images/h1.jpg",
  },
  {
    id: 2,
    name: "OR Tambo to Gaborone",
    tag: "Daily departures",
    duration: "6h 30m",
    price: "P500",
    image: "/images/h2.jpg",
  },
  {
    id: 3,
    name: "Gaborone to Rustenburg",
    tag: "Weekend specials",
    duration: "3h 15m",
    price: "P199.50",
    image: "/images/h3.jpg",
  },
  {
    id: 4,
    name: "Gaborone ↔ Maun",
    tag: "Intercity route",
    duration: "Flexible",
    price: "P331",
    image: "/images/h4.jpg",
  },
];

export default function FeaturedRoutes() {
  return (
    <section id="routes" className="py-20 md:py-28 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 md:mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-gray-500">
            Popular Routes
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-medium text-gray-900">
            Our{" "}
            <span className="font-serif italic font-normal">Routes</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {routes.map((route) => (
            <div
              key={route.id}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="relative h-56 overflow-hidden">
                <Image
                  src={route.image}
                  alt={route.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-800">
                    {route.tag}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 leading-tight">
                    {route.name}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{route.duration}</span>
                  <span className="font-medium text-gray-900">{route.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
