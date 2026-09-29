import { NextResponse } from 'next/server';
import { adminAuth } from "@/utils/firebase-admin";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      return NextResponse.redirect(new URL(`/accounts?error=${encodeURIComponent(errorDescription || error)}`, req.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/accounts?error=No+code+provided', req.url));
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/auth/linkedin/callback`;

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/accounts?error=Missing+LinkedIn+Client+Credentials', req.url));
    }

    // Exchange code for token
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      })
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.json();
      return NextResponse.redirect(new URL(`/accounts?error=${encodeURIComponent(errData.error_description || "Token exchange failed")}`, req.url));
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    
    // Auth Check
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("buildos-token")?.value;
    if (!sessionCookie) return NextResponse.redirect(new URL('/authentication/login', req.url));
    
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    // Save token to Firestore securely via REST API
    const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Users/${userId}/Connections/linkedin`;
    
    const docPayload = {
      fields: {
        platform: { stringValue: "LinkedIn" },
        accessToken: { stringValue: accessToken },
        expiresIn: { integerValue: tokenData.expires_in },
        connectedAt: { stringValue: new Date().toISOString() },
        status: { stringValue: "healthy" }
      }
    };

    const res = await fetch(url, {
      method: "PATCH", 
      headers: { 
        Authorization: `Bearer ${sessionCookie}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(docPayload)
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error("LinkedIn save connection error:", errorText);
      throw new Error("Failed to save LinkedIn connection to database");
    }

    return NextResponse.redirect(new URL('/accounts?success=LinkedIn+Connected', req.url));
  } catch (error: any) {
    console.error("LinkedIn OAuth Error:", error);
    return NextResponse.redirect(new URL('/accounts?error=Internal+Server+Error', req.url));
  }
}
