// lib/adminAuth.ts - Server-side admin authentication helper
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function verifyAdminAuth() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: any) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        }
    );

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        return {
            authorized: false,
            response: NextResponse.json(
                { error: 'Unauthorized. Admin authentication required.' },
                { status: 401 }
            ),
        };
    }

    return {
        authorized: true,
        session,
        supabase,
    };
}

export async function requireAdminAuth(req: any) {
    const auth = await verifyAdminAuth();
    if (!auth.authorized) {
        throw new Error('UNAUTHORIZED');
    }
    return auth;
}
