# Reeca Travel Booking App - Functionality Baseline

**Created:** April 8, 2026  
**Purpose:** Baseline documentation to verify functionality is not broken during design changes  
**File Reference:** `app/bookingapp.tsx` (901 lines)

---

## Core State Variables

| State | Type | Purpose |
|-------|------|---------|
| `currentStep` | enum: "search" \| "schedules" \| "departure-seats" \| "return-schedules" \| "return-seats" \| "passenger-details" | Controls which view is rendered |
| `searchData` | SearchData \| null | Stores search parameters (from, to, dates, seat count, isReturn) |
| `selectedDepartureBus` | any \| null | Selected bus for departure leg |
| `selectedReturnBus` | any \| null | Selected bus for return leg |
| `selectedDepartureSeats` | string[] | Array of selected departure seat IDs |
| `selectedReturnSeats` | string[] | Array of selected return seat IDs |
| `showPayment` | boolean | Controls payment modal visibility |
| `bookingComplete` | boolean | Triggers success screen |
| `showRequestForm` | boolean | Shows tour vehicle request form |
| `showHireModal` | boolean | Shows hire/coach booking modal |
| `agent` | {id, name, email} \| null | Logged-in agent info |
| `consultant` | {id, name, email} \| null | Logged-in consultant info |
| `departureNeighbourFree` | boolean | User opt-in: adjacent seats for departure |
| `returnNeighbourFree` | boolean | User opt-in: adjacent seats for return |
| `departurePassengerGroups` | PassengerGroup[] | Grouped seats for departure (primary + companion) |
| `returnPassengerGroups` | PassengerGroup[] | Grouped seats for return (primary + companion) |

---

## Key Handlers (Functions)

### `handleSearch(data)`
**Triggered:** When user submits booking form  
**Input:** `{from, to, date, returnDate?, seats}`  
**Actions:**
- Validates departure date (required)
- Validates return date (if provided)
- Creates SearchData object with normalized dates
- Sets `searchData` state
- Changes `currentStep` to "schedules"

### `handleSelectBus(bus, isReturnTrip)`
**Triggered:** When user clicks a bus in schedules list  
**Actions:**
- Sets `selectedDepartureBus` OR `selectedReturnBus` (depending on `isReturnTrip`)
- If `bus.isRequest` = true: shows RequestForm
- Else: advances to seat selection (`currentStep = "departure-seats"` or `"return-seats"`)

### `handleSeatSelect(seatId, isReturnTrip)`
**Triggered:** When user clicks a seat in seat selection view  
**Actions:**
- Toggles seat in array (add if not present, remove if present)
- Regenerates PassengerGroups based on `neighbourFree` setting
- Updates either `selectedDepartureSeats` or `selectedReturnSeats`

### `handleProceedToPassengerDetails()`
**Triggered:** After seat selection complete  
**Logic:**
- If return trip AND no return seats selected: go to `"return-schedules"`
- Else: go to `"passenger-details"`

### `handleProceedToPayment()`
**Triggered:** From passenger details form  
**Actions:** Sets `showPayment = true` (displays payment component)

### `handlePaymentComplete()`
**Triggered:** After successful payment  
**Actions:**
- Sets `showPayment = false`
- Sets `bookingComplete = true` (displays success screen)

### `handleRequestSubmit()`
**Triggered:** Tour vehicle request form submission  
**Actions:**
- Sets `showRequestForm = false`
- Sets `bookingComplete = true` (displays success screen)

### `handleLogout()`
**Triggered:** Agent/Consultant logout  
**Actions:**
- POST to `/api/agent/logout`
- POST to `/api/consultant/logout`
- Clears agent/consultant state
- Redirects to "/"

### Utility Functions

#### `parseDate(dateStr)` → Date
- Handles DD/MM/YYYY format or ISO string
- Returns new Date()

#### `isValidDate(date)` → boolean
- Validates date is valid number

#### `toDateObj(date)` → Date
- Converts any date format to Date object

#### `isAdjacent(seat1, seat2)` → boolean
- Checks if two seats are next to each other (A-B or C-D in same row)

#### `generatePassengerGroups(seats[], neighbourFree)` → PassengerGroup[]
- Groups selected seats into pairs if neighbourFree = true
- Returns array of single or paired seat groups

---

## Authentication Flow

**On Component Mount (useEffect):**
1. Fetches `/api/agent/me`
   - If OK: Sets `agent` state
   - If error: Sets `agent = null`
2. Fetches `/api/consultant/me`
   - If OK: Sets `consultant` state
   - If error: Sets `consultant = null`
3. Sets up "focus" event listener to re-fetch auth status

**Auth UI Indicators:**
- If `agent` exists: Shows yellow banner "Booking as Agent: {name}"
  - Has "Leave Booking" button → calls handleLogout()
- If `consultant` exists (and NO agent): Shows yellow banner "Booking as Consultant: {name}"
  - Has "Leave Booking" button → calls handleLogout()

---

## User Flows & Views

### 1. **Search Page** (`currentStep === "search"`)
**Components Visible:**
- Header (logo, nav links, theme toggle, user dropdown)
- Hero section (h1 "Travel in Comfort & Style" + image)
- Booking form card (tabbed: oneway/return/hire)
- Footer

**Actions:**
- User enters search criteria in BookingForm
- Calls `handleSearch()`
- Redirects to schedules view

### 2. **Schedules View** (`currentStep === "schedules"`)
**Components:**
- Back button → sets currentStep = "search"
- BusSchedules component (lists available buses)

**Actions:**
- User clicks a bus
- Calls `handleSelectBus(bus)`
- If `bus.isRequest` → shows RequestForm
- Else → goes to departure-seats

### 3. **Departure Seat Selection** (`currentStep === "departure-seats"`)
**Components:**
- Back button → sets currentStep = "schedules"
- SeatSelection component
- PassengerDetailsForm eventually

**Actions:**
- User selects seats
- Calls `handleSeatSelect(seatId, false, departureNeighbourFree)`
- When done: calls `handleProceedToPassengerDetails()`

### 4. **Return Schedules** (`currentStep === "return-schedules"`)
**Flow:** Same as schedules but for return trip
**Data:** From/to are swapped from original search

### 5. **Return Seat Selection** (`currentStep === "return-seats"`)
**Flow:** Same as departure seats but for return trip

### 6. **Passenger Details** (`currentStep === "passenger-details"`)
**Components:**
- PassengerDetailsForm
- Payment component (if `showPayment` = true)

**Actions:**
- User enters passenger info
- Calls `handleProceedToPayment()`
- Shows payment UI
- After payment: calls `handlePaymentComplete()`

### 7. **Success Screen** (`bookingComplete === true`)
**Display:**
- Green checkmark icon
- "Booking Confirmed!" or "Request Submitted!"
- Booking reference (random #RT...)
- "Book Another Trip" button → reloads page

### 8. **Request Form** (`showRequestForm === true` AND bus selected)
**Display:**
- Full page with header + RequestForm component
- Back button → closes form, goes to schedules

### 9. **Hire Modal** (`showHireModal === true`)
**Display:**
- HireBusModal component
- On submit: POSTs to `/api/inquiries`
- Shows success alert

---

## Conditional Renders (Priority Order)

1. **If `bookingComplete` = true** → Success screen
2. **Else if `showRequestForm` = true** → Request form page
3. **Else if `currentStep === "search"`** → Search/landing page
4. **Else** → Booking flow (header + step-based main content)

---

## API Calls

| Endpoint | Method | Trigger | Payload |
|----------|--------|---------|---------|
| `/api/agent/me` | GET | Component mount | - |
| `/api/consultant/me` | GET | Component mount | - |
| `/api/agent/logout` | POST | handleLogout() | - |
| `/api/consultant/logout` | POST | handleLogout() | - |
| `/api/inquiries` | POST | Hire modal submit | formData object |

---

## Key Behaviors to Preserve

### ✅ Booking Flow Progression
- Search → Schedules → Departure Seats → [Return Schedules → Return Seats] → Passenger Details → Payment → Success

### ✅ Seat Selection
- User can select multiple seats
- Seats toggle (click = add/remove)
- Adjacent seats optional (neighbourFree checkbox)
- Passenger groups auto-generated on selection

### ✅ Return Trip Logic
- Only shown if user selected return date
- Can skip if no return seats selected (goes directly to details)
- From/to swapped for return leg

### ✅ One-way vs Return
- `searchData.isReturn` bool controls availability of return flow
- If false: goes straight to passenger details after departure seats

### ✅ Tour Vehicle Requests
- Buses with `isRequest = true` show RequestForm instead of seat selection
- Different success message

### ✅ Authentication
- Agent/consultant status persists across page (shown in banner)
- Re-fetches on window focus (can update after login elsewhere)
- Logout clears both agent AND consultant

### ✅ Modals
- Hire modal: independent, can open from hero form
- Payment modal: appears when proceeding to payment step
- Both have close/back actions

### ✅ Navigation
- Back buttons throughout journey
- Theme toggle always visible (header)
- Nav links work (About, Fleet, Help, etc.)

---

## Critical Bug Prevention Checklist

When making design changes, verify these still work:

- [ ] Booking form submit triggers handleSearch with correct date parsing
- [ ] Seat selection toggles seats and regenerates passenger groups
- [ ] Back buttons correctly rewind state (`currentStep` changes)
- [ ] Return trip only appears if `searchData.isReturn === true`
- [ ] Success screen appears after `bookingComplete === true`
- [ ] Hire modal can be triggered and closed
- [ ] Agent/consultant logout works (both API calls execute)
- [ ] Payment flow doesn't skip to success without completion
- [ ] Request form shows for `bus.isRequest === true` buses
- [ ] Passenger groups correctly pair adjacent seats when neighbourFree enabled
- [ ] Page doesn't show conflicting states (e.g., hero + booking flow at same time)

---

## Design Change Impact Matrix

| Component Changed | Check These Functions | Check These States |
|---|---|---|
| Booking Form | handleSearch() | searchData, currentStep |
| Bus Schedule UI | handleSelectBus() | selectedDepartureBus, selectedReturnBus, currentStep |
| Seat Selection UI | handleSeatSelect() | selectedSeats, PassengerGroups |
| Passenger Form | handleProceedToPayment() | showPayment, bookingComplete |
| Header/Nav | handleLogout() | agent, consultant |
| Hero Section | handleSearch() | searchData goes to schedules |
| Modal | showHireModal state toggle | - |

---

## File Size & Structure

- **Total Lines:** 901
- **State declarations:** Lines 37-54 (18 states)
- **Utility functions:** Lines 56-98
- **Event handlers:** Lines 100-258
- **useEffect:** Lines 260-287
- **Conditional renders:** Lines 289-901

**Key conditional blocks:**
- `if (bookingComplete)` (289-337)
- `if (showRequestForm)` (339-387)
- `const NavLinks` (389-415)
- `if (currentStep === "search")` (417-600)
- `return` (booking flow) (602-901)

