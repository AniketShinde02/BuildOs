import { NextRequest, NextResponse } from "next/server";
import { ContentOperatingSystem } from "@/lib/studio/engine/v2/ContentOperatingSystem";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) return NextResponse.json({ error: "Missing job ID" }, { status: 400 });

  const job = ContentOperatingSystem.getJob(id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json(job);
}
