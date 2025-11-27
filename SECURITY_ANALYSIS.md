# Security Analysis Report - REECA Bus Booking System

**Analysis Date:** 2025-11-27  
**Analyst:** Antigravity AI  
**Scope:** Complete codebase security audit focusing on rate limiting, idempotency, authentication, and bus booking security

---

## Executive Summary

Your bus booking system has **GOOD foundational security** with several strong implementations, but there are **CRITICAL GAPS** that need immediate attention. The system implements idempotency and request deduplication well for booking operations, but rate limiting is severely limited and authentication/authorization is weak in many areas.

### Overall Security Rating: ⚠️ **6.5/10** (Moderate Risk)

---

## 1. RATE LIMITING ANALYSIS

### ✅ **STRENGTHS:**
- **DPO Payment Session** (`/api/create-dpo-session`) has rate limiting via middleware
  - 5 requests per minute per IP
  - Uses in-memory Map for tracking
  - Properly returns 429 status code

### ❌ **CRITICAL GAPS:**

#### **1.1 Limited Scope**
Rate limiting is **ONLY applied to ONE endpoint** (`/api/create-dpo-session`). The following critical endpoints have **NO rate limiting**:

```
❌ /api/booking (POST) - Main booking creation
❌ /api/admin/booking/nullify (POST) - Booking cancellation
❌ /api/agent/login (POST) - Agent authentication
❌ /api/consultant/login (POST) - Consultant authentication
❌ /api/auth/forgot-password (POST) - Password reset
❌ /api/auth/reset-password (POST) - Password reset
❌ /api/trips (GET/POST/PUT/DELETE) - Trip management
❌ /api/agents/[id]/approve (POST) - Agent approval
❌ /api/booking/reschedule (POST) - Booking modifications
❌ /api/dpo-verify-payment (GET) - Payment verification
```

**Risk:** Attackers can:
- Brute force login credentials
- Spam booking requests
- Abuse password reset functionality
- Overload your database with trip queries
- Perform denial-of-service attacks

#### **1.2 In-Memory Rate Limiting Issues**
```typescript
// middleware.ts line 4
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
```

**Problems:**
- ❌ **Not persistent** - Resets on server restart
- ❌ **Not distributed** - Won't work across multiple server instances
- ❌ **Memory leak potential** - Map never clears old entries
- ❌ **IP spoofing vulnerable** - Uses `x-forwarded-for` header without validation

**Recommendation:** Use Redis with `rate-limiter-flexible` (already in dependencies!)

---

## 2. IDEMPOTENCY ANALYSIS

### ✅ **EXCELLENT IMPLEMENTATION:**

#### **2.1 Booking Idempotency**
```typescript
// lib/retrybookingservice.ts
const requestKey = `booking:${orderId}`;
return await deduplicateRequest(requestKey, async () => {
  // Check for existing booking by orderId
  const existing = await tx.booking.findUnique({ where: { orderId } });
  if (existing && existing.paymentStatus === 'paid') {
    throw new Error('BOOKING_ALREADY_PAID');
  }
  // ...
});
```

**Strengths:**
- ✅ Uses request deduplication wrapper
- ✅ Checks for existing bookings by `orderId`
- ✅ Prevents duplicate paid bookings
- ✅ Allows retry for pending bookings
- ✅ Uses database transactions with proper isolation level

#### **2.2 Seat Reservation Idempotency**
```typescript
// lib/reservationService.ts lines 18-23
if (reservedBy) {
  const now = new Date();
  const existing = await model.findFirst({ 
    where: { tripId, seatNumber, reservedBy, expiresAt: { gt: now } } 
  });
  if (existing) return existing;
}
```

**Strengths:**
- ✅ Prevents duplicate seat reservations
- ✅ Returns existing reservation if found
- ✅ Checks expiration time

#### **2.3 Reservation Link Generation**
```typescript
// app/api/reservations/[id]/generate-link/route.ts lines 66-78
const recentWindowMs = 30 * 1000; // 30 seconds
const recent = await prisma.reservationLink.findFirst({
  where: {
    tripReservationId: id,
    createdAt: { gte: recentSince },
    used: false,
    expiresAt: { gt: now }
  }
});
```

**Strengths:**
- ✅ 30-second idempotency window
- ✅ Prevents duplicate link generation
- ✅ Checks for unused, non-expired links

### ⚠️ **MINOR CONCERNS:**

#### **2.4 In-Memory Deduplication Limitations**
```typescript
// utils/requestDeduplication.ts
const processingRequests = new Map<string, Promise<any>>();
```

**Issues:**
- ⚠️ Only prevents concurrent duplicate requests
- ⚠️ Doesn't persist across server restarts
- ⚠️ Won't work in multi-instance deployments
- ⚠️ Map entries are deleted after completion (good for memory, but limits idempotency window)

**Current behavior:** Only prevents duplicates while request is in-flight (seconds), not across time (minutes/hours).

**Recommendation:** For true idempotency, store `orderId` with timestamp in Redis/database for 24 hours.

---

## 3. AUTHENTICATION & AUTHORIZATION

### ⚠️ **MIXED IMPLEMENTATION:**

#### **3.1 Admin Frontend Authentication - ✅ PROPERLY IMPLEMENTED**

**Excellent Supabase Auth Implementation:**

```typescript
// components/ProtectedRoute.tsx
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      router.replace("/admin/login");
    }
  });
  // Listen for logout/login events
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      router.replace("/admin/login");
    }
  });
});
```

**Strengths:**
- ✅ All admin pages wrapped in `ProtectedRoute` component
- ✅ Uses Supabase authentication
- ✅ Session validation on page load
- ✅ Real-time auth state monitoring
- ✅ Automatic redirect to login if unauthenticated
- ✅ Applied via `app/admin/layout.tsx` to all admin routes

```typescript
// app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRouteLayout>{children}</ProtectedRouteLayout>;
}
```

**Admin Login Features:**
- ✅ Email/password authentication
- ✅ Password reset functionality
- ✅ Registration with email verification
- ✅ Secure session management

#### **3.2 Agent/Consultant Authentication - ✅ GOOD**

**Strengths:**
- ✅ Uses JWT tokens
- ✅ Passwords hashed with bcrypt
- ✅ HTTP-only cookies (prevents XSS)
- ✅ 7-day token expiration
- ✅ Approval status verification

**Critical Weaknesses:**

```typescript
// app/api/agent/login/route.ts line 6
const JWT_SECRET = process.env.JWT_SECRET || "topo123";
```

❌ **CRITICAL:** Default JWT secret "topo123" is **EXTREMELY WEAK**
- If `JWT_SECRET` env var is not set, anyone can forge tokens
- Default secrets should NEVER be used in production

⚠️ **Concern:** No rate limiting on login attempts (brute force vulnerable)

#### **3.3 Admin API Routes - ❌ CRITICAL GAP**

**THE PROBLEM:** While admin **pages** require Supabase authentication, the admin **API routes** have NO authentication!

```typescript
// app/api/admin/booking/route.ts
export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: { trip: true, returnTrip: true },
    });
    return NextResponse.json(formattedBookings);
  }
}
```

❌ **CRITICAL SECURITY FLAW:** 
- **Frontend is protected** ✅ (requires Supabase login)
- **API endpoint is NOT protected** ❌ (anyone can call it directly)
- Exposes customer PII (names, emails, phones)
- Can be accessed via direct HTTP requests (curl, Postman, etc.)

**Example Attack:**
```bash
# Attacker can bypass frontend auth and call API directly:
curl https://your-domain.com/api/admin/booking
# Returns ALL bookings with customer data!
```

```typescript
// app/api/admin/booking/nullify/route.ts
export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();
    // ... deletes booking without auth check
  }
}
```

❌ **CRITICAL:** Anyone can cancel any booking by calling API directly!

```typescript
// app/api/agents/[id]/approve/route.ts
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.agent.update({
    where: { id: params.id },
    data: { approved: true }
  });
  return NextResponse.json({ success: true });
}
```

❌ **CRITICAL:** Anyone can approve agents without admin verification!

#### **3.4 Trip Management API - ❌ NO AUTHENTICATION**

```typescript
// app/api/trips/route.ts
export async function POST(request: Request) { /* creates trip */ }
export async function PUT(request: Request) { /* updates trip */ }
export async function DELETE(request: Request) { /* deletes trip */ }
```

❌ **CRITICAL:** No authentication on trip CRUD operations
- Anyone can create/modify/delete trips via direct API calls
- Could disrupt entire business operations

#### **3.5 The Frontend vs Backend Auth Gap**

**Current State:**
```
User → Admin Page (Protected ✅) → API Route (Unprotected ❌)
Attacker → API Route directly (Unprotected ❌) → Success!
```

**What You Need:**
```
User → Admin Page (Protected ✅) → API Route (Protected ✅)
Attacker → API Route directly → 401 Unauthorized ❌
```

---

## 4. BUS BOOKING SECURITY

### ✅ **STRONG IMPLEMENTATION:**

#### **4.1 Seat Reservation System**
```typescript
// app/api/create-dpo-session/route.ts lines 72-91
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
for (const seat of seatsArray) {
  try {
    await reservationService.createReservation({ 
      tripId, seatNumber: String(seat), reservedBy: orderId, expiresAt 
    });
  } catch (err: any) {
    if (err?.code === 'P2002' || /unique/i.test(err?.message || '')) {
      return NextResponse.json({ 
        error: `Seat ${seat} is no longer available.` 
      }, { status: 409 });
    }
  }
}
```

**Strengths:**
- ✅ Optimistic seat locking (10-minute reservation)
- ✅ Unique constraint on `(tripId, seatNumber)`
- ✅ Proper conflict detection (409 status)
- ✅ Prevents double booking

#### **4.2 Database Constraints**
```prisma
// prisma/schema.prisma lines 123, 205
model Passenger {
  @@unique([tripId, seatNumber]) // Prevent double booking
}

model SeatReservation {
  @@unique([tripId, seatNumber])
  @@index([expiresAt])
}
```

**Strengths:**
- ✅ Database-level enforcement
- ✅ Cannot be bypassed by application code
- ✅ Indexed for performance

#### **4.3 Transaction Isolation**
```typescript
// lib/retrybookingservice.ts lines 263-266
}, {
  maxWait: 10000,
  timeout: 20000,
  isolationLevel: 'ReadCommitted',
})
```

**Strengths:**
- ✅ Uses database transactions
- ✅ Proper isolation level
- ✅ Timeout protection
- ✅ Retry logic with exponential backoff

#### **4.4 Reservation Token System**
```typescript
// lib/retrybookingservice.ts lines 86-126
if (data.reservationToken) {
  // Validates token exists, not used, not expired
  // Ensures token matches trip
  // Validates selected seats are reserved
  // Marks token as used after booking
}
```

**Strengths:**
- ✅ Secure token-based seat holding
- ✅ Expiration enforcement
- ✅ One-time use tokens
- ✅ Trip validation
- ✅ Seat validation

### ⚠️ **CONCERNS:**

#### **4.5 Race Condition Window**
```typescript
// lib/retrybookingservice.ts lines 143-148
const bookedSeats: string[] = [];
for (const booking of trip.bookings) {
  if (booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid') {
    // counts seats
  }
}
```

⚠️ **Minor Risk:** Small window between checking availability and creating booking
- Mitigated by database unique constraints
- Mitigated by seat reservation system
- Could still cause user-facing errors in high-concurrency scenarios

#### **4.6 Payment Status Handling**
```typescript
// lib/retrybookingservice.ts lines 68-72
if (existing.paymentStatus === 'pending') {
  console.log(`[${orderId}] Found existing pending booking - allowing payment retry`);
  return existing;
}
```

✅ **Good:** Allows payment retry for pending bookings
⚠️ **Concern:** No timeout on pending bookings (could hold seats indefinitely)

---

## 5. INPUT VALIDATION

### ❌ **WEAK IMPLEMENTATION:**

#### **5.1 Missing Validation**

Most endpoints have **minimal input validation**:

```typescript
// app/api/booking/route.ts lines 5-10
const data = await req.json();
if (!data.paymentStatus) {
  data.paymentStatus = 'pending';
}
```

❌ **No validation for:**
- Email format
- Phone number format
- Seat number format
- Price ranges
- Passenger count limits
- Date validity
- Required fields

```typescript
// app/api/trips/route.ts line 270
const { id } = await request.json();
await prisma.trip.delete({ where: { id } });
```

❌ **No validation:**
- ID format
- Existence check
- Foreign key constraints

#### **5.2 No Schema Validation**

**Missing:** Zod schemas (Zod is in dependencies but not used!)

**Recommendation:**
```typescript
import { z } from 'zod';

const BookingSchema = z.object({
  tripId: z.string().uuid(),
  userName: z.string().min(2).max(100),
  userEmail: z.string().email(),
  userPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  selectedSeats: z.array(z.string()).min(1).max(10),
  totalPrice: z.number().positive(),
  // ...
});
```

---

## 6. SQL INJECTION PROTECTION

### ✅ **EXCELLENT:**

All database queries use **Prisma ORM** with parameterized queries:

```typescript
// lib/retrybookingservice.ts
await tx.booking.findUnique({ where: { orderId: data.orderId } });
```

✅ **No raw SQL with string concatenation**
✅ **Prisma automatically escapes parameters**
✅ **Even raw queries use parameterization:**

```typescript
// lib/reservationService.ts lines 40-42
const rows: any[] = await prisma.$queryRaw`
  SELECT ... FROM "SeatReservation"
  WHERE "tripId" = ${tripId} AND "seatNumber" = ${seatNumber}
`;
```

**SQL Injection Risk: VERY LOW** ✅

---

## 7. CROSS-SITE SCRIPTING (XSS)

### ⚠️ **MODERATE RISK:**

#### **7.1 API Responses**
- APIs return JSON (not HTML) - **Lower XSS risk**
- No Content-Security-Policy headers
- No X-Content-Type-Options headers

#### **7.2 Email Templates**
```typescript
// app/api/reservations/[id]/generate-link/route.ts lines 108-118
const html = ReactDOMServer.renderToStaticMarkup(
  ReservationLinkEmail({
    customerName: reservation.reservedClientName || '',
    // ...
  })
);
```

⚠️ **Depends on email template implementation** (not reviewed in this analysis)

---

## 8. SENSITIVE DATA EXPOSURE

### ❌ **CRITICAL ISSUES:**

#### **8.1 Logging Sensitive Data**
```typescript
// lib/retrybookingservice.ts line 23
console.log(`[${orderId}] Received booking data:`, JSON.stringify(data, null, 2));
```

❌ **Logs contain:**
- Customer names
- Email addresses
- Phone numbers
- Payment information
- Seat selections

**Risk:** Logs may be stored insecurely or accessed by unauthorized personnel

#### **8.2 Error Messages**
```typescript
// app/api/booking/route.ts line 32
return NextResponse.json({ success: false, error: err?.message || 'Booking creation failed' }, { status: 500 });
```

⚠️ **May expose internal error details** to clients

#### **8.3 No HTTPS Enforcement**
```typescript
// app/api/agent/login/route.ts line 29
secure: process.env.NODE_ENV === "production",
```

✅ **Good:** Secure cookies in production
❌ **Missing:** HTTPS redirect middleware

---

## 9. CORS & SECURITY HEADERS

### ❌ **NOT IMPLEMENTED:**

**Missing security headers:**
- ❌ Content-Security-Policy
- ❌ X-Frame-Options
- ❌ X-Content-Type-Options
- ❌ Strict-Transport-Security
- ❌ Referrer-Policy
- ❌ Permissions-Policy

**No CORS configuration** in `next.config.mjs`

---

## 10. DEPENDENCY SECURITY

### ⚠️ **CONCERNS:**

```json
// package.json
"rate-limiter-flexible": "^7.2.0",  // ✅ Available but NOT USED
"ioredis": "^5.7.0",                // ✅ Available but NOT USED
"zod": "^3.24.1",                   // ✅ Available but NOT USED
```

**Recommendation:** Run `npm audit` to check for known vulnerabilities

---

## CRITICAL RECOMMENDATIONS (Priority Order)


8. **Add security headers**
   ```typescript
   // middleware.ts
   response.headers.set('X-Frame-Options', 'DENY');
   response.headers.set('X-Content-Type-Options', 'nosniff');
   // ...
   ```

9. **Implement HTTPS redirect**
10. **Add timeout for pending bookings**
11. **Sanitize log output** (remove PII)
12. **Add CORS configuration**
13. **Implement CSP headers**

### 🟢 **LOW PRIORITY (Future):**

14. **Add request signing for webhooks**
15. **Implement API versioning**
16. **Add audit logging**
17. **Set up security monitoring**

---

## POSITIVE FINDINGS ✅

Your system does several things **very well**:

```
  data.paymentStatus = 'pending';
}
```

❌ **No validation for:**
- Email format
- Phone number format
- Seat number format
- Price ranges
- Passenger count limits
- Date validity
- Required fields

```typescript
// app/api/trips/route.ts line 270
const { id } = await request.json();
await prisma.trip.delete({ where: { id } });
```

❌ **No validation:**
- ID format
- Existence check
- Foreign key constraints

#### **5.2 No Schema Validation**

**Missing:** Zod schemas (Zod is in dependencies but not used!)

**Recommendation:**
```typescript
import { z } from 'zod';

const BookingSchema = z.object({
  tripId: z.string().uuid(),
  userName: z.string().min(2).max(100),
  userEmail: z.string().email(),
  userPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  selectedSeats: z.array(z.string()).min(1).max(10),
  totalPrice: z.number().positive(),
  // ...
});
```

---

## 6. SQL INJECTION PROTECTION

### ✅ **EXCELLENT:**

All database queries use **Prisma ORM** with parameterized queries:

```typescript
// lib/retrybookingservice.ts
await tx.booking.findUnique({ where: { orderId: data.orderId } });
```

✅ **No raw SQL with string concatenation**
✅ **Prisma automatically escapes parameters**
✅ **Even raw queries use parameterization:**

```typescript
// lib/reservationService.ts lines 40-42
const rows: any[] = await prisma.$queryRaw`
  SELECT ... FROM "SeatReservation"
  WHERE "tripId" = ${tripId} AND "seatNumber" = ${seatNumber}
`;
```

**SQL Injection Risk: VERY LOW** ✅

---

## 7. CROSS-SITE SCRIPTING (XSS)

### ⚠️ **MODERATE RISK:**

#### **7.1 API Responses**
- APIs return JSON (not HTML) - **Lower XSS risk**
- No Content-Security-Policy headers
- No X-Content-Type-Options headers

#### **7.2 Email Templates**
```typescript
// app/api/reservations/[id]/generate-link/route.ts lines 108-118
const html = ReactDOMServer.renderToStaticMarkup(
  ReservationLinkEmail({
    customerName: reservation.reservedClientName || '',
    // ...
  })
);
```

⚠️ **Depends on email template implementation** (not reviewed in this analysis)

---

## 8. SENSITIVE DATA EXPOSURE

### ❌ **CRITICAL ISSUES:**

#### **8.1 Logging Sensitive Data**
```typescript
// lib/retrybookingservice.ts line 23
console.log(`[${orderId}] Received booking data:`, JSON.stringify(data, null, 2));
```

❌ **Logs contain:**
- Customer names
- Email addresses
- Phone numbers
- Payment information
- Seat selections

**Risk:** Logs may be stored insecurely or accessed by unauthorized personnel

#### **8.2 Error Messages**
```typescript
// app/api/booking/route.ts line 32
return NextResponse.json({ success: false, error: err?.message || 'Booking creation failed' }, { status: 500 });
```

⚠️ **May expose internal error details** to clients

#### **8.3 No HTTPS Enforcement**
```typescript
// app/api/agent/login/route.ts line 29
secure: process.env.NODE_ENV === "production",
```

✅ **Good:** Secure cookies in production
❌ **Missing:** HTTPS redirect middleware

---

## 9. CORS & SECURITY HEADERS

### ❌ **NOT IMPLEMENTED:**

**Missing security headers:**
- ❌ Content-Security-Policy
- ❌ X-Frame-Options
- ❌ X-Content-Type-Options
- ❌ Strict-Transport-Security
- ❌ Referrer-Policy
- ❌ Permissions-Policy

**No CORS configuration** in `next.config.mjs`

---

## 10. DEPENDENCY SECURITY

### ⚠️ **CONCERNS:**

```json
// package.json
"rate-limiter-flexible": "^7.2.0",  // ✅ Available but NOT USED
"ioredis": "^5.7.0",                // ✅ Available but NOT USED
"zod": "^3.24.1",                   // ✅ Available but NOT USED
```

**Recommendation:** Run `npm audit` to check for known vulnerabilities

---

## CRITICAL RECOMMENDATIONS (Priority Order)


8. **Add security headers**
   ```typescript
   // middleware.ts
   response.headers.set('X-Frame-Options', 'DENY');
   response.headers.set('X-Content-Type-Options', 'nosniff');
   // ...
   ```

9. **Implement HTTPS redirect**
10. **Add timeout for pending bookings**
11. **Sanitize log output** (remove PII)
12. **Add CORS configuration**
13. **Implement CSP headers**

### 🟢 **LOW PRIORITY (Future):**

14. **Add request signing for webhooks**
15. **Implement API versioning**
16. **Add audit logging**
17. **Set up security monitoring**

---

## POSITIVE FINDINGS ✅

1. ✅ **Excellent booking idempotency** with transaction safety
2. ✅ **Strong seat reservation system** with database constraints
3. ✅ **No SQL injection vulnerabilities** (Prisma ORM)
4. ✅ **Proper password hashing** (bcrypt)
5. ✅ **HTTP-only cookies** for JWT tokens

### 4. Authentication & Authorization
- **Admin API**: ✅ **FIXED**. All `/api/admin/*` routes are now protected by `middleware.ts` which enforces Supabase session verification.
- **Trip Management**: ✅ **FIXED**. `POST`, `PUT`, `DELETE` methods on `/api/trips` are now protected by `requireAdminAuth`.
- **Charter Management**: ✅ **FIXED**. All charter creation and cancellation routes are protected by `requireAdminAuth`.
- **JWT Secret**: ✅ **FIXED**. The application now throws a critical error in production if the default `JWT_SECRET` is used.
- **Agent/Consultant Auth**: Uses custom JWT implementation. ✅ **FIXED**. Rate limiting and bot protection added to login routes.

### 5. Rate Limiting & Bot Protection
- **Global Protection**: ✅ **FIXED**. Arcjet middleware added for global bot detection.
- **Login Routes**: ✅ **FIXED**. Strict rate limiting (5 req/15m) applied to agent/consultant login.
- **Booking Routes**: ✅ **FIXED**. Moderate rate limiting (10 req/1h) and email validation applied to booking endpoints.
- **DPO Payment**: ✅ **FIXED**. Rate limiting applied to DPO session creation.

### 6. Input Validation
- **Status**: ⚠️ **PARTIALLY IMPLEMENTED**.
- **Details**: Some routes use manual validation. Zod integration is recommended for future improvements.

---

**Report Generated:** 2025-11-27  
**Next Review Recommended:** After implementing critical fixes
```
