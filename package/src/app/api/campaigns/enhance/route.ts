import { NextResponse } from 'next/server';
import { adminAuth } from "@/utils/firebase-admin";
import { cookies } from "next/headers";
import { generateContentWithFallback } from "@/lib/utils/aiFallback";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("buildos-token")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    await adminAuth.verifyIdToken(sessionCookie);

    const { query, audience } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    /**
     * TOPIC FIDELITY CONTRACT (per architecture mandate):
     * 
     * The enhanced topic MUST preserve:
     * - Core topic, user intent, audience, timeframe, domain, questions, scope, perspective
     * 
     * It MAY improve:
     * - Clarity, grammar, specificity, structure, research framing
     * 
     * It MUST NOT invent:
     * - Personal experiences, tools, habits, metrics, claims, anecdotes, first-person stories
     *   unless the user explicitly supplied them.
     * 
     * SEMANTIC DRIFT: If the enhanced topic changes the core subject matter, it is REJECTED.
     */
    const systemInstruction = `You are a content clarity editor, NOT a creative rewriter.

YOUR ONLY JOB: Improve the specificity and clarity of the user's topic without changing what it is about.

STRICT RULES:
1. The core subject must remain IDENTICAL. If the user asks about "skills for designers in 2026", the output must be about "skills for designers in 2026" — not about "my personal AI radar" or "what I unlearned".
2. Do NOT invent personal anecdotes, habits, tools, metrics, or first-person experiences unless the user's input contains them.
3. Do NOT change the perspective (e.g., do NOT convert a question into a personal story).
4. Do NOT add made-up specificity (e.g., "15-minute daily ritual" when user never mentioned this).
5. You may: improve grammar, add context, sharpen the angle, specify the audience, remove vagueness.
6. If you cannot improve it without changing its meaning, return the original topic verbatim.

OUTPUT: Strict JSON only. No explanation. No markdown.
{
  "originalTopic": "<exact original>",
  "enhancedTopic": "<improved but semantically identical topic>",
  "enhancedAudience": "<refined audience>",
  "changesMade": ["list of specific improvements made"],
  "preservedIntent": "one sentence confirming the core intent is preserved"
}`;

    const userPrompt = `
Original Topic: "${query}"
Target Audience: "${audience || 'General Tech Audience'}"

Enhance the topic for clarity and specificity while strictly preserving its core meaning and user intent.`;

    const rawText = await generateContentWithFallback({
      systemInstruction,
      prompt: userPrompt,
      responseMimeType: "application/json",
      requiredCapability: 'STRUCTURED_CONTENT',
    });

    if (rawText) {
      try {
        const cleanedJson = rawText.replace(/```json\n?|\n?```/gi, '').trim();
        const data = JSON.parse(cleanedJson);
        
        if (data?.enhancedTopic) {
          // Semantic drift guard: ensure the topic hasn't been completely rewritten.
          // Simple heuristic: the enhanced topic must share at least 2 key words with the original.
          const originalWords = new Set(query.toLowerCase().match(/\b\w{4,}\b/g) || []);
          const enhancedWords = new Set(data.enhancedTopic.toLowerCase().match(/\b\w{4,}\b/g) || []);
          const overlap = Array.from(originalWords).filter(w => enhancedWords.has(w));

          if (overlap.length >= 2) {
            return NextResponse.json({
              enhancedQuery: data.enhancedTopic,
              enhancedAudience: data.enhancedAudience || audience || 'Founders, Engineers, and Indie Hackers',
              originalQuery: data.originalTopic,
              changesMade: data.changesMade || [],
              preservedIntent: data.preservedIntent || '',
            });
          } else {
            // Semantic drift detected — return original topic untouched
            console.warn('[campaigns/enhance] Semantic drift detected. Returning original topic.');
            return NextResponse.json({
              enhancedQuery: query,
              enhancedAudience: audience || 'Founders, Engineers, and Indie Hackers',
              originalQuery: query,
              changesMade: [],
              preservedIntent: 'Enhancement rejected — semantic drift detected. Original topic preserved.',
            });
          }
        }
      } catch {
        console.warn("[campaigns/enhance] JSON parse failed, returning original.");
      }
    }

    // If AI fails entirely: return original topic. Do NOT invent anything.
    return NextResponse.json({
      enhancedQuery: query,
      enhancedAudience: audience && audience.length > 3 ? audience : "Founders, Engineers, and Indie Hackers",
      originalQuery: query,
      changesMade: [],
      preservedIntent: 'AI unavailable. Original topic preserved.',
    });

  } catch (error: any) {
    console.error("Error enhancing campaign query:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
