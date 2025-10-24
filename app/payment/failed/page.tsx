'use client';
import Link from "next/link";

export default function PaymentFailed() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h1>
        <p className="mb-6 text-gray-700">
          Unfortunately, your payment could not be processed.<br />
          Please try again or contact support if the issue persists.
        </p>
        <Link href="/">
          <span className="inline-block bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700 transition">
            Back to Booking
          </span>
        </Link>
      </div>
    </div>
  );
}