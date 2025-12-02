# 🔐 FORGOT PASSWORD SYSTEM ANALYSIS

**Date:** 2025-12-02  
**Status:** ⚠️ **NEEDS FIXING**

---

## ✅ **What's Already Built:**

1. ✅ **Email Template:** `email-templates/PasswordResetEmail.tsx` - Beautiful, professional
2. ✅ **API Routes:**
   - `/api/auth/forgot-password` - Sends reset email via Resend
   - `/api/auth/reset-password` - Updates password with JWT token
3. ✅ **Reset Password Page:** `app/reset-password/page.tsx` - Working UI

---

## ❌ **The Problem:**

All login pages (`admin`, `agent`, `consultant`) are using **Supabase's password reset** instead of your **custom API**:

```tsx
// CURRENT (WRONG):
const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
```

**This won't work because:**
- Your users are in **Prisma database** (Agent, Consultant tables)
- Supabase auth is only for admin users
- The custom `/api/auth/forgot-password` route is NOT being called

---

## 🛠️ **The Fix:**

Change all login pages to call **your custom API**:

```tsx
// NEW (CORRECT):
const res = await fetch('/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: forgotEmail })
});
```

---

## 📝 **Files to Update:**

1. ❌ `app/admin/login/page.tsx` (Line 219) - Uses Supabase
2. ❌ `app/agent/auth/page.tsx` - Uses Supabase  
3. ❌ `app/consultant/auth/page.tsx` - Uses Supabase

---

## ✅ **Environment Variables Needed:**

Check `.env.local` has:
```env
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_BASE_URL=https://yoursite.com (or http://localhost:3000)
JWT_SECRET=your-secret-key-here (CHANGE IN PRODUCTION!)
```

---

## 🎯 **Testing Plan:**

After fixes:
1. Go to admin/agent/consultant login
2. Click "Forgot password?"
3. Enter email
4. Check:
   - ✅ Success message appears
   - ✅ Email arrives in inbox
   - ✅ Reset link works (`/reset-password?token=...`)
   - ✅ Can set new password
   - ✅ Can login with new password

---

## 🚨 **Security Notes:**

1. ✅ **Arcjet protection** on forgot-password route (bot detection + rate limiting)
2. ✅ **JWT tokens expire in 1 hour**
3. ✅ **Resend email from:** `passwordreset@reecatravel.co.bw`
4. ⚠️ **JWT_SECRET** = "topo123" - **MUST CHANGE IN PRODUCTION!**

---

**Next Step:** Update all 3 login pages to use custom API instead of Supabase.
