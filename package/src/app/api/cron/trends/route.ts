import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Use Node.js for backend scheduled jobs

export async function GET(request: Request) {
  try {
    // 1. Verify cron secret to prevent unauthorized execution
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Trend Engine Logic: Fetch top posts across platforms
    console.log("Running Trend Engine Automation...");
    
    const simulatedTrends = [
      {
        topic: "AI Agents vs Wrappers",
        velocity: "high",
        format: "carousel",
        timestamp: new Date().toISOString()
      },
      {
        topic: "Solopreneur MRR Milestones",
        velocity: "medium",
        format: "quote",
        timestamp: new Date().toISOString()
      }
    ];

    // 3. Save trends via Firestore REST API
    const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (PROJECT_ID) {
      for (const trend of simulatedTrends) {
        await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/GlobalTrends`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              topic: { stringValue: trend.topic },
              velocity: { stringValue: trend.velocity },
              format: { stringValue: trend.format },
              timestamp: { stringValue: trend.timestamp }
            }
          })
        }).catch(err => console.error("Error writing trend to Firestore REST API:", err));
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Trend Engine updated successfully',
      trendsAnalyzed: simulatedTrends.length
    });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
