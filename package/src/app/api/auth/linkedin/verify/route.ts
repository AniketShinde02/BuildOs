import { NextResponse } from 'next/server';
import { cookies } from "next/headers";
import { adminAuth } from "@/utils/firebase-admin";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("buildos-token")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // 1. Verify the token with a test call to LinkedIn
    const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });

    if (!meRes.ok) {
      return NextResponse.json({ error: "Invalid LinkedIn token. Test call failed." }, { status: 401 });
    }

    const meData = await meRes.json();
    
    // 2. Save to Firestore via REST API (document ID = userId)
    const updateUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/connected_accounts/${userId}`;
    await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${sessionCookie}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          linkedin: {
            mapValue: {
              fields: {
                accessToken: { stringValue: token },
                connectedAt: { stringValue: new Date().toISOString() },
                profileUrn: { stringValue: `urn:li:person:${meData.sub}` },
                name: { stringValue: meData.name || "LinkedIn User" },
              }
            }
          }
        }
      }),
    });

    return NextResponse.json({ success: true, profile: meData });

  } catch (error: any) {
    console.error("Error verifying LinkedIn token:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
