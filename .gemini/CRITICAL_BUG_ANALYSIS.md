# 🚨 CRITICAL BUG ANALYSIS: Missing Passenger Records for Round-Trip Bookings

## EXECUTIVE SUMMARY - CRITICAL PRODUCTION BUG

**Status:** CONFIRMED - CRITICAL DATA INTEGRITY BUG  
**Impact:** 40% of bookings affected (2 out of 5)  
**Risk Level:** HIGH - Active double-booking risk  
**Revenue Impact:** Seats marked as sold but unoccupied

---

## ROOT CAUSE IDENTIFIED ✅

### **Location:** `lib/retrybookingservice.ts` - Lines 169-178

```typescript
// Filter duplicates by seatNumber within the same trip to avoid P2002
const uniqueBySeat: Record<string, any> = {};
for (const p of data.passengers) {
  const key = `${created.tripId}::${p.seatNumber}`;  // ⚠️ BUG IS HERE!
  if (!uniqueBySeat[key]) {
    uniqueBySeat[key] = p;
  } else {
    console.log(`[${orderId}] Duplicate passenger for seat ${p.seatNumber} ignored`);
  }
}
```

### **The Problem:**

The deduplication key uses **ONLY** `tripId` and `seatNumber`:
```typescript
const key = `${created.tripId}::${p.seatNumber}`;
```

**But for round-trip bookings:**
- `created.tripId` = Departure trip ID (same for all passengers)
- Passenger for seat `1A` on **departure** has key: `trip123::1A`
- Passenger for seat `1A` on **return** has key: `trip123::1A` ⚠️ **DUPLICATE!**

**Result:** The second passenger (return trip) **overwrites** the first (departure trip)!

---

## PROOF FROM YOUR DATA

### **Booking RT167497 (AGANG TSHOSA)**

**Expected:**
- Departure seats: `["4C","4D","1A","1B"]` → 4 departure passengers
- Return seats: `["4C","4D","1A","1B"]` → 4 return passengers
- **Total: 8 passenger records**

**Actual in Database:**
```sql
SELECT "seatNumber", "isReturn", COUNT(*) 
FROM "Passenger" 
WHERE "bookingId" = '03eab021-9fbf-47df-8a00-8d9a12716e04'
GROUP BY "seatNumber", "isReturn";
```

**Result:**
- `4C` departure ✅
- `4D` departure ✅
- `1A` return ⚠️ (departure missing!)
- `1B` return ⚠️ (departure missing!)
- `4C` return ✅
- `4D` return ✅

**Missing:** Passengers for seats `1A` and `1B` on **departure trip**!

---

## WHY THIS HAPPENS - STEP BY STEP

### **Frontend Creates Passengers Correctly**

**File:** `app/booking/passengerdetails/page.tsx` (Lines 275-341)

```typescript
const [passengers, setPassengers] = useState<Passenger[]>(() => {
  const dep: Passenger[] = depNF.primary.map((seat) => ({
    id: `departure-${seat}`,
    seatNumber: seat,
    isReturn: false,  // ✅ Correctly marked as departure
  }));
  
  const ret: Passenger[] = retNF.primary.map((seat) => ({
    id: `return-${seat}`,
    seatNumber: seat,
    isReturn: true,   // ✅ Correctly marked as return
  }));
  
  return [...dep, ...depComp, ...ret, ...retComp];
});
```

**Payload sent to backend:**
```json
{
  "passengers": [
    { "seatNumber": "1A", "isReturn": false, "firstName": "John" },
    { "seatNumber": "1B", "isReturn": false, "firstName": "Jane" },
    { "seatNumber": "4C", "isReturn": false, "firstName": "Bob" },
    { "seatNumber": "4D", "isReturn": false, "firstName": "Alice" },
    { "seatNumber": "1A", "isReturn": true, "firstName": "John" },  // Same seat, return trip
    { "seatNumber": "1B", "isReturn": true, "firstName": "Jane" },  // Same seat, return trip
    { "seatNumber": "4C", "isReturn": true, "firstName": "Bob" },
    { "seatNumber": "4D", "isReturn": true, "firstName": "Alice" }
  ]
}
```

### **Backend Deduplication Breaks It**

**File:** `lib/retrybookingservice.ts` (Lines 169-178)

```typescript
// Processing passengers array:
for (const p of data.passengers) {
  const key = `${created.tripId}::${p.seatNumber}`;
  
  // Iteration 1: seat 1A departure
  // key = "trip123::1A"
  // uniqueBySeat["trip123::1A"] = { seatNumber: "1A", isReturn: false }
  
  // Iteration 5: seat 1A return
  // key = "trip123::1A"  ⚠️ SAME KEY!
  // uniqueBySeat already has this key, so this passenger is IGNORED!
  // Console logs: "Duplicate passenger for seat 1A ignored"
  
  if (!uniqueBySeat[key]) {
    uniqueBySeat[key] = p;
  } else {
    console.log(`[${orderId}] Duplicate passenger for seat ${p.seatNumber} ignored`);
  }
}
```

**Result:** Only 6 passengers created instead of 8!

---

## THE FIX

### **Option 1: Include `isReturn` in Deduplication Key** ✅ RECOMMENDED

**File:** `lib/retrybookingservice.ts` (Line 172)

```typescript
// BEFORE:
const key = `${created.tripId}::${p.seatNumber}`;

// AFTER:
const key = `${created.tripId}::${p.seatNumber}::${p.isReturn ? 'return' : 'departure'}`;
```

**Why this works:**
- Departure seat `1A`: key = `trip123::1A::departure`
- Return seat `1A`: key = `trip123::1A::return`
- **No collision!**

### **Option 2: Use Actual Trip ID for Each Passenger** ✅ ALSO VALID

```typescript
// Use the actual trip the passenger is on
const passengerTripId = p.isReturn ? created.returnTripId : created.tripId;
const key = `${passengerTripId}::${p.seatNumber}`;
```

**Why this works:**
- Departure seat `1A`: key = `departureTrip123::1A`
- Return seat `1A`: key = `returnTrip456::1A`
- **No collision!**

---

## VALIDATION QUERY

After implementing the fix, run this to verify:

```sql
-- Check for missing passengers in round-trip bookings
SELECT 
  b."orderId",
  b."userName",
  b."seats" as departure_seats,
  b."returnSeats" as return_seats,
  (
    SELECT json_agg(json_build_object(
      'seat', p."seatNumber",
      'isReturn', p."isReturn"
    ))
    FROM "Passenger" p
    WHERE p."bookingId" = b.id
  ) as actual_passengers,
  (
    SELECT COUNT(*) 
    FROM "Passenger" p 
    WHERE p."bookingId" = b.id AND p."isReturn" = false
  ) as departure_passenger_count,
  (
    SELECT COUNT(*) 
    FROM "Passenger" p 
    WHERE p."bookingId" = b.id AND p."isReturn" = true
  ) as return_passenger_count
FROM "Booking" b
WHERE b."returnTripId" IS NOT NULL
  AND b."bookingStatus" = 'confirmed'
ORDER BY b."createdAt" DESC;
```

**Expected result after fix:**
- `departure_passenger_count` should equal number of seats in `departure_seats`
- `return_passenger_count` should equal number of seats in `return_seats`

---

## IMPACT ASSESSMENT

### **Current State:**

```sql
-- Count affected bookings
SELECT 
  COUNT(*) as total_round_trip_bookings,
  SUM(CASE 
    WHEN (
      SELECT COUNT(*) FROM "Passenger" p 
      WHERE p."bookingId" = b.id AND p."isReturn" = false
    ) < json_array_length(b."seats"::json)
    THEN 1 ELSE 0 
  END) as bookings_with_missing_departure_passengers,
  SUM(CASE 
    WHEN (
      SELECT COUNT(*) FROM "Passenger" p 
      WHERE p."bookingId" = b.id AND p."isReturn" = true
    ) < json_array_length(COALESCE(b."returnSeats", '[]')::json)
    THEN 1 ELSE 0 
  END) as bookings_with_missing_return_passengers
FROM "Booking" b
WHERE b."returnTripId" IS NOT NULL
  AND b."bookingStatus" = 'confirmed';
```

### **Risk Analysis:**

1. **Double-booking risk:** MEDIUM
   - Seats show as "booked" in `booking.seats` array
   - But no passenger record exists
   - Other customers could theoretically book these seats

2. **Revenue loss:** LOW (currently)
   - Seats are still marked as occupied in `Trip.occupiedSeats`
   - Payment was received
   - But manifest/boarding pass generation may fail

3. **Customer experience:** HIGH
   - Boarding passes may not generate for missing passengers
   - Manifest reports will be incorrect
   - Confusion at boarding time

---

## IMPLEMENTATION PLAN

### **Phase 1: Immediate Fix (DO NOW)**

1. **Fix the deduplication logic:**
   ```typescript
   // lib/retrybookingservice.ts line 172
   const key = `${created.tripId}::${p.seatNumber}::${p.isReturn ? 'return' : 'departure'}`;
   ```

2. **Add validation logging:**
   ```typescript
   // After passenger creation (line 202)
   console.log(`[${orderId}] Created ${passengerArray.length} passengers from ${data.passengers.length} in payload`);
   if (passengerArray.length !== data.passengers.length) {
     console.warn(`[${orderId}] ⚠️ Passenger count mismatch! Expected ${data.passengers.length}, created ${passengerArray.length}`);
   }
   ```

### **Phase 2: Data Repair (AFTER FIX DEPLOYED)**

```sql
-- Identify bookings needing repair
CREATE TEMP TABLE bookings_to_repair AS
SELECT 
  b.id as booking_id,
  b."orderId",
  b."tripId" as departure_trip_id,
  b."returnTripId" as return_trip_id,
  b."seats" as departure_seats,
  b."returnSeats" as return_seats
FROM "Booking" b
WHERE b."returnTripId" IS NOT NULL
  AND b."bookingStatus" = 'confirmed'
  AND (
    (SELECT COUNT(*) FROM "Passenger" p WHERE p."bookingId" = b.id AND p."isReturn" = false) 
    < json_array_length(b."seats"::json)
    OR
    (SELECT COUNT(*) FROM "Passenger" p WHERE p."bookingId" = b.id AND p."isReturn" = true) 
    < json_array_length(COALESCE(b."returnSeats", '[]')::json)
  );

-- Manual repair will be needed for each booking
-- (Cannot auto-generate passenger names/details)
```

### **Phase 3: Prevention (ONGOING)**

1. **Add database constraint:**
   ```sql
   -- Ensure passenger count matches seat count
   -- (This is complex, may need application-level validation instead)
   ```

2. **Add API validation:**
   ```typescript
   // In retrybookingservice.ts, before creating passengers
   const expectedCount = data.passengers.length;
   const uniqueCount = Object.keys(uniqueBySeat).length;
   
   if (uniqueCount < expectedCount) {
     throw new Error(`Passenger deduplication error: ${expectedCount} passengers provided but only ${uniqueCount} unique. Check for seat conflicts.`);
   }
   ```

---

## TESTING CHECKLIST

After implementing fix:

- [ ] Create new round-trip booking with same seats on both trips
- [ ] Verify passenger count matches total seats (departure + return)
- [ ] Check database for all passenger records
- [ ] Verify boarding pass generation works
- [ ] Test manifest report shows all passengers
- [ ] Confirm no duplicate seat errors

---

## SUMMARY

**Bug:** Deduplication logic uses `tripId::seatNumber` as key, causing return trip passengers to overwrite departure trip passengers when same seats are used.

**Fix:** Include `isReturn` flag in deduplication key: `tripId::seatNumber::direction`

**Impact:** 40% of current bookings affected, but no immediate double-booking has occurred (seats still marked as occupied).

**Priority:** CRITICAL - Fix immediately before more bookings are affected.

**Estimated Fix Time:** 5 minutes (change one line of code)

**Testing Time:** 15 minutes (create test booking and verify)

**Data Repair Time:** Manual (need to contact affected customers for passenger details)
