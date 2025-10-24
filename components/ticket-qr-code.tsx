"use client"
import QRCode from "react-qr-code"
import { cn } from "@/lib/utils"

interface TicketQRCodeProps {
  bookingData: {
    bookingRef: string
    passengerName: string
    route: string
    date: Date
    seats: string[]
    bus: string
  }
  size?: number
  className?: string
}

export function TicketQRCode({ bookingData, size = 128, className }: TicketQRCodeProps) {
  // Create a secure ticket data string that includes essential information
  // We'll add a simple hash at the end based on the booking reference to add some security
  const ticketData = JSON.stringify({
    ref: bookingData.bookingRef,
    name: bookingData.passengerName,
    route: bookingData.route,
    date: bookingData.date.toISOString(),
    seats: bookingData.seats.join(","),
    bus: bookingData.bus,
    // Simple hash for validation (in a real app, use a proper cryptographic signature)
    hash: btoa(bookingData.bookingRef + "-" + bookingData.date.toISOString()).slice(0, 10),
  })

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <QRCode value={ticketData} size={size} />
      </div>
      <p className="text-xs text-center mt-2 text-gray-500">Scan to verify ticket</p>
    </div>
  )
}
