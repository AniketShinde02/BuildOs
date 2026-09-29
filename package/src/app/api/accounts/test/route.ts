import { NextResponse } from 'next/server';
import { cookies } from "next/headers";
import { adminAuth } from "@/utils/firebase-admin";
import { PublisherFactory } from "@/lib/publishers/PublisherFactory";
import { BuildOSError } from "@/lib/errors/BuildOSError";

// Live active probe endpoint: executes real authenticated API validation and persists latency diagnostics
export async function POST(req: Request) {
  const probeStartTime = Date.now();
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("buildos-token")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { platform } = body;

    if (!platform) {
      const err = new BuildOSError({
        message: "Target platform missing in test payload.",
        source: "Adapter",
        rootCause: "No provider ID specified for live health probe.",
        suggestedFix: "Select a provider card in Connection Center to run live tests.",
        retryOption: false,
        endpoint: "/api/accounts/test"
      });
      return NextResponse.json({ error: err.toJSON() }, { status: 400 });
    }

    const adapter = await PublisherFactory.getAdapterAsync(userId, sessionCookie, platform, false);
    if (!adapter) {
      const err = new BuildOSError({
        message: `Connection not verified: No active adapter or tokens for ${platform}.`,
        source: "OAuth",
        adapter: platform,
        rootCause: `No valid access token or API configuration found in user profile or environment for ${platform}.`,
        suggestedFix: "Click Reconnect to initialize OAuth 2.0 verification before running live probes.",
        retryOption: false,
        endpoint: "/api/accounts/test"
      });
      return NextResponse.json({ error: err.toJSON(), latencyMs: Date.now() - probeStartTime }, { status: 404 });
    }

    // Execute authenticated test call against actual platform network endpoints
    const evalStart = Date.now();
    const healthResult = await adapter.checkHealth();
    const latencyMs = Date.now() - evalStart;

    const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
    const docUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Users/${userId}/Connections/${platform}?updateMask.fieldPaths=health&updateMask.fieldPaths=latencyMs&updateMask.fieldPaths=lastSync`;

    // Persist verified live test results to Firestore cache
    try {
      await fetch(docUrl, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${sessionCookie}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            health: { stringValue: healthResult.status === "healthy" ? "healthy" : "error" },
            latencyMs: { integerValue: latencyMs },
            lastSync: { stringValue: new Date().toISOString() }
          }
        })
      });
    } catch (e) {
      console.warn("Failed to update cache after live probe:", e);
    }

    return NextResponse.json({
      success: healthResult.status === "healthy",
      platform,
      adapter: adapter.name,
      status: healthResult.status,
      message: healthResult.message || "Live API validation successful.",
      latencyMs,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Live health probe exception:", error);
    const diagnostic = BuildOSError.fromError(error, "Network", {
      endpoint: "/api/accounts/test",
      suggestedFix: "Verify external internet connectivity and API service status."
    });
    return NextResponse.json({ error: diagnostic.toJSON(), latencyMs: Date.now() - probeStartTime }, { status: 500 });
  }
}
