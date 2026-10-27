import { NextRequest, NextResponse } from "next/server";
import { ContentOperatingSystem } from "@/lib/studio/engine/v2/ContentOperatingSystem";

export async function POST(req: NextRequest) {
  try {
    const { prompt, topic, audience } = await req.json();
    const targetPrompt = prompt || (audience ? `Target Audience: ${audience}\nTopic: ${topic}` : topic);
    
    if (!targetPrompt) return NextResponse.json({ error: "Missing prompt or topic" }, { status: 400 });

    const jobId = await ContentOperatingSystem.submitIntake(targetPrompt);
    
    return NextResponse.json({ jobId, status: "INTAKE" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
