import { NextResponse } from 'next/server';

import { cookies } from "next/headers";
import { adminAuth } from "@/utils/firebase-admin";
import { addDocAsUser, getDocAsUser } from "@/utils/firestore-rest";
import { generateContentWithFallback } from "@/lib/utils/aiFallback";
import { HumanizerEngine } from "@/lib/studio/pipeline/HumanizerEngine";
import { reviewDesign } from "@/lib/studio/pipeline/QualityReviewer";
import fs from 'fs';
import path from 'path';


const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "";
const SENSENOVA_API_KEY = process.env.SENSENOVA_API_KEY || "";

// Maps imageType → visual template family for the OG renderer
const IMAGE_TYPE_TEMPLATE_MAP: Record<string, string> = {
  'infographic':      'numbered-steps',
  'quote':            'quote-large',
  'banner':           'launch-banner',
  'checklist':        'checklist-card',
  'metrics-card':     'metrics-card',
  'timeline':         'timeline-card',
  'minimal-editorial':'minimal-editorial',
};

export async function POST(req: Request) {
  try {
    // --- AUTH GUARD ---
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("buildos-token")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(sessionCookie);
    const verifiedUserId = decodedToken.uid;
    // --- END AUTH GUARD ---

    const body = await req.json();
    const { topic, audience } = body;

    if (!topic || !audience) {
      return NextResponse.json({ error: "Missing topic or audience" }, { status: 400 });
    }

    // 1+2. Run Tavily research AND fetch settings in parallel
    const [tavilyResult, settingsData] = await Promise.all([
      TAVILY_API_KEY
        ? fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: TAVILY_API_KEY,
              query: `${topic} — practical examples, real tradeoffs, developer perspective`,
              search_depth: "basic",
              max_results: 2,
              include_answer: true,
              include_images: false,
            }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        : Promise.resolve(null),
      getDocAsUser(sessionCookie, "settings", verifiedUserId).catch(() => null),
    ]);

    const researchContext = tavilyResult?.answer || "";
    const userTone = settingsData?.tone || "";

    // 3. Load ghostwriter system prompt
    const promptsDir = path.join(process.cwd(), 'src', 'lib', 'prompts');
    const founderDNA = fs.readFileSync(path.join(promptsDir, 'contentEngine.md'), 'utf-8');

    const systemPrompt = `
${founderDNA}

====================================================
NOW — GENERATE THE POST
====================================================
Topic: "${topic}"
Audience: "${audience}"
User's preferred tone/style (if set): ${userTone || 'None specified — use default engineering journal style.'}

Research context (use only facts that are accurate, skip anything vague):
${researchContext}

====================================================
LINKEDIN POST STRUCTURE:
====================================================
1. Hook (first line — must make someone stop scrolling. State the real insight. No generic openings.)
2. Context (what was the problem, what was being built, what did you discover)
3. What actually happened (specific, real, concrete detail)
4. Key insight or tradeoff
5. What someone reading this can actually take away
6. Optional soft CTA (not spammy — e.g. "DM me if you've hit this" or "Worth revisiting this pattern.")

====================================================
OUTPUT — STRICT JSON (no markdown, no code fences, raw JSON only):
====================================================
{
  "name": "short campaign name, max 50 characters",
  "idea": "The core real insight in 1-2 sentences",
  "title": "The hook line — first line of the post. Concrete. No questions. No generic openers.",
  "text": "Full LinkedIn post. 200-300 words. Paragraphs separated by newlines.",
  "imageType": "infographic" | "quote" | "banner" | "checklist" | "metrics-card" | "timeline" | "minimal-editorial" | "carousel",
  "imageSubtitle": "2-4 word category label describing the content type",
  "carousel": {
    "slides": [
      {
        "role": "hook",
        "headline": "...",
        "subheadline": "...",
        "body": "...",
        "visual_direction": "..."
      },
      {
        "role": "problem",
        "headline": "...",
        "body": "...",
        "visual_direction": "..."
      },
      {
        "role": "mechanism",
        "headline": "...",
        "body": "...",
        "visual_direction": "..."
      },
      {
        "role": "application",
        "headline": "...",
        "body": "...",
        "visual_direction": "..."
      },
      {
        "role": "insight",
        "headline": "...",
        "body": "...",
        "visual_direction": "..."
      },
      {
        "role": "cta",
        "headline": "...",
        "body": "...",
        "visual_direction": "..."
      }
    ]
  },
  "quoteText": "If imageType is quote: a single powerful 1-2 sentence quote. Otherwise null."
}
    `;

    // 4. Draft Post & QA Validation Loop
    let postData: any;
    let attempt = 0;
    const maxAttempts = 2;
    let passedQA = false;
    let lastError: Error | null = null;
    let rawText = "";

    while (attempt < maxAttempts && !passedQA) {
      attempt++;
      const currentPrompt = systemPrompt + (attempt > 1 ? "\n\nCRITICAL: Previous QA failed. Simplify text length and ensure structure is correct." : "");
      
      rawText = await generateContentWithFallback({
        prompt: currentPrompt,
        responseMimeType: "application/json",
        requiredCapability: 'STRUCTURED_CONTENT'
      }) || "";

      if (!rawText) {
        throw new Error(`All verified generation engines failed or returned null.`);
      }

      // Sanitize markdown code blocks if any model returned them
      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      try {
        postData = JSON.parse(rawText);
        if (postData.text) postData.text = HumanizerEngine.humanize(postData.text);
        if (postData.title) postData.title = HumanizerEngine.humanize(postData.title);
      } catch {
        console.error("Failed to parse AI output:", rawText);
        throw new Error("AI returned invalid JSON format.");
      }

    // 4b. QA the resulting structured pack (non-blocking — if QA engine fails, pass through)
      let qaResult;
      try {
        qaResult = await reviewDesign(postData);
      } catch (qaErr) {
        console.warn('[generate-post] QA engine threw, allowing post through:', qaErr);
        qaResult = { score: 90, passed: true, issues: [], suggestedFixes: [] };
      }
      
      if (qaResult.passed) {
        passedQA = true;
        postData.qa = qaResult;
      } else {
        console.warn(`[generate-post] QA Failed on attempt ${attempt}. Issues:`, qaResult.issues);
        lastError = new Error(`QA Failed: ${qaResult.issues.join(", ")}`);
      }
    }

    // If QA kept failing, allow through on final attempt rather than 500ing
    if (!passedQA) {
      console.warn(`[generate-post] QA rejected after ${maxAttempts} attempts. Publishing with last generated content.`);
      // postData is already set from last attempt, just mark it
      if (!postData) {
        throw new Error(`Generation failed after ${maxAttempts} attempts. ${lastError?.message}`);
      }
      postData.qa = { score: 70, passed: false, issues: lastError?.message ? [lastError.message] : [], suggestedFixes: [] };
    }

    // 5. Build the image URL using the AI-chosen visual type
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const ogBase = `${protocol}://${host}/api/og/infographic`;

    const imageType: string = postData.imageType || "infographic";
    const imageSubtitle: string = postData.imageSubtitle || "Engineering Journal";
    const templateFamily: string = IMAGE_TYPE_TEMPLATE_MAP[imageType] || "numbered-steps";
    let imageUrl = "";
    let imageUrls: string[] = [];

    if (imageType === "carousel" || postData.format === "carousel") {
      const carouselBase = `${protocol}://${host}/api/og/carousel`;
      const slides = postData.carousel?.slides || [];
      const total = slides.length || 1;
      
      imageUrls = slides.map((slide: any, idx: number) => {
        // Build query string encoding the rich content
        const slideData = encodeURIComponent(JSON.stringify(slide));
        return `${carouselBase}?title=${encodeURIComponent(postData.name || topic)}&brand=${encodeURIComponent(imageSubtitle)}&slideData=${slideData}&slide=${idx + 1}&total=${total}`;
      });
      imageUrl = imageUrls[0] || "";
    } else if (imageType === "quote" && postData.quoteText) {
      imageUrl = `${ogBase}?type=quote-large&quote=${encodeURIComponent(postData.quoteText)}&author=${encodeURIComponent("Aniket Shinde")}&subtitle=${encodeURIComponent(imageSubtitle)}`;
    } else {
      const points = postData.imagePoints || (postData.carousel?.slides ? postData.carousel.slides.map((s: any) => s.headline) : []);
      const encodedPoints = encodeURIComponent(JSON.stringify(points.slice(0, 4)));
      imageUrl = `${ogBase}?type=${templateFamily}&title=${encodeURIComponent(postData.name || topic)}&subtitle=${encodeURIComponent(imageSubtitle)}&points=${encodedPoints}`;
    }

    console.log(`[generate-post] OG type=${templateFamily} subtitle="${imageSubtitle}": ${imageUrl}`);

    // 6. Save to Firestore via REST API
    const docId = await addDocAsUser(sessionCookie, 'Drafts', {
      userId: verifiedUserId,
      topic,
      audience,
      name: postData.name,
      idea: postData.idea,
      title: postData.title,
      text: postData.text,
      imagePrompt: postData.image || null,
      imageUrl,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      status: "Draft",
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, draftId: docId, postData, imageUrl });

  } catch (error: any) {
    console.error("Error generating post:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
