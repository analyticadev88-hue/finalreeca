// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/create-dpo-session")) {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const limit = 5;
    const windowMs = 60 * 1000;
    const now = Date.now();

    const entry = rateLimitMap.get(ip) || { count: 0, lastReset: now };
    if (now - entry.lastReset > windowMs) {
      entry.count = 0;
      entry.lastReset = now;
    }
    entry.count++;
    rateLimitMap.set(ip, entry);

    if (entry.count > limit) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }
  }

  return NextResponse.next();
}
