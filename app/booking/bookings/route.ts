import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  console.log("\n===== [API] START: GET BOOKING REQUEST =====");
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get("id");
  const orderId = searchParams.get("orderId");

  console.log(`Request params: bookingId=${bookingId}, orderId=${orderId}`);

  if (!bookingId && !orderId) {
    console.error("Error: Missing booking ID or order ID");
    return NextResponse.json(
      { success: false, error: "Missing booking ID or order ID" },
      { status: 400 }
    );
  }

  try {
    console.log("Querying Supabase for booking data...");
    let booking: any;
    const query = orderId
      ? supabase
          .from("Booking")
          .select(`
            *,
            Trip: trip_id (*),
            ReturnTrip: return_trip_id (*)
          `)
          .eq("order_id", orderId)
      : supabase
          .from("Booking")
          .select(`
            *,
            Trip: trip_id (*),
            ReturnTrip: return_trip_id (*)
          `)
          .eq("id", bookingId);

    const { data, error } = await query.single();

    if (error) {
      console.error("Supabase error:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      );
    }

    booking = data;
    console.log("Booking data retrieved:", JSON.stringify(booking, null, 2));

    // Helper to parse seat data
    const parseSeats = (seats: any): string[] => {
      if (!seats) return [];
      if (Array.isArray(seats)) return seats;
      if (typeof seats === "string") {
        try {
          return JSON.parse(seats);
        } catch {
          return seats.split(",").map((s: string) => s.trim());
        }
      }
      return [];
    };

    // Fetch passengers from Passenger table
    console.log("Fetching passengers from Supabase...");
    const { data: passengersData, error: passengersError } = await supabase
      .from("Passenger")
      .select("*")
      .eq("bookingId", booking.id);

    if (passengersError) {
      console.error("Passengers fetch error:", passengersError.message);
      return NextResponse.json(
        { success: false, error: passengersError.message },
        { status: 500 }
      );
    }

    console.log(`Found ${passengersData?.length || 0} passengers`);

    // Map all passenger fields for the ticket
    const passengers = (passengersData || []).map((p: any) => ({
      name: `${p.firstName} ${p.lastName}`,
      seat: p.seatNumber,
      title: p.title,
      type: p.type,
      isReturn: p.isReturn,
      hasInfant: !!p.hasInfant,
      infantName: p.infantName || "",
      infantBirthdate: p.infantBirthdate || "",
      infantPassportNumber: p.infantPassportNumber || "",
      birthdate: p.birthdate || "",
      passportNumber: p.passportNumber || "",
    }));

    console.log("Passengers processed:", JSON.stringify(passengers, null, 2));

    // Parse seats
    const departureSeats = parseSeats(booking.seats);
    const returnSeats = parseSeats(booking.return_seats);

    // Build trips
    const departureTrip = {
      route: booking.Trip?.route_name || "Unknown Route",
      date: booking.Trip?.departure_date || new Date().toISOString(),
      time: booking.Trip?.departure_time || "00:00",
      bus: booking.Trip?.service_type || "Standard Bus",
      boardingPoint: booking.boarding_point,
      droppingPoint: booking.dropping_point,
      seats: departureSeats,
      passengers: passengers.filter((p: any) => !p.isReturn)
    };

    const returnTrip = booking.return_trip_id ? {
      route: booking.ReturnTrip?.route_name || "Unknown Route",
      date: booking.ReturnTrip?.departure_date || new Date().toISOString(),
      time: booking.ReturnTrip?.departure_time || "00:00",
      bus: booking.ReturnTrip?.service_type || "Standard Bus",
      boardingPoint: booking.return_boarding_point,
      droppingPoint: booking.return_dropping_point,
      seats: returnSeats,
      passengers: passengers.filter((p: any) => p.isReturn)
    } : undefined;

    // Format add-ons as array for ticket
    const addonsArr = booking.addons
      ? Array.isArray(booking.addons)
        ? booking.addons
        : Object.entries(booking.addons).map(([key, value]) => ({
            name: key,
            ...(typeof value === "object" && value !== null ? value : { value }),
          }))
      : [];

    console.log("Addons processed:", JSON.stringify(addonsArr, null, 2));

    // Build response
    const responseData = {
      id: booking.id,
      bookingRef: booking.order_id,
      userName: booking.user_name,
      userEmail: booking.user_email,
      userPhone: booking.user_phone,
      totalAmount: booking.total_price,
      paymentMethod: booking.payment_mode || "Credit Card",
      paymentStatus: booking.payment_status,
      bookingStatus: booking.booking_status,
      contactDetails: {
        name: booking.user_name,
        email: booking.user_email,
        mobile: booking.user_phone,
        idType: "Passport",
        idNumber: booking.contact_id_number || "-",
        alternateMobile: booking.alternate_mobile || "",
      },
      emergencyContact: {
        name: booking.emergency_contact_name || "-",
        phone: booking.emergency_contact_phone || "-",
      },
      addons: addonsArr,
      passengers,
      departureTrip,
      returnTrip,
    };

    console.log("Final response data:", JSON.stringify(responseData, null, 2));
    console.log("===== [API] END: GET BOOKING REQUEST =====\n");

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Booking fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}