/**
 * POST /api/content/jobs/[id]/approve
 * Body: { modifications?: string }
 * 
 * Resumes the pipeline past the WAITING_FOR_APPROVAL gate.
 */
import { NextRequest, NextResponse } from "next/server";
import { ContentOperatingSystem } from "@/lib/studio/engine/v2/ContentOperatingSystem";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json().catch(() => ({}));
  const modifications: string | undefined = body.modifications;
  const { id } = await params;
  const approved = ContentOperatingSystem.approveJob(id, modifications);

  if (!approved) {
    return NextResponse.json(
      { error: "Job not found or not waiting for approval" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, jobId: id, modifications });
}
