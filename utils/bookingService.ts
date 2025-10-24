import { deduplicateRequest, generateRequestKey } from "./requestDeduplication";

interface BookingCheckResponse {
  exists: boolean;
  status?: string;
  createdAt?: string;
}

export async function checkBookingExists(orderId: string): Promise<BookingCheckResponse> {
  const requestKey = generateRequestKey('GET', `/api/booking/check/${orderId}`);
  
  try {
    return await deduplicateRequest(requestKey, async () => {
      const response = await fetch(`/api/booking/check/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to check booking status');
      }
      return response.json();
    });
  } catch (error) {
    console.error(`[BookingService] Error checking booking ${orderId}:`, error);
    return { exists: false };
  }
}

export async function createBooking(payload: any) {
  const requestKey = generateRequestKey('POST', '/api/booking/create', payload);
  
  return await deduplicateRequest(requestKey, async () => {
    const response = await fetch("/api/booking/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create booking");
    }

    return response.json();
  });
}

export async function safelyCreateBooking(payload: any) {
  // First check if booking exists
  const { exists, status } = await checkBookingExists(payload.orderId);
  
  if (exists) {
    console.log(`[BookingService] Booking ${payload.orderId} exists with status: ${status}`);
    if (status === 'paid') {
      throw new Error('This booking has already been processed and paid for.');
    }
    // Return existing booking for payment completion
    return { exists: true, status };
  }

  // Create new booking
  try {
    const result = await createBooking(payload);
    return { exists: false, result };
  } catch (error: any) {
    console.error('[BookingService] Error creating booking:', error);
    throw error;
  }
}
