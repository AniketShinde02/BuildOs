/**
 * GET /api/content/jobs/[id]/stream
 * 
 * Server-Sent Events endpoint. Replays persisted events first,
 * then streams live events as they arrive from ContentEventBus.
 * 
 * This means browser refresh ALWAYS recovers the full timeline.
 */
import { NextRequest, NextResponse } from "next/server";
import { ContentOperatingSystem } from "@/lib/studio/engine/v2/ContentOperatingSystem";
import { ContentEventBus } from "@/lib/studio/engine/v2/ContentEventBus";
import { ContentExecutionEvent } from "@/lib/studio/engine/v2/models/ContentExecutionEvent";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const job = ContentOperatingSystem.getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller may be closed already
        }
      };

      // 1. Replay all persisted events immediately (checkpoint recovery)
      const existingEvents = job.events || [];
      for (const event of existingEvents) {
        send({ type: 'event', data: event });
      }

      // If already terminal — just close
      if (job.status === 'READY' || job.status === 'FAILED') {
        send({ type: 'complete', jobId, status: job.status });
        controller.close();
        return;
      }

      // 2. Subscribe to live events
      const unsubscribe = ContentEventBus.subscribe(jobId, (event: ContentExecutionEvent) => {
        send({ type: 'event', data: event });
      });

      // 3. Subscribe to completion
      const bus = ContentEventBus.getOrCreate(jobId);
      const onComplete = () => {
        const finalJob = ContentOperatingSystem.getJob(jobId);
        send({ type: 'complete', jobId, status: finalJob?.status ?? 'READY' });
        try { controller.close(); } catch { /* already closed */ }
        unsubscribe();
      };
      bus.once('complete', onComplete);

      // 4. Heartbeat every 15s to keep connection alive
      const heartbeatId = setInterval(() => {
        send({ type: 'heartbeat', jobId, timestamp: Date.now() });
      }, 15_000);

      // 5. Cleanup on client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatId);
        unsubscribe();
        bus.off('complete', onComplete);
        try { controller.close(); } catch { /* already closed */ }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
