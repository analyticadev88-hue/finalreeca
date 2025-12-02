# ✅ MANUAL FIX FOR SEAT SELECTION - SIMPLE & SAFE

**File:** `app/booking/seatselection.tsx`  
**Line:** 305  
**What to change:** Update the booking filter logic

---

## Current Code (Line 305):
```tsx
.filter((booking: any) => booking.bookingStatus === 'confirmed' && booking.paymentStatus === 'paid')
```

## New Code (Replace line 305 with this):
```tsx
.filter((booking: any) => {
  // Include ALL confirmed bookings (paid + pending) to prevent double bookings
  // Pending bookings stay blocked because bank deposits take days to verify
  return booking.bookingStatus === 'confirmed' && 
         (booking.paymentStatus === 'paid' || booking.paymentStatus === 'pending');
})
```

---

## That's It!

**Before:**
- Only `paid` bookings blocked seats
- Pending bookings (like RT167497) showed as available after 30 min

**After:**
- Both `paid` AND `pending` bookings block seats
- No more double bookings for bank deposits
- Admin should cancel invalid bookings (don't wait for auto-expiry)

---

## Test It:
1. Save the file
2. Refresh the seat selection page
3. Booking RT167497's seats `[4C, 4D, 1A, 1B]` should now be **blocked**

**That's the ONLY change needed!** 🎯
