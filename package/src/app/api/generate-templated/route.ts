import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cookies } from "next/headers";
import { adminAuth } from "@/utils/firebase-admin";
import { addDocAsUser, getDocAsUser } from "@/utils/firestore-rest";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const TEMPLATED_API_KEY = process.env.TEMPLATED_API_KEY || "";

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
    const { templateId, topic } = body;

    if (!templateId) {
      return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
    }

    if (!TEMPLATED_API_KEY) {
      return NextResponse.json({ error: "Missing Templated.io API Key in env" }, { status: 500 });
    }

    // 1. Fetch Template Layers
    const layersRes = await fetch(`https://api.templated.io/v1/template/${templateId}/layers`, {
      headers: { Authorization: `Bearer ${TEMPLATED_API_KEY}` }
    });
    
    if (!layersRes.ok) {
      return NextResponse.json({ error: "Failed to fetch template layers from Templated.io" }, { status: 500 });
    }
    
    const layers = await layersRes.json();
    
    // Filter editable layers (text and non-logo images)
    const editableLayers = layers.filter((l: any) => l.type === 'text' || (l.type === 'image' && !l.layer.toLowerCase().includes('logo')));

    // 2. Fetch user's saved tone/style from settings via REST API
    const settingsData = await getDocAsUser(sessionCookie, 'settings', verifiedUserId);
    const userTone = settingsData?.tone || '';

    // 3. Generate a 6-Slide Carousel via Gemini
    const systemPrompt = `
      ROLE: You are a ghostwriter creating a LinkedIn carousel for a specific engineer.
      
      ABOUT THE AUTHOR:
      - Final-year AIML student and freelance Shopify/Next.js developer
      - Builds AI automation, MCP servers, developer tools
      - Style: ${userTone || 'Honest, technical, practical. Shows real lessons, not generic advice. Never sounds like a LinkedIn influencer.'}
      
      OBJECTIVE: Generate exactly 6 distinct slides for a LinkedIn carousel about: "${topic || 'General entrepreneurship and AI automation'}".
      
      CAROUSEL STRUCTURE (one slide per item):
      1. Hook — Attention-grabbing opening claim or question
      2. Problem — What is broken or misunderstood
      3. Context — Why this matters, background
      4. Solution — The actual fix or insight
      5. Evidence — Specific example, code, or screenshot prompt
      6. CTA — What should the reader do or think next

      TEMPLATE LAYERS: ${JSON.stringify(editableLayers)}
      
      RULES:
      - Return an array of exactly 6 JSON objects (one for each slide).
      - Each object must map the layer name to its new content (text or image_url).
      - Maintain character counts roughly matching the default layer text.
      - Output strictly as JSON array of 6 objects.
    `;

    // 3. Generate a 6-Slide Carousel via Gemini with Fallback Models
    const modelsToTry = ["gemini-3.8-flash", "gemini-1.5-flash"];
    let result = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
        result = await model.generateContent(systemPrompt);
        if (result && result.response.text()) {
          console.log(`[generate-templated] Successfully generated using ${modelName}`);
          break; 
        }
      } catch (err: any) {
        console.warn(`[generate-templated] Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    if (!result) {
      throw new Error(`All Gemini models failed. Last error: ${lastError?.message}`);
    }

    let rawText = result.response.text();
    // Sanitize any markdown code blocks Gemini might accidentally include
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    let slides;
    try {
      slides = JSON.parse(rawText);
    } catch {
      console.error("Failed to parse Gemini output:", rawText);
      throw new Error("AI returned invalid JSON format.");
    }

    if (!Array.isArray(slides) || slides.length === 0) {
      throw new Error("Failed to generate slides array from Gemini.");
    }

    // 4. Render all 6 slides via Templated API
    const renderedUrls: string[] = [];
    const allLayersPayloads: any[] = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const layerPayload: any = {};
      
      Object.keys(slide).forEach(key => {
        const layerInfo = editableLayers.find((l: any) => l.layer === key);
        if (layerInfo) {
          if (layerInfo.type === 'text') layerPayload[key] = { text: slide[key] };
          if (layerInfo.type === 'image') layerPayload[key] = { image_url: slide[key] };
        }
      });
      
      allLayersPayloads.push(layerPayload);

      const renderRes = await fetch("https://api.templated.io/v1/render", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TEMPLATED_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: templateId,
          layers: layerPayload
        })
      });

      if (renderRes.ok) {
        const renderData = await renderRes.json();
        if (Array.isArray(renderData)) {
          const pageIndex = Math.min(i, renderData.length - 1);
          renderedUrls.push(renderData[pageIndex].render_url);
        } else {
          renderedUrls.push(renderData?.render_url);
        }
      }
    }

    if (renderedUrls.length === 0) {
      throw new Error("Failed to render any slides via Templated API.");
    }

    // 5. Save to Firestore via REST API (authenticated as the user)
    const draftContent = slides.map((s: any, idx: number) => `--- Slide ${idx + 1} ---\n${JSON.stringify(s, null, 2)}`).join('\n\n');

    await addDocAsUser(sessionCookie, 'Drafts', {
      userId: verifiedUserId,
      topic: topic || "Templated Carousel Post",
      name: `AI Carousel (${renderedUrls.length} slides)`,
      text: draftContent,
      imageUrls: renderedUrls,
      status: "Draft",
      source: "Templated.io",
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, count: renderedUrls.length, urls: renderedUrls });

  } catch (error: any) {
    console.error("Error generating carousel:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
