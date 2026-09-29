import { NextResponse } from 'next/server';
import { adminAuth } from "@/utils/firebase-admin";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("buildos-token")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    const { platform, apiKey, apiUrl } = await req.json();

    if (!platform || !apiKey) {
      return NextResponse.json({ error: "Platform and API Key are required" }, { status: 400 });
    }

    // Save connection securely to Firestore via REST API
    const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Users/${userId}/Connections/${platform.toLowerCase()}`;
    
    const fields: Record<string, any> = {
      platform: { stringValue: platform },
      apiKey: { stringValue: apiKey },
      connectedAt: { stringValue: new Date().toISOString() },
      status: { stringValue: "healthy" },
    };

    if (apiUrl) {
      fields.apiUrl = { stringValue: apiUrl };
    }

    const docPayload = { fields };

    const res = await fetch(url, {
      method: "PATCH",
      headers: { 
        Authorization: `Bearer ${sessionCookie}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(docPayload)
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown Firestore error");
      console.error("Firestore save failure:", errorText);
      throw new Error(`Failed to save connection to database: ${res.statusText || errorText}`);
    }

    return NextResponse.json({ success: true, message: `Connected to ${platform}` });
  } catch (error: any) {
    console.error("Error saving connection:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
