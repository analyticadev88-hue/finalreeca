# Safe Rollout Plan: Bus Booking System Fixes

## ⚠️ CRITICAL CONSTRAINTS
- **Production System:** Zero downtime allowed.
- **Backward Compatibility:** Existing frontend and API contracts MUST remain unchanged.
- **Data Safety:** No destructive updates to existing booking records.
- **Gradual Rollout:** Changes introduced in parallel, not as replacements.

---

## Phase 1: Immediate Safety Fixes (Zero Risk)
**Goal:** Stop invalid data from entering the system without changing the data structure.

### 1. Strict Validation (The "Circuit Breaker")
**Action:** Update `lib/retrybookingservice.ts` to **THROW** errors on mismatches instead of logging.
**Why:** Prevents new "ghost bookings" immediately.
**Risk:** Low. Valid bookings proceed; only broken requests are rejected.

```typescript
// Current (Unsafe):
if (departurePassengers.length !== departureSeats.length) {
  console.error("Mismatch..."); // Allows bad data!
}

// New (Safe):
if (departurePassengers.length !== departureSeats.length) {
  throw new Error(`VALIDATION_FAILED: Departure passenger count (${departurePassengers.length}) does not match seat count (${departureSeats.length})`);
}
```

### 2. Atomic Locking (Advisory Locks)
**Action:** Implement PostgreSQL advisory locks in the booking transaction.
**Why:** Prevents double bookings during high concurrency.
**Risk:** Low. Invisible to frontend/users.

---

## Phase 2: Additive Schema Changes (Next Deployment)
**Goal:** Introduce correct data modeling alongside existing fields.

### 1. Schema Update
Add new fields to `Booking` model. **DO NOT** touch `seatCount` or `seats` yet.

```prisma
model Booking {
  // ... existing fields ...
  seatCount Int // KEEP AS IS (Total passengers)

  // NEW FIELDS (Optional for now)
  departureSeatCount Int? @default(0)
  returnSeatCount    Int? @default(0)
  
  // Future-proofing
  departureTripId    String? // Explicit link
}
```

### 2. Parallel Writing
Update `createBookingWithRetry` to populate BOTH old and new fields.

```typescript
data: {
  // OLD (Backward Compatible)
  seatCount: data.passengers.length, 
  
  // NEW (Correct Logic)
  departureSeatCount: departureSeats.length,
  returnSeatCount: returnSeats.length,
}
```

---

## Phase 3: Frontend Migration (Gradual)
**Goal:** Switch frontend components to use new fields one by one.

1.  **Audit:** Identify all usages of `seatCount` in frontend.
2.  **Update:** Change `TicketPdf.tsx` to use `departureSeatCount` if available, fallback to `seatCount`.
3.  **Verify:** Test reporting tools.

---

## Phase 4: Cleanup & Deprecation (Long Term)
**Goal:** Clean up technical debt only after weeks of stability.

1.  **Data Backfill:** Run script to populate `departureSeatCount` for old bookings based on JSON analysis.
2.  **Deprecate:** Mark `seatCount` as deprecated in codebase.

---

## Rollback Plan
- **Validation:** If legitimate bookings are blocked, revert validation to "log-only" mode.
- **Schema:** New columns are nullable/optional; they won't break existing queries.
- **Code:** Use feature flags or env vars to toggle strict validation if unsure.
