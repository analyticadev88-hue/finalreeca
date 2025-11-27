// lib/arcjet.ts - Centralized Arcjet configuration
import arcjet, {
    tokenBucket,
    shield,
    detectBot,
    validateEmail,
    ArcjetDecision
} from "@arcjet/next";

// Get Arcjet key from environment
const ARCJET_KEY = process.env.ARCJET_KEY!;

if (!ARCJET_KEY) {
    console.warn("⚠️ ARCJET_KEY not set - Arcjet protection disabled");
}

// ============================================================================
// SHARED RULES
// ============================================================================

// Bot protection - allow search engines but block malicious bots
export const botProtection = detectBot({
    mode: "LIVE",
    allow: [
        "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc.
    ],
});

// Shield against common attacks (SQL injection, XSS, etc.)
export const attackShield = shield({
    mode: "LIVE",
});

// Email validation for user inputs
export const emailValidation = validateEmail({
    mode: "LIVE",
    block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
});

// ============================================================================
// RATE LIMIT CONFIGURATIONS
// ============================================================================

// STRICT: For authentication endpoints (prevent brute force)
export const strictRateLimit = tokenBucket({
    mode: "LIVE",
    refillRate: 5, // 5 attempts
    interval: "15m", // per 15 minutes
    capacity: 10, // burst capacity
});

// MODERATE: For booking and business operations
export const moderateRateLimit = tokenBucket({
    mode: "LIVE",
    refillRate: 10, // 10 requests
    interval: "1h", // per hour
    capacity: 20, // burst capacity
});

// ADMIN: For admin operations (higher limit for legitimate admin use)
export const adminRateLimit = tokenBucket({
    mode: "LIVE",
    refillRate: 30, // 30 requests
    interval: "1m", // per minute
    capacity: 50, // burst capacity
});

// LIGHT: For public routes (very permissive, just prevent abuse)
export const lightRateLimit = tokenBucket({
    mode: "LIVE",
    refillRate: 100, // 100 requests
    interval: "1m", // per minute
    capacity: 200, // burst capacity
});

// ============================================================================
// PRECONFIGURED ARCJET INSTANCES
// ============================================================================

// For public routes (trip listings, pricing, policy)
export const publicProtection = arcjet({
    key: ARCJET_KEY,
    rules: [
        botProtection,
        attackShield,
        lightRateLimit,
    ],
});

// For booking routes
export const bookingProtection = arcjet({
    key: ARCJET_KEY,
    rules: [
        botProtection,
        attackShield,
        emailValidation,
        moderateRateLimit,
    ],
});

// For authentication routes (login, register, password reset)
// Note: Email validation removed - not needed for login
export const authProtection = arcjet({
    key: ARCJET_KEY,
    rules: [
        botProtection,
        attackShield,
        strictRateLimit,
    ],
});

// For admin routes (requires Supabase auth + rate limiting)
export const adminProtection = arcjet({
    key: ARCJET_KEY,
    rules: [
        botProtection,
        attackShield,
        adminRateLimit,
    ],
});

// For inquiry/charter routes
export const inquiryProtection = arcjet({
    key: ARCJET_KEY,
    rules: [
        botProtection,
        attackShield,
        emailValidation,
        moderateRateLimit,
    ],
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if Arcjet decision is denied and return appropriate error response
 */
export function handleArcjetDecision(decision: ArcjetDecision) {
    if (decision.isDenied()) {
        // Bot detected
        if (decision.reason.isBot()) {
            return {
                denied: true,
                status: 403,
                message: "Bot detected. If you believe this is an error, please contact support.",
            };
        }

        // Rate limit exceeded
        if (decision.reason.isRateLimit()) {
            return {
                denied: true,
                status: 429,
                message: "Too many requests. Please try again later.",
            };
        }

        // Email validation failed
        if (decision.reason.isEmail()) {
            return {
                denied: true,
                status: 400,
                message: "Invalid or disposable email address. Please use a valid email.",
            };
        }

        // Shield detected attack
        if (decision.reason.isShield()) {
            return {
                denied: true,
                status: 403,
                message: "Request blocked for security reasons.",
            };
        }

        // Generic denial
        return {
            denied: true,
            status: 403,
            message: "Request denied.",
        };
    }

    return { denied: false };
}

/**
 * Log Arcjet decision for monitoring
 */
export function logArcjetDecision(decision: ArcjetDecision, route: string) {
    if (decision.isDenied()) {
        console.warn(`[Arcjet] Blocked request to ${route}:`, {
            reason: decision.reason,
            ip: decision.ip,
            timestamp: new Date().toISOString(),
        });
    }
}
