import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { format, parseISO } from "date-fns";

const prisma = new PrismaClient();

export async function GET() {
  // Get all bookings with trip info
  const bookings = await prisma.booking.findMany({
    where: { bookingStatus: { in: ["confirmed", "completed"] } },
    include: { trip: true },
  });

  // Group by route and time
  const routeMap = new Map<
    string,
    {
      routeName: string;
      route: string;
      times: Map<string, { bookings: number; revenue: number }>;
      dayStats: Map<string, number>;
      monthStats: Map<string, number>;
      totalBookings: number;
      totalRevenue: number;
    }
  >();

  for (const booking of bookings) {
    if (!booking.trip) continue;
    const routeName = booking.trip.routeName;
    const route = `${booking.trip.routeOrigin} → ${booking.trip.routeDestination}`;
    const time = booking.trip.departureTime;
    const date = format(booking.trip.departureDate, "yyyy-MM-dd");
    const month = format(booking.trip.departureDate, "yyyy-MM");

    const key = routeName + "|" + route;
    if (!routeMap.has(key)) {
      routeMap.set(key, {
        routeName,
        route,
        times: new Map(),
        dayStats: new Map(),
        monthStats: new Map(),
        totalBookings: 0,
        totalRevenue: 0,
      });
    }
    const routeObj = routeMap.get(key)!;

    // By time
    if (!routeObj.times.has(time)) {
      routeObj.times.set(time, { bookings: 0, revenue: 0 });
    }
    const timeObj = routeObj.times.get(time)!;
    timeObj.bookings += 1;
    timeObj.revenue += booking.totalPrice;

    // By day
    routeObj.dayStats.set(date, (routeObj.dayStats.get(date) || 0) + 1);
    // By month
    routeObj.monthStats.set(month, (routeObj.monthStats.get(month) || 0) + 1);

    routeObj.totalBookings += 1;
    routeObj.totalRevenue += booking.totalPrice;
  }

  // Prepare output
  const result = Array.from(routeMap.values()).map((route) => {
    // Best day
    let bestDay = "";
    let maxDay = 0;
    for (const [day, count] of route.dayStats.entries()) {
      if (count > maxDay) {
        maxDay = count;
        bestDay = day;
      }
    }
    // Best month
    let bestMonth = "";
    let maxMonth = 0;
    for (const [month, count] of route.monthStats.entries()) {
      if (count > maxMonth) {
        maxMonth = count;
        bestMonth = month;
      }
    }
    return {
      routeName: route.routeName,
      route: route.route,
      totalBookings: route.totalBookings,
      totalRevenue: route.totalRevenue,
      times: Array.from(route.times.entries()).map(([departureTime, stats]) => ({
        departureTime,
        bookings: stats.bookings,
        revenue: stats.revenue,
      })),
      bestDay,
      bestMonth,
    };
  });

  return NextResponse.json(result);
}