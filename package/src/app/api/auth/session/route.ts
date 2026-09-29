import { NextResponse } from 'next/server';
import { adminAuth } from '@/utils/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 401 });
    }

    // Verify the token is valid
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Single-tenant / Whitelisted Security Enforcment
    const allowedUsers = process.env.ALLOWED_EMAILS?.split(",").map(e => e.trim());
    if (allowedUsers && allowedUsers.length > 0 && decodedToken.email) {
      if (!allowedUsers.includes(decodedToken.email)) {
        return NextResponse.json({ error: 'Unauthorized: This is a private BuildOS instance.' }, { status: 403 });
      }
    }

    const cookieStore = await cookies();
    // Store the raw idToken. The client must call this endpoint to refresh
    // before the 1-hour expiry using auth.currentUser.getIdToken(true).
    // Cookie maxAge is 5 days, but the token inside expires in 1 hour.
    // The layout will catch expired tokens and set a 401 — the client
    // intercepts this via the AuthRefresher component and re-mints.
    cookieStore.set('buildos-token', idToken, {
      maxAge: 60 * 60, // 1 hour — match token expiry to force client refresh
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({ success: true, uid: decodedToken.uid });
  } catch (error: any) {
    console.error('Session Error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
