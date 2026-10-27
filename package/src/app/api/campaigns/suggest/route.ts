import { NextResponse } from 'next/server';
import { adminAuth } from "@/utils/firebase-admin";
import { cookies } from "next/headers";
import { generateContentWithFallback } from "@/lib/ai/gateway";
import { HumanizerEngine } from "@/lib/studio/pipeline/HumanizerEngine";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";

export async function GET(_req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("buildos-token")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    const userId = decodedToken.uid;

    const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    
    // 1. Fetch past drafts via REST API
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
    const queryPayload = {
      structuredQuery: {
        from: [{ collectionId: "Drafts" }],
        where: { fieldFilter: { field: { fieldPath: "userId" }, op: "EQUAL", value: { stringValue: userId } } },
        orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
        limit: { value: 10 }
      }
    };

    const [draftsRes, tavilyRes] = await Promise.all([
      fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionCookie}`, "Content-Type": "application/json" },
        body: JSON.stringify(queryPayload)
      }).catch(() => null),
      TAVILY_API_KEY ? fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: "trending developer tools AI architecture freelancing 2026",
          search_depth: "basic",
          max_results: 3
        })
      }).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null)
    ]);

    let pastTopics: string[] = [];
    if (draftsRes && draftsRes.ok) {
      const data = await draftsRes.json();
      pastTopics = data
        .filter((d: any) => d.document && d.document.fields)
        .map((d: any) => d.document.fields.topic?.stringValue || d.document.fields.idea?.stringValue)
        .filter(Boolean);
    }

    const trendingContext = tavilyRes?.results?.map((r: any) => r.title + ": " + r.content).join("\n") || "";

    const systemPrompt = `
You are an elite AI content strategist for an independent software engineer and AI builder.
${HumanizerEngine.getSystemPromptAddon()}

Based on their past topics:
${pastTopics.length ? pastTopics.join('\n') : 'Building AI tools, freelancing web apps, system architecture.'}

Live trending developer/tech context from Tavily research:
${trendingContext || 'AI agent automation, Next.js 15, local LLMs, micro-SaaS architecture'}

Generate 3 unique, highly specific, authentic campaign suggestions.
Format strictly as JSON:
{
  "suggestions": [
    {
      "topic": "Specific technical insight or real-world build topic",
      "audience": "Target audience (e.g. AI Engineers, Technical Founders, Freelancers)",
      "reason": "Why this specific topic builds massive market authority"
    }
  ]
}
`;

    // High-leverage fallback suggestions
    const defaultSuggestions = [
      {
        topic: "Architecture Breakdown: Building a Context-Aware LinkedIn Filter Using Local Embeddings and RAG",
        audience: "AI Engineers, Technical Founders, and Indie Hackers",
        reason: "Directly builds on ethical LinkedIn assistant concepts with hands-on technical depth."
      },
      {
        topic: "How I Landed Web Dev Clients by Offering AI Feature Upgrades (Code Breakdown + Outreach Framework)",
        audience: "Student Developers, Early-Career Freelancers, and Agency Owners",
        reason: "Merges freelancing experience with AI monetization, bridging student earning and client acquisition."
      },
      {
        topic: "The Anti-Spam Playbook: Replacing Ruthless Outbound Automation with AI-Assisted Intent Detection",
        audience: "Solopreneurs, B2B Founders, and Growth Operators",
        reason: "Delivers a counter-intuitive opinion piece that critiques low-quality bots while proposing thoughtful human-in-the-loop systems."
      }
    ];

    // Wrap the AI call in a Promise.race to enforce sub-second navigation SLA
    const aiPromise = generateContentWithFallback({
      systemInstruction: "You are an expert content strategist outputting strict JSON.",
      prompt: systemPrompt,
      responseMimeType: "application/json",
      requiredCapability: 'STRUCTURED_CONTENT'
    });

    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
    
    const rawText = await Promise.race([aiPromise, timeoutPromise]);

    if (rawText) {
      try {
        const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanedJson);
        if (data && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          return NextResponse.json(data);
        }
      } catch {
        console.warn("[campaigns/suggest] JSON parse failed, returning fallback suggestions.");
      }
    } else {
       console.log("[campaigns/suggest] AI generation exceeded 1500ms or returned null. Serving cached/default suggestions instantly.");
    }

    return NextResponse.json({ suggestions: defaultSuggestions });

  } catch (error: any) {
    console.error("Error suggesting campaigns:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
