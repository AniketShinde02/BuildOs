/**
 * GET  /api/content/jobs/[id]  — Full job state snapshot
 * POST /api/content/jobs/[id]/approve — Resume pipeline past approval gate
 * POST /api/content/jobs/[id]/reject  — Cancel job at approval gate
 */
import { NextRequest, NextResponse } from "next/server";
import { ContentOperatingSystem } from "@/lib/studio/engine/v2/ContentOperatingSystem";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = ContentOperatingSystem.getJob(id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json(job);
}
