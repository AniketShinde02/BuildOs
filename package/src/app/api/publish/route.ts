import { NextResponse } from 'next/server';
import { cookies, headers } from "next/headers";
import { adminAuth } from "@/utils/firebase-admin";
import { PublisherFactory } from "@/lib/publishers/PublisherFactory";
import { PublishPayload } from "@/lib/publishers/PublisherAdapter";
import { BuildOSError } from "@/lib/errors/BuildOSError";

export async function POST(req: Request) {
  const requestStartTime = Date.now();
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "unknown";
  
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("buildos-token")?.value;
    if (!sessionCookie) {
      const err = new BuildOSError({
        message: "Authentication session expired or missing.",
        source: "OAuth",
        rootCause: "No buildos-token cookie present in publication HTTP headers.",
        suggestedFix: "Re-authenticate on the login screen or check browser cookie policies.",
        retryOption: false,
        endpoint: "/api/publish",
      });
      return NextResponse.json({ error: err.toJSON() }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    const body = await req.json();
    const { draftId, text, imageUrl, imageUrls, platforms, stage = "Publishing" } = body;

    if (!draftId || !text || !platforms || platforms.length === 0) {
      const err = new BuildOSError({
        message: "Incomplete publication payload.",
        source: "PublishPipeline",
        rootCause: "Draft ID, content text, or platform selection is missing from payload.",
        suggestedFix: "Ensure all required draft fields and target channels are selected before executing publish.",
        retryOption: false,
        payload: body,
        endpoint: "/api/publish",
      });
      return NextResponse.json({ error: err.toJSON() }, { status: 400 });
    }

    const imagesToUpload = imageUrls && imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []);
    const results: any = {};
    let allFailed = true;

    for (const platform of platforms) {
      const adapter = await PublisherFactory.getAdapterAsync(userId, sessionCookie, platform);
      
      if (!adapter) {
        const adapterErr = new BuildOSError({
          message: `No publisher connection initialized for provider: ${platform}`,
          source: "Adapter",
          adapter: platform,
          rootCause: `Active access token or API credentials missing in user Firestore connection cache and environment for ${platform}.`,
          suggestedFix: "Navigate to Connection Center (/accounts), authorize OAuth tokens or configure API parameters, and test health.",
          retryOption: false,
          endpoint: "/api/publish",
        });
        results[platform] = {
          success: false,
          error: adapterErr.toJSON(),
        };
        continue;
      }

      const payload: PublishPayload = {
        text,
        mediaUrls: imagesToUpload,
        platform: platform as any,
        options: body.options,
      };

      const startTime = Date.now();
      let result = await adapter.publish(payload);
      let retries = 0;

      // Automatic Retry Handling (RC-3 SLA)
      if (!result.success && retries < 1) {
        retries += 1;
        result = await adapter.publish(payload);
      }
      const duration = Date.now() - startTime;

      // Rigorous Audit Log Persistence per RC-3 Mandate
      try {
        const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
        await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/PublishLogs`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionCookie}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              userId: { stringValue: userId },
              draftId: { stringValue: draftId },
              platform: { stringValue: platform },
              stage: { stringValue: stage },
              adapterName: { stringValue: adapter.name },
              success: { booleanValue: result.success },
              durationMs: { integerValue: duration },
              retriesCount: { integerValue: retries },
              requestHeaders: { stringValue: JSON.stringify({ "user-agent": userAgent }) },
              requestPayload: { stringValue: JSON.stringify(payload) },
              providerResponse: { stringValue: JSON.stringify((result as any).rawResponse || (result as any).data || result.postId || {}) },
              finalResult: { stringValue: result.success ? "Completed" : "Failed" },
              errorDiagnostic: { stringValue: result.error ? (typeof result.error === 'string' ? result.error : JSON.stringify(result.error)) : "" },
              timestamp: { stringValue: new Date().toISOString() }
            },
          }),
        });
      } catch (logErr) {
        console.error("Failed to persist comprehensive audit trail to PublishLogs:", logErr);
      }

      results[platform] = result;
      if (result.success) {
        allFailed = false;
      }
    }

    if (allFailed) {
      const totalDuration = Date.now() - requestStartTime;
      const criticalErr = new BuildOSError({
        message: "Publishing pipeline execution failed across all target adapters.",
        source: "PublishPipeline",
        rootCause: "Individual provider APIs rejected authentication, exceeded rate limits, or network timeouts fired.",
        suggestedFix: "Review diagnostic logs per platform and retry publication.",
        retryOption: true,
        payload: results,
        endpoint: "/api/publish",
      });
      return NextResponse.json({
        error: criticalErr.toJSON(),
        results,
        totalDurationMs: totalDuration,
      }, { status: 502 });
    }

    // Update Draft Status with comprehensive audit trail
    const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
    const updateUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/Drafts/${draftId}?updateMask.fieldPaths=status&updateMask.fieldPaths=publishedAt&updateMask.fieldPaths=publishResults&updateMask.fieldPaths=pipelineStage`;
    
    await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${sessionCookie}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          status: { stringValue: 'Published' },
          pipelineStage: { stringValue: 'Analytics & Logs' },
          publishedAt: { stringValue: new Date().toISOString() },
          publishResults: { stringValue: JSON.stringify(results) },
        },
      }),
    });

    return NextResponse.json({ success: true, results, totalDurationMs: Date.now() - requestStartTime });

  } catch (error: any) {
    console.error("Critical unhandled publish pipeline exception:", error);
    const fatalErr = BuildOSError.fromError(error, "PublishPipeline", {
      endpoint: "/api/publish",
      suggestedFix: "Inspect Firebase admin token verification and system environment parameters."
    });
    return NextResponse.json({ error: fatalErr.toJSON() }, { status: 500 });
  }
}

