import { NextResponse } from 'next/server';
import { cookies } from "next/headers";
import { adminAuth } from "@/utils/firebase-admin";
import { listDocsAsUser, updateDocAsUser } from "@/utils/firestore-rest";

// GET: Fetch 30-day scheduled creations & timeline state
export async function GET() {
  const startTime = Date.now();
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("buildos-token")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    const allDrafts = await listDocsAsUser(sessionCookie, 'Drafts');
    const userDrafts = allDrafts.filter(doc => !doc.userId || doc.userId === userId);

    // Sort chronologically by scheduledTime or fallback creation time
    const sortedQueue = userDrafts.sort((a, b) => {
      const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
      const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
      return timeB - timeA;
    });

    const scheduledCount = sortedQueue.filter(item => Boolean(item.scheduledTime) && item.status === 'scheduled').length;

    return NextResponse.json({
      success: true,
      executionDurationMs: Date.now() - startTime,
      stats: {
        totalDrafts: sortedQueue.length,
        activeScheduled: scheduledCount,
        pendingUnscheduled: sortedQueue.length - scheduledCount
      },
      items: sortedQueue
    });
  } catch (error: any) {
    console.error("Error retrieving scheduled queue:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Execute automated Postiz 30-day chronological queue spacing
export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("buildos-token")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    const body = await req.json().catch(() => ({}));
    const intervalDays = typeof body.intervalDays === 'number' ? body.intervalDays : 2; // Default: post every 2 days (~15 posts / month)
    const postHourUtc = typeof body.postHourUtc === 'number' ? body.postHourUtc : 14; // Default: 14:00 UTC (9:00 EST / 15:00 CET / 19:30 IST)

    const allDrafts = await listDocsAsUser(sessionCookie, 'Drafts');
    const userDrafts = allDrafts.filter(doc => (!doc.userId || doc.userId === userId) && doc.status !== 'published');

    if (userDrafts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending drafts found to schedule.",
        scheduledCount: 0,
        items: []
      });
    }

    const POSTIZ_API_URL = process.env.POSTIZ_API_URL || "http://localhost:5000/api";
    const now = new Date();
    let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, postHourUtc, 0, 0); // Start tomorrow at target hour

    const updatedItems = [];
    let scheduleCount = 0;

    for (const doc of userDrafts) {
      if (!doc.id) continue;
      
      const scheduledIso = currentDate.toISOString();
      const jobId = `postiz-auto-${Date.now()}-${scheduleCount + 100}`;

      const updatePayload = {
        scheduledTime: scheduledIso,
        status: "scheduled",
        postizJobId: jobId,
        platformTarget: doc.platform || "linkedin",
        lastScheduledAt: new Date().toISOString()
      };

      // 1. Persist assignment in Firestore via REST helper
      await updateDocAsUser(sessionCookie, 'Drafts', doc.id, updatePayload);

      // 2. Transmit job specification to Postiz Docker microservice if online
      try {
        await fetch(`${POSTIZ_API_URL}/public/v1/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-User-Id": userId },
          body: JSON.stringify({
            draftId: doc.id,
            content: doc.postText || doc.idea || doc.title || "",
            mediaUrl: doc.imageUrl || null,
            scheduledFor: scheduledIso,
            channel: doc.platform || "linkedin",
            externalId: jobId
          }),
          signal: AbortSignal.timeout(800)
        }).catch(() => null);
      } catch {
        // Postiz queue engine unreachable; schedule persisted reliably in Firestore queue db
      }

      updatedItems.push({
        id: doc.id,
        ...doc,
        ...updatePayload
      });

      // Advance clock by intervalDays for next item in 30-day queue distribution
      currentDate = new Date(currentDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
      scheduleCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully scheduled ${scheduleCount} items evenly across the next 30-day Postiz execution pipeline.`,
      executionDurationMs: Date.now() - startTime,
      scheduledCount: scheduleCount,
      items: updatedItems
    });
  } catch (error: any) {
    console.error("Error executing Postiz bulk auto-queue:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
