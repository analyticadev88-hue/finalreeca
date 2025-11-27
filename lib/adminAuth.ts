// lib/adminAuth.ts - Supabase authentication for admin API routes
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * Verify admin authentication using Supabase session
 * Throws error if not authenticated
 */
export async function requireAdminAuth(req: NextRequest) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        throw new Error('UNAUTHORIZED');
    }

    return {
        session,
        supabase,
        user: session.user
    };
}

/**
 * Check if user is authenticated (returns boolean, doesn't throw)
 */
export async function isAdminAuthenticated(req: NextRequest): Promise<boolean> {
    try {
        await requireAdminAuth(req);
        return true;
    } catch {
        return false;
    }
}
