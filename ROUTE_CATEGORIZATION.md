# API Route Security Categorization

## 🟢 PUBLIC ROUTES (Light Protection - Must Stay Accessible)
These routes are needed for users to browse and book buses:

- `GET /api/trips` - Browse available buses ✅ PUBLIC
- `GET /api/buses` - View bus fleet ✅ PUBLIC
- `GET /api/getfareprices` - View pricing ✅ PUBLIC
- `GET /api/getpolicy` - View policies ✅ PUBLIC
- `GET /api/health` - Health check ✅ PUBLIC
- `GET /api/fleet` - View fleet info ✅ PUBLIC
- `GET /api/fleet/schedule` - View schedules ✅ PUBLIC

**Protection:** Bot detection only, no rate limiting

---

## 🟡 BOOKING ROUTES (Moderate Protection)
Critical for business but must allow legitimate bookings:

- `POST /api/booking` - Create booking 🔒 MODERATE
- `GET /api/booking/[orderId]` - View booking 🔒 MODERATE
- `POST /api/booking/[orderId]/update-payment-status` - Update payment 🔒 MODERATE
- `GET /api/booking/check/[orderId]` - Check booking 🔒 MODERATE
- `POST /api/booking/lookup` - Lookup booking 🔒 MODERATE
- `POST /api/booking/reschedule` - Reschedule booking 🔒 MODERATE
- `POST /api/booking/addons` - Add booking addons 🔒 MODERATE
- `POST /api/create-dpo-session` - Payment session 🔒 MODERATE
- `GET /api/dpo-verify-payment` - Verify payment 🔒 MODERATE

**Protection:** Bot detection + moderate rate limiting (10-20 req/hour per IP)

---

## 🟠 AUTHENTICATION ROUTES (Strict Protection)
High risk for brute force attacks:

- `POST /api/agent/login` - Agent login 🔒 STRICT
- `POST /api/agent/register` - Agent registration 🔒 STRICT
- `POST /api/agent/logout` - Agent logout 🔒 MODERATE
- `GET /api/agent/me` - Agent session 🔒 MODERATE
- `POST /api/consultant/login` - Consultant login 🔒 STRICT
- `POST /api/consultant/register` - Consultant registration 🔒 STRICT
- `POST /api/consultant/logout` - Consultant logout 🔒 MODERATE
- `GET /api/consultant/me` - Consultant session 🔒 MODERATE
- `POST /api/auth/forgot-password` - Password reset 🔒 STRICT
- `POST /api/auth/reset-password` - Password reset 🔒 STRICT

**Protection:** Bot detection + email validation + strict rate limiting (5 req/15min per IP)

---

## 🔴 ADMIN ROUTES (Maximum Protection + Auth Required)
Must verify Supabase session + strict rate limiting:

- `GET /api/admin/booking` - List all bookings 🔒 ADMIN
- `POST /api/admin/booking/nullify` - Cancel booking 🔒 ADMIN
- `GET /api/admin/fleet` - Fleet management 🔒 ADMIN
- `POST /api/trips` - Create trip 🔒 ADMIN
- `PUT /api/trips` - Update trip 🔒 ADMIN
- `DELETE /api/trips` - Delete trip 🔒 ADMIN
- `POST /api/agents/[id]/approve` - Approve agent 🔒 ADMIN
- `POST /api/agents/[id]/decline` - Decline agent 🔒 ADMIN
- `POST /api/agents/[id]/suspend` - Suspend agent 🔒 ADMIN
- `POST /api/agents/[id]/unsuspend` - Unsuspend agent 🔒 ADMIN
- `POST /api/agents/[id]/remove` - Remove agent 🔒 ADMIN
- `GET /api/agents/[id]/bookings` - Agent bookings 🔒 ADMIN
- `GET /api/agents/[id]/sales` - Agent sales 🔒 ADMIN
- `POST /api/consultants/[id]/approve` - Approve consultant 🔒 ADMIN
- `POST /api/consultants/[id]/decline` - Decline consultant 🔒 ADMIN
- All `/api/admin/*` routes 🔒 ADMIN

**Protection:** Supabase auth verification + bot detection + strict rate limiting (30 req/min per user)

---

## 🟣 INQUIRY/CHARTER ROUTES (Moderate Protection)
Business inquiries - prevent spam but allow legitimate requests:

- `POST /api/inquiries` - Submit inquiry 🔒 MODERATE
- `GET /api/inquiries` - List inquiries 🔒 MODERATE
- `POST /api/inquiries/[id]/status` - Update inquiry 🔒 MODERATE
- `POST /api/charters` - Create charter 🔒 MODERATE
- `POST /api/charters/[id]/generate-link` - Generate charter link 🔒 MODERATE
- `POST /api/charters/cancel` - Cancel charter 🔒 MODERATE

**Protection:** Bot detection + email validation + moderate rate limiting (5 req/hour per IP)

---

## Implementation Priority:

1. **Phase 1 (Critical):** Admin routes + Auth routes
2. **Phase 2 (Important):** Booking routes + Payment routes
3. **Phase 3 (Nice to have):** Inquiry routes
4. **Phase 4 (Monitor):** Public routes (bot detection only)
