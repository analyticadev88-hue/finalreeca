// src/lib/data.ts

import { BoardingPoint, Booking, BusCategory } from "./types";

export const busCategories: BusCategory[] = [
  {
    id: "RT001",
    registration: "B609BRD",
    name: "Scania Irizar i6s VIP",
    image: "/images/scania-irizar-vip.png",
    price: 500,
    features: ["AC", "Video", "2+2 Seating", "VIP"],
    amenities: [
      { icon: "Snowflake", name: "AC" },
      { icon: "Wifi", name: "WiFi" },
      { icon: "Tv", name: "Video" },
    ],
    rating: 4.9,
    description: "Premium VIP comfort with luxury amenities",
    seats: 57,
    departureTime: "07:00",
    arrivalTime: "13:30",
    duration: "6h30min",
  },
  {
    id: "RT002",
    registration: "B610BRD",
    name: "Scania Higer Touring",
    image: "/images/scania-higer-new.png",
    price: 500,
    features: ["AC", "Video", "2+2 Seating"],
    amenities: [
      { icon: "Wifi", name: "Free WiFi" },
      { icon: "Snowflake", name: "AC" },
      { icon: "Tv", name: "Video" },
    ],
    rating: 4.8,
    description: "Comfortable premium travel experience",
    seats: 60,
    departureTime: "15:00",
    arrivalTime: "21:30",
    duration: "6h30min",
  },
];

export const boardingPoints: Record<string, BoardingPoint[]> = {
  gaborone: [
    { id: 'bp-gab-1', name: "Mogobe Plaza, Gaborone CBD", times: ["07:00", "15:00"] },
    { id: 'bp-gab-2', name: "Shell Riverwalk", times: ["07:30", "15:30"] },
    { id: 'bp-gab-3', name: "Tlokweng Border", times: ["08:00", "16:00"] },
  ],
  rustenburg: [
    { id: 'bp-rus-1', name: "Rustenburg Station", times: ["09:30", "17:30"] },
  ],
  ortambo: [{ id: 'bp-ort-1', name: "OR Tambo Airport", times: ["08:00", "17:00"] }],
};

export const routes = [
  "Gaborone → OR Tambo Airport",
  "OR Tambo Airport → Gaborone",
  "Gaborone → Rustenburg",
  "Rustenburg → Gaborone",
  "Rustenburg → OR Tambo Airport",
  "OR Tambo Airport → Rustenburg",
];

export const mockBookings: Booking[] = [
  {
    id: "RT001",
    tripId: 'trip-rt001',
    returnTripId: undefined,
    passengers: [
      { id: 'p1', name: 'Topo Rapula', title: 'Mr', seatNumber: '12A' },
      { id: 'p2', name: 'Companion', title: 'Ms', seatNumber: '12B' }
    ],
    userName: 'Topo Rapula',
    userEmail: 'toporapula@gmail.com',
    userPhone: '+267 71234567',
    seats: '12A,12B',
    seatCount: 2,
    totalPrice: 1000,
    boardingPoint: 'Mogobe Plaza, Gaborone CBD',
    droppingPoint: 'OR Tambo Airport',
    orderId: 'BOOK-20240618-001',
    transactionToken: undefined,
    paymentStatus: 'Paid',
    bookingStatus: 'Confirmed',
    promoCode: undefined,
    discountAmount: 0,
    competitorInfo: undefined,
    scanned: false,
    lastScanned: undefined,
    scannerId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "RT002",
    tripId: 'trip-rt002',
    returnTripId: undefined,
    passengers: [ { id: 'p3', name: 'Jane Doe', title: 'Ms', seatNumber: '5A' } ],
    userName: 'Jane Doe',
    userEmail: 'jane@example.com',
    userPhone: '+267 76543210',
    seats: '5A',
    seatCount: 1,
    totalPrice: 500,
    boardingPoint: 'OR Tambo Airport',
    droppingPoint: 'Shell Riverwalk',
    orderId: 'BOOK-20240618-002',
    transactionToken: undefined,
    paymentStatus: 'Paid',
    bookingStatus: 'Confirmed',
    promoCode: undefined,
    discountAmount: 0,
    competitorInfo: undefined,
    scanned: false,
    lastScanned: undefined,
    scannerId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
