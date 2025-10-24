'use client';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PaymentCancelPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const ref = Array.isArray(searchParams.ref) 
    ? searchParams.ref[0] 
    : searchParams.ref || '';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
          <XCircle className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Payment Cancelled
        </h2>
        
        <div className="mt-6">
          <p className="text-lg text-gray-600">
            {ref ? (
              <>Your booking <span className="font-medium text-red-600">{ref}</span> was not completed.</>
            ) : (
              "Your payment was not completed."
            )}
          </p>
          
          <div className="mt-8 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="text-yellow-700">
              Your booking has not been confirmed. You can try again or contact support if you need assistance.
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          <Button
            asChild
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md"
          >
            <Link href="/">
              Try Payment Again
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            className="w-full mt-3 bg-white text-gray-700 font-semibold py-3 px-4 rounded-lg border border-gray-300 shadow-sm"
          >
            <Link href="/">
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}