// middleware.ts - Lightweight version for Vercel Edge
import { NextRequest, NextResponse } from "next/server";

// Simple rate limiting map
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ============================================================================
  // 1. ADMIN API AUTHENTICATION CHECK (Cookie-based)
  // ============================================================================

  if (pathname.startsWith("/api/admin")) {
    // Check for Supabase auth cookie (simplified check)
    const authCookie = request.cookies.get('sb-access-token') ||
      request.cookies.get('sb-refresh-token');

    if (!authCookie) {
      console.warn(`[Auth] Unauthorized admin API access: ${pathname}`, {
        ip: request.headers.get("x-forwarded-for") ?? "unknown",
      });
      return NextResponse.json(
        { error: "Unauthorized. Admin authentication required." },
        { status: 401 }
      );
    }
  }

  // ============================================================================
  // 2. RATE LIMITING FOR DPO
  // ============================================================================

  if (pathname.startsWith("/api/create-dpo-session")) {
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

export const config = {
  matcher: [
    // Only apply to API routes to reduce bundle size
    '/api/:path*',
  ],
};
