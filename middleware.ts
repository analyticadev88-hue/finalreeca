// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import arcjet, { detectBot, shield } from "@arcjet/next";
import { createServerClient } from '@supabase/ssr';

// Global Arcjet instance for bot protection
const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    // Bot protection for all routes
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"], // Allow Google, Bing, etc.
    }),
    // Shield against common attacks
    shield({
      mode: "LIVE",
    }),
  ],
});

// Legacy rate limiting map for DPO (will be replaced by Arcjet gradually)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export async function middleware(request: NextRequest) {
  // ============================================================================
  // 1. GLOBAL BOT PROTECTION (All routes)
  // ============================================================================

  const decision = await aj.protect(request);

  if (decision.isDenied()) {
    if (decision.reason.isBot()) {
      console.warn(`[Arcjet] Bot detected: ${request.nextUrl.pathname}`, {
        ip: decision.ip,
        userAgent: request.headers.get("user-agent"),
      });
      return new NextResponse("Bot detected", { status: 403 });
    }

    if (decision.reason.isShield()) {
      console.warn(`[Arcjet] Attack detected: ${request.nextUrl.pathname}`, {
        ip: decision.ip,
      });
      return new NextResponse("Request blocked for security reasons", { status: 403 });
    }
  }

  // ============================================================================
  // 2. ADMIN API AUTHENTICATION (Supabase session verification)
  // ============================================================================

  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    const response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.warn(`[Auth] Unauthorized admin API access: ${request.nextUrl.pathname}`, {
        ip: request.headers.get("x-forwarded-for") ?? "unknown",
      });
      return NextResponse.json(
        { error: "Unauthorized. Admin authentication required." },
        { status: 401 }
      );
    }

    // Session valid, allow request
    return response;
  }

  // ============================================================================
  // 3. LEGACY DPO RATE LIMITING (Will be migrated to Arcjet)
  // ============================================================================

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

export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Exclude static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
