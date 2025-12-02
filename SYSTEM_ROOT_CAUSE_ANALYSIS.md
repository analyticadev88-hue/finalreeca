# Bus Booking System - Root Cause Analysis & Fixes

## Executive Summary

The bus booking system is currently experiencing critical data integrity issues, primarily revolving around seat management, concurrency control, and charter handling. The most severe symptoms are "ghost bookings" (mismatches between booked seats and passenger records) and the inability to reliably distinguish between departure and return legs in round-trip bookings.

**Root Causes:**
1.  **Flawed Data Model:** The `Booking` model stores seats as JSON arrays (`seats`, `returnSeats`) without a normalized structure, making atomic updates and validation impossible at the database level.
2.  **Race Conditions:** The booking flow lacks database-level locking (e.g., `SELECT FOR UPDATE`), allowing multiple users to book the same seats simultaneously.
3.  **Logic Errors:** The `createBookingWithRetry` function incorrectly calculates `seatCount` by aggregating all passengers (departure + return) against a single seat count field, leading to validation failures and data corruption.
4.  **Charter Zombies:** Charter reservations create `SeatReservation` records that never expire, permanently blocking inventory.

**Proposed Solution:**
We propose a 3-phase remediation plan. **Phase 1 (Emergency)** involves fixing the critical logic errors in the booking service and implementing optimistic locking via Prisma transactions. **Phase 2 (Schema)** normalizes the database to track seats individually. **Phase 3** introduces a robust reservation system with auto-expiry.

---

## 1. Detailed Analysis

### Issue A: Seat Count Logic & Data Integrity
**Location:** `lib/retrybookingservice.ts`
**Severity:** Critical
**Description:** The system fails to distinguish between departure and return seat counts during validation and storage.

**Current Code (Flawed):**
```typescript
// lib/retrybookingservice.ts
seatCount: data.passengers.length, // WRONG: Counts ALL passengers (dep + ret)

// Validation Logic
if (departurePassengers.length !== departureSeats.length) {
  // Logs error but allows booking to proceed!
}
```

**Impact:**
- A round trip with 2 passengers (2 dep + 2 ret) results in `seatCount: 4`.
- The system expects 4 departure seats but only finds 2, triggering "mismatch" errors.
- Downstream systems (manifests, capacity checks) read `seatCount` and assume 4 seats are occupied on the *departure* trip, leading to false "sold out" states.

### Issue B: Concurrency & Race Conditions
**Location:** `app/api/create-dpo-session/route.ts` & `lib/retrybookingservice.ts`
**Severity:** High
**Description:** There is no atomic lock on seat inventory.

**Flow:**
1.  User A selects Seat 1A.
2.  User B selects Seat 1A.
3.  Both check `Trip.occupiedSeats` (JSON). Both see it as empty.
4.  Both submit payment.
5.  Both write to DB. The last write wins, or both exist in `Booking` table but `Trip.occupiedSeats` is overwritten.

**Impact:** Double bookings, requiring manual refunds and customer support intervention.

### Issue C: Charter Reservation Zombies
**Location:** `app/api/charters/route.ts` (implied)
**Severity:** Medium
**Description:** Chartering a bus creates 57 `SeatReservation` records. These records lack a cleanup mechanism if the charter is cancelled or modified improperly.

**Impact:** 114+ seats are currently blocked indefinitely, causing revenue loss.

---

## 2. Specific Fixes

### Fix 1: Correct `createBookingWithRetry` Logic
**Target File:** `lib/retrybookingservice.ts`

**Change:**
```typescript
// Calculate counts separately
const departureSeatCount = data.departureSeats?.length || (Array.isArray(data.selectedSeats) ? data.selectedSeats.length : 0);
const returnSeatCount = data.returnSeats?.length || 0;

// ... inside prisma.booking.create ...
data: {
  // ...
  seatCount: departureSeatCount, // STRICTLY departure seats
  // We should ideally add a 'returnSeatCount' column, but for now we rely on returnSeats JSON length
  // ...
}
```

### Fix 2: Implement Atomic Locking (Advisory Locks)
Since Prisma doesn't support `SELECT FOR UPDATE` easily without raw SQL, we will use PostgreSQL Advisory Locks during the critical booking section.

**Target File:** `lib/retrybookingservice.ts`

**Code:**
```typescript
await tx.$executeRaw`SELECT pg_advisory_xact_lock(${tripIdHash})`;
// Perform availability check
// Perform booking
// Lock releases automatically at end of transaction
```

### Fix 3: Strict Validation
**Target File:** `lib/retrybookingservice.ts`

**Code:**
```typescript
if (departurePassengers.length !== departureSeatCount) {
  throw new Error(`CRITICAL: Departure passenger/seat mismatch. Passengers: ${departurePassengers.length}, Seats: ${departureSeatCount}`);
}
if (returnPassengers.length !== returnSeatCount) {
  throw new Error(`CRITICAL: Return passenger/seat mismatch. Passengers: ${returnPassengers.length}, Seats: ${returnSeatCount}`);
}
```

---

## 3. Database Migration Scripts

### Phase 2 Migration (Recommended)
To solve the JSON data integrity issue permanently, we need to normalize seat tracking.

```sql
-- 1. Create Seat table
CREATE TABLE "Seat" (
  "id" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "seatNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, BOOKED, BLOCKED
  "bookingId" TEXT,
  "version" INTEGER NOT NULL DEFAULT 0, -- For optimistic locking

  CONSTRAINT "Seat_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Seat_tripId_seatNumber_key" UNIQUE ("tripId", "seatNumber")
);

-- 2. Migrate existing JSON data (Pseudo-code for migration script)
-- For each Trip:
--   Parse occupiedSeats JSON
--   For each seat in JSON:
--     INSERT INTO "Seat" (tripId, seatNumber, status) VALUES (trip.id, seat, 'BOOKED');
```

---

## 4. Testing Strategy

### Unit Tests
1.  **Round Trip Counting:**
    - Input: 2 departure seats, 2 return seats, 2 passengers (with `isReturn` flags).
    - Assert: `seatCount` = 2 (not 4).
    - Assert: No validation errors.
2.  **Mismatch Detection:**
    - Input: 2 departure seats, 1 departure passenger.
    - Assert: Throws `Error`.

### Integration Tests (Concurrency)
1.  **Double Booking Race:**
    - Spawn 2 concurrent requests for the same Trip + Seat.
    - Assert: Request A succeeds (200).
    - Assert: Request B fails (409 Conflict).
    - Assert: DB shows only 1 booking for that seat.

---

## 5. Rollout Checklist

### Phase 1: Emergency Fixes (Immediate)
- [ ] **Stop the bleeding:** Apply logic fixes to `lib/retrybookingservice.ts` (Fix 1 & 3).
- [ ] **Deploy:** Push to production.
- [ ] **Verify:** Monitor logs for "mismatch" errors (should be zero).

### Phase 2: Cleanup & Locking (Next 24h)
- [ ] **Script:** Run a cleanup script to fix existing "ghost" bookings in DB.
- [ ] **Locking:** Implement PostgreSQL advisory locks in booking transaction.

### Phase 3: Structural Improvements (Next Sprint)
- [ ] **Schema:** Execute DB migration to `Seat` table.
- [ ] **Refactor:** Update `seatselection.tsx` to read from `Seat` table instead of `Trip.occupiedSeats`.
- [ ] **Charter:** Implement cron job for `SeatReservation` cleanup.
