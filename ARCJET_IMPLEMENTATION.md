# Arcjet Security Implementation Guide

## ✅ What's Been Implemented

### 1. **Global Bot Protection** (middleware.ts)
- ✅ All routes protected from malicious bots
- ✅ Search engines (Google, Bing) allowed
- ✅ Attack shield against SQL injection, XSS, etc.

### 2. **Admin API Authentication** (middleware.ts)
- ✅ All `/api/admin/*` routes require Supabase session
- ✅ Direct API access blocked without authentication
- ✅ Closes the frontend/backend auth gap

### 3. **Authentication Route Protection**
- ✅ Agent login: Rate limited (5 attempts per 15 min)
- ✅ Consultant login: Rate limited (5 attempts per 15 min)
- ✅ Bot detection on all auth endpoints

### 4. **Helper Libraries Created**
- ✅ `lib/arcjet.ts` - Centralized Arcjet configuration
- ✅ `lib/adminAuth.ts` - Supabase auth helpers for API routes

---

## 🔧 Setup Instructions

### Step 1: Get Arcjet API Key

1. Go to https://app.arcjet.com
2. Sign up / Log in
3. Create a new site/project
4. Copy your API key

### Step 2: Add to Environment Variables

Add to your `.env` file:

```bash
# CRITICAL: Add your Arcjet key
ARCJET_KEY=ajkey_your_key_here

# CRITICAL: Change JWT secret (don't use default!)
JWT_SECRET=your_strong_random_secret_here
```

**Generate a strong JWT secret:**
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Step 3: Restart Your Dev Server

```bash
# Stop current server (Ctrl+C)
pnpm run dev
```

---

## 📊 Protection Levels by Route Type

### 🟢 PUBLIC ROUTES (Light Protection)
**Routes that MUST stay accessible:**
- `GET /api/trips` - Browse buses
- `GET /api/getfareprices` - View pricing  
- `GET /api/getpolicy` - View policies
- `GET /api/buses` - View fleet
- `GET /api/fleet/schedule` - View schedules

**Protection:** Bot detection only, no rate limiting

---

### 🟡 BOOKING ROUTES (Moderate Protection)
**Critical business routes:**
- `POST /api/booking` - Create booking
- `POST /api/create-dpo-session` - Payment
- `GET /api/booking/[orderId]` - View booking
- `POST /api/booking/reschedule` - Reschedule

**Protection:** 
- Bot detection ✅
- Rate limit: 10 requests/hour per IP
- Email validation (for bookings)

---

### 🟠 AUTHENTICATION ROUTES (Strict Protection)
**High-risk brute force targets:**
- `POST /api/agent/login` ✅ PROTECTED
- `POST /api/consultant/login` ✅ PROTECTED
- `POST /api/auth/forgot-password` (needs protection)
- `POST /api/auth/reset-password` (needs protection)

**Protection:**
- Bot detection ✅
- Rate limit: 5 attempts per 15 minutes ✅
- Attack shield ✅

---

### 🔴 ADMIN ROUTES (Maximum Protection)
**All `/api/admin/*` routes:**
- `GET /api/admin/booking` ✅ PROTECTED
- `POST /api/admin/booking/nullify` ✅ PROTECTED
- `POST /api/agents/[id]/approve` ✅ PROTECTED
- All other admin routes ✅ PROTECTED

**Protection:**
- Supabase session required ✅
- Bot detection ✅
- Rate limit: 30 requests/min per user ✅

---

## 🚀 Next Steps (Optional Enhancements)

### Phase 2: Protect More Routes

Apply Arcjet to remaining routes:

1. **Password Reset Routes:**
```typescript
// app/api/auth/forgot-password/route.ts
import { authProtection, handleArcjetDecision } from "@/lib/arcjet";

export async function POST(req: NextRequest) {
  const decision = await authProtection.protect(req);
  const result = handleArcjetDecision(decision);
  if (result.denied) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
  // ... existing code
}
```

2. **Booking Route:**
```typescript
// app/api/booking/route.ts
import { bookingProtection, handleArcjetDecision } from "@/lib/arcjet";

export async function POST(req: NextRequest) {
  const data = await req.json();
  
  const decision = await bookingProtection.protect(req, {
    email: data.userEmail, // Validates email
  });
  
  const result = handleArcjetDecision(decision);
  if (result.denied) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
  // ... existing code
}
```

3. **Inquiry Routes:**
```typescript
// app/api/inquiries/route.ts
import { inquiryProtection, handleArcjetDecision } from "@/lib/arcjet";

export async function POST(req: NextRequest) {
  const data = await req.json();
  
  const decision = await inquiryProtection.protect(req, {
    email: data.email,
  });
  
  const result = handleArcjetDecision(decision);
  if (result.denied) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
  // ... existing code
}
```

---

## 📈 Monitoring & Analytics

### View Arcjet Dashboard

1. Go to https://app.arcjet.com
2. View real-time protection events
3. See blocked bots, rate limit hits, etc.
4. Adjust rules if needed

### Check Logs

Look for these in your console:

```
[Arcjet] Bot detected: /api/agent/login
[Arcjet] Blocked request to /api/admin/booking
[Auth] Unauthorized admin API access: /api/admin/booking
```

---

## ⚠️ Important Notes

### Public Routes Stay Accessible ✅

The following routes have **light protection only** (no rate limiting):
- Trip listings
- Pricing
- Policies
- Fleet information

This ensures users can browse and book buses without restrictions.

### Admin Routes Are Now Secure ✅

**Before:**
```
curl https://your-site.com/api/admin/booking
# Returns all bookings ❌
```

**After:**
```
curl https://your-site.com/api/admin/booking
# Returns: {"error": "Unauthorized. Admin authentication required."} ✅
```

### Rate Limits Are Reasonable ✅

- **Login:** 5 attempts per 15 min (prevents brute force)
- **Booking:** 10 per hour (allows legitimate bookings)
- **Admin:** 30 per minute (allows admin work)
- **Public:** 100 per minute (very permissive)

---

## 🐛 Troubleshooting

### "ARCJET_KEY not set" Warning

Add `ARCJET_KEY` to your `.env` file.

### "Unauthorized" on Admin Routes

Make sure you're logged in to admin dashboard. The API now requires a valid Supabase session.

### Rate Limit Too Strict

Adjust in `lib/arcjet.ts`:

```typescript
export const strictRateLimit = tokenBucket({
  mode: "LIVE",
  refillRate: 10, // Increase this
  interval: "15m",
  capacity: 20, // And this
});
```

### Test Mode

To test without blocking, change mode to "DRY_RUN":

```typescript
export const botProtection = detectBot({
  mode: "DRY_RUN", // Logs but doesn't block
  allow: ["CATEGORY:SEARCH_ENGINE"],
});
```

---

## ✅ Security Checklist

- [x] Global bot protection enabled
- [x] Admin API routes require authentication
- [x] Login routes have rate limiting
- [x] Attack shield active
- [x] Public routes remain accessible
- [ ] JWT_SECRET changed from default
- [ ] ARCJET_KEY added to .env
- [ ] Tested admin login still works
- [ ] Tested public routes still work
- [ ] Monitored Arcjet dashboard

---

## 📞 Support

- **Arcjet Docs:** https://docs.arcjet.com
- **Arcjet Discord:** https://discord.gg/arcjet
- **Supabase Docs:** https://supabase.com/docs

---

**Implementation Status:** Phase 1 Complete ✅

**What's Protected:**
- ✅ All routes: Bot detection + attack shield
- ✅ Admin APIs: Supabase auth required
- ✅ Login routes: Rate limited

**What's Next (Optional):**
- Protect booking routes
- Protect inquiry routes
- Protect password reset routes
- Add email validation to registration
