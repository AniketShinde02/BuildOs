import { NextResponse } from 'next/server';
import { cookies } from "next/headers";
import { adminAuth } from "@/utils/firebase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("buildos-token")?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    const POSTIZ_FRONTEND_URL = process.env.POSTIZ_FRONTEND_URL || "http://localhost:5000";
    
    // Construct native Postiz OAuth integration redirect url with user context and provider target
    const targetPlatform = platform.toLowerCase();
    const postizOauthUrl = `${POSTIZ_FRONTEND_URL}/settings/integrations?connect=${encodeURIComponent(targetPlatform)}&userId=${encodeURIComponent(userId)}`;

    return NextResponse.redirect(postizOauthUrl, { status: 302 });
  } catch (error: any) {
    console.error(`[Postiz OAuth Router] Error initiating OAuth for platform:`, error);
    return NextResponse.json(
      { error: "Failed to initiate Postiz OAuth connection pipeline.", details: error.message }, 
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params;
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("buildos-token")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    const POSTIZ_FRONTEND_URL = process.env.POSTIZ_FRONTEND_URL || "http://localhost:5000";
    const targetPlatform = platform.toLowerCase();
    const postizOauthUrl = `${POSTIZ_FRONTEND_URL}/settings/integrations?connect=${encodeURIComponent(targetPlatform)}&userId=${encodeURIComponent(userId)}`;

    return NextResponse.json({
      success: true,
      platform: targetPlatform,
      oauthUrl: postizOauthUrl,
      message: `Initiating native Postiz OAuth broker for ${targetPlatform}`
    });
  } catch (error: any) {
    console.error(`[Postiz OAuth Router] Error generating OAuth payload:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
