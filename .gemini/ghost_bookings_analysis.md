# Ghost Bookings & Seat Reservation Issues - Root Cause Analysis

## Executive Summary
Based on your database analysis and codebase review, I've identified **5 critical issues** causing ghost bookings and seats appearing unavailable without corresponding bookings.

---

## Issue #1: **Seat Reservations Not Being Cleaned Up After Booking Creation** ⚠️ CRITICAL

### Location
- `app/api/create-dpo-session/route.ts` (Lines 165-170)

### Problem
```typescript
// Consume / remove reservations for this order (they are now booked)
try {
  await reservationService.deleteReservationsByReservedBy(tripId, orderId);
} catch (err: any) {
  console.warn('Failed to clean up seat reservations for order', orderId, err);
}
```

**The cleanup is wrapped in a try-catch that only WARNS on failure!** This means:
1. Seats get reserved when payment starts
2. Booking is created successfully
3. If cleanup fails (network issue, DB timeout, etc.), the reservation persists
4. The seat appears "taken" in `SeatReservation` table but has no actual booking

### Evidence from Your Data
- You have 114 seat reservations
- Only 5 actual bookings
- The reservations are for charter trips that never converted to bookings

### Fix Required
```typescript
// After booking creation, MUST clean up reservations
const cleanupResult = await reservationService.deleteReservationsByReservedBy(tripId, orderId);
if (!cleanupResult) {
  // Log error but don't fail the booking since it's already created
  console.error(`[CRITICAL] Failed to cleanup reservations for ${orderId}`);
}
```

---

## Issue #2: **No Automatic Cleanup of Expired Reservations** ⚠️ CRITICAL

### Location
- `app/api/reservations/cleanup/route.ts`
- No cron job or scheduled task found

### Problem
The cleanup endpoint exists but **is never called automatically**:
```typescript
export async function POST() {
  const result = await reservationService.deleteExpiredReservations();
  return NextResponse.json({ success: true, deleted });
}
```

### Evidence from Your Data
```sql
-- Your expired reservations (Cape Town trip expired on 2025-11-21)
Trip ID: 7dbf2fee-501f-4651-be54-9c8fa03e1152
Reserved: 2025-10-22
Expires: 2025-11-21  <-- EXPIRED!
Departure: 2025-10-23
Status: Still in database blocking seats
```

### Fix Required
Add a cron job or scheduled task:
```typescript
// Option 1: Vercel Cron (vercel.json)
{
  "crons": [{
    "path": "/api/reservations/cleanup",
    "schedule": "*/5 * * * *"  // Every 5 minutes
  }]
}

// Option 2: Call cleanup before fetching bookings
// In app/api/trips/[tripId]/bookings/route.ts
await deleteExpiredReservations();
const bookings = await prisma.booking.findMany(...);
```

---

## Issue #3: **Race Condition in Seat Availability Check** ⚠️ HIGH

### Location
- `app/booking/seatselection.tsx` (Lines 298-351)
- `app/api/trips/[tripId]/bookings/route.ts` (Lines 56-58)

### Problem
```typescript
// Seat selection fetches reservations
const { bookings, reservedSeatNumbers = [] } = await fetchTripBookings(selectedBus.id);

// But reservations are fetched SEPARATELY from bookings
const reservations = await prisma.seatReservation.findMany({ where: { tripId } });
const reservedSeatNumbers = reservations.map(r => r.seatNumber);
```

**The issue:**
1. User A starts booking, creates reservation
2. User B loads seat selection, sees seat as "reserved"
3. User A's payment fails, but reservation cleanup fails
4. Seat is permanently blocked

### Evidence from Your Data
Your query returned NO results:
```sql
SELECT sr.*
FROM "SeatReservation" sr
WHERE sr."tripReservationId" IS NULL 
  AND (sr."reservedBy" IS NULL OR sr."reservedBy" NOT IN (SELECT id FROM "Booking"))
```

This means ALL your seat reservations have `tripReservationId` set, which indicates they're **admin charter reservations**, not temporary user reservations!

---

## Issue #4: **Charter Reservations Never Expire** ⚠️ HIGH

### Location
- `prisma/schema.prisma` (Lines 195-207, 223-243)

### Problem
```typescript
model SeatReservation {
  tripReservationId String?
  tripReservation TripReservation? @relation(...)
  expiresAt  DateTime
}

model TripReservation {
  status String @default("reserved") // reserved | converted | cancelled
}
```

**Your charter reservations:**
- BOFINET SPORTING CLUB: 57 seats reserved until 2025-12-25
- Test charter: 57 seats reserved until 2025-11-21 (EXPIRED!)

These are **admin reservations** that should either:
1. Be converted to bookings
2. Be cancelled
3. Have their `expiresAt` extended

But they're **blocking all seats** on those trips!

### Fix Required
```sql
-- Clean up expired charter reservations
DELETE FROM "SeatReservation" 
WHERE "expiresAt" < NOW() 
  AND "tripReservationId" IS NOT NULL;

-- Or update TripReservation status
UPDATE "TripReservation" 
SET status = 'cancelled' 
WHERE id IN (
  SELECT DISTINCT "tripReservationId" 
  FROM "SeatReservation" 
  WHERE "expiresAt" < NOW()
);
```

---

## Issue #5: **Inconsistent Seat Availability Logic** ⚠️ MEDIUM

### Location
- `app/booking/seatselection.tsx` (Lines 304-311)

### Problem
```typescript
const bookedSeats: string[] = bookings
  .filter((booking: any) => 
    booking.bookingStatus === 'confirmed' && 
    booking.paymentStatus === 'paid'  // <-- Only shows PAID bookings
  )
  .flatMap((booking: any) =>
    booking.passengers
      .filter((p: any) => p.isReturn === isReturnTrip)
      .map((p: any) => p.seatNumber)
  );

const mergedBookedSeats = Array.from(new Set([
  ...bookedSeats, 
  ...reservedSeatNumbers.filter((s: string) => !!s)
]));
```

**The issue:**
- Bookings with `paymentStatus: 'pending'` are NOT shown as booked
- But their seats ARE in the `Booking` table
- This creates a window where seats can be double-booked

### Evidence from Your Data
```json
{
  "booking_status": "confirmed",
  "payment_status": "pending",  // <-- These seats are NOT shown as unavailable!
  "count": 3
}
```

---

## Recommended Fixes (Priority Order)

### 1. **Immediate: Clean Up Expired Reservations**
```sql
-- Run this NOW to free up blocked seats
DELETE FROM "SeatReservation" WHERE "expiresAt" < NOW();
```

### 2. **High Priority: Add Automatic Cleanup**
Create `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/reservations/cleanup",
    "schedule": "*/5 * * * *"
  }]
}
```

### 3. **High Priority: Fix Reservation Cleanup After Booking**
Update `app/api/create-dpo-session/route.ts`:
```typescript
// After booking creation (line 163)
await prisma.booking.update({
  where: { id: booking.id },
  data: { transactionToken: dpoResponse.transactionToken },
});

// CRITICAL: Clean up reservations synchronously
try {
  const deleted = await reservationService.deleteReservationsByReservedBy(tripId, orderId);
  console.log(`[${orderId}] Cleaned up ${deleted} seat reservations`);
} catch (err: any) {
  console.error(`[CRITICAL] Failed to cleanup reservations for ${orderId}:`, err);
  // Consider: Retry logic or alert admin
}
```

### 4. **Medium Priority: Show Pending Bookings as Unavailable**
Update `app/api/trips/[tripId]/bookings/route.ts`:
```typescript
const bookings = await prisma.booking.findMany({
  where: {
    tripId,
    bookingStatus: 'confirmed',
    // REMOVE: paymentStatus: 'paid',  // Show ALL confirmed bookings
  },
  // ...
});
```

### 5. **Medium Priority: Add Reservation Expiry Check on Load**
Update `app/booking/seatselection.tsx`:
```typescript
const loadSeatData = useCallback(async () => {
  setIsLoadingSeats(true);
  
  // Clean up expired reservations BEFORE fetching
  await fetch('/api/reservations/cleanup', { method: 'POST' });
  
  const { bookings, reservedSeatNumbers = [] } = await fetchTripBookings(selectedBus.id);
  // ...
}, [selectedBus.id]);
```

---

## Testing Checklist

After implementing fixes:

1. ✅ Verify expired reservations are deleted
2. ✅ Create a booking and confirm reservations are cleaned up
3. ✅ Check that pending bookings show as unavailable
4. ✅ Test charter reservation expiry
5. ✅ Monitor logs for cleanup failures

---

## Database Queries for Monitoring

```sql
-- Find orphaned reservations (no booking)
SELECT sr.*, t."routeName", t."departureDate"
FROM "SeatReservation" sr
JOIN "Trip" t ON sr."tripId" = t.id
WHERE sr."reservedBy" NOT IN (SELECT "orderId" FROM "Booking")
  AND sr."tripReservationId" IS NULL
  AND sr."expiresAt" > NOW();

-- Find expired but not cleaned up
SELECT COUNT(*) as expired_count
FROM "SeatReservation"
WHERE "expiresAt" < NOW();

-- Find bookings without seat cleanup
SELECT b."orderId", COUNT(sr.id) as orphaned_reservations
FROM "Booking" b
LEFT JOIN "SeatReservation" sr ON sr."reservedBy" = b."orderId"
WHERE b."paymentStatus" = 'paid'
  AND sr.id IS NOT NULL
GROUP BY b."orderId";
```

---

## Root Cause Summary

Your ghost booking issues stem from:

1. **Charter reservations** (BOFINET, test) that expired but weren't cleaned up
2. **No automatic cleanup** of expired reservations
3. **Silent failures** in reservation cleanup after booking creation
4. **Inconsistent logic** for showing seat availability (pending vs paid)

The good news: These are all fixable with the changes above! 🎯
