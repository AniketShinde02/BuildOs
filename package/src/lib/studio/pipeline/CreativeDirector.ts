'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const XAI_API_KEY = process.env.XAI_API_KEY || "";
const SENSENOVA_API_KEY = process.env.SENSENOVA_API_KEY || "";

export type DesignType = 'infographic' | 'quote' | 'banner' | 'carousel';

export interface CreativeBrief {
  prompt: string;
  hook: string;
  points: string[];
  quoteText?: string;
  authorName?: string;
  type: DesignType;
  marketingGoal: string;
  audience: string;
  platform: string;
  emotionalPsychology: string;
}

export async function draftBrief(prompt: string, platformContext: string): Promise<CreativeBrief> {
  const systemPrompt = `
You are the AI Creative Director of a Canva-tier design studio.
Your job is to analyze a raw idea and turn it into a deeply strategic Creative Brief for a senior Graphic Designer.

Output strictly valid JSON with NO markdown blocks and NO formatting outside the JSON:
{
  "type": "infographic" | "quote" | "banner" | "carousel",
  "hook": "High-conversion title or hook (max 10 words)",
  "points": ["List of 3-5 concise bullet points, max 8 words each (leave empty if not needed)"],
  "quoteText": "If this is a quote format, extract the core quote",
  "authorName": "Author of the quote if applicable",
  "marketingGoal": "What should the user do after seeing this? (e.g., 'Click link in bio', 'Save for later', 'Feel inspired')",
  "audience": "Who is this for? (e.g., 'SaaS Founders', 'Senior Developers', 'Designers')",
  "platform": "${platformContext}",
  "emotionalPsychology": "What emotion should this create? (e.g., 'Urgency', 'Calm', 'Authority', 'Playful')"
}`;

  let rawText = "";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash", generationConfig: { responseMimeType: "application/json" } });
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `Raw Idea: ${prompt}` }
    ]);
    
    if (result && result.response.text()) {
      rawText = result.response.text();
    }
  } catch (err) {
    console.warn("Gemini CreativeDirector failed, trying Grok...", err);
  }

  // Fallback to SenseNova
  if (!rawText && SENSENOVA_API_KEY) {
    try {
      const snRes = await fetch("https://token.sensenova.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SENSENOVA_API_KEY}` },
        body: JSON.stringify({
          model: "sensenova-6.8-flash-lite",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Raw Idea: ${prompt}` }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (snRes.ok) {
        const snData = await snRes.json();
        rawText = snData.choices?.[0]?.message?.content || "";
      }
    } catch (err) {
      console.error("SenseNova CreativeDirector fallback failed", err);
    }
  }

  // Fallback to Grok
  if (!rawText && XAI_API_KEY) {
    try {
      const xaiRes = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${XAI_API_KEY}` },
        body: JSON.stringify({
          model: "grok-2-latest",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Raw Idea: ${prompt}` }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (xaiRes.ok) {
        const xaiData = await xaiRes.json();
        rawText = xaiData.choices?.[0]?.message?.content || "";
      }
    } catch (err) {
      console.error("Grok CreativeDirector fallback failed", err);
    }
  }

  // Final fallback (if everything fails)
  if (!rawText) {
    return {
      prompt,
      hook: "Building Systems That Scale",
      points: ["Write code once", "Automate the rest", "Ship faster"],
      type: "infographic",
      marketingGoal: "Build authority",
      audience: "General audience",
      platform: platformContext,
      emotionalPsychology: "Authority"
    };
  }

  try {
    let cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    // In case the LLM added extra conversational text before or after the JSON:
    const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanJson = jsonMatch[0];
    }
    const parsed = JSON.parse(cleanJson);
    return {
      prompt,
      hook: parsed.hook || "Generated Title",
      points: parsed.points || [],
      quoteText: parsed.quoteText || "",
      authorName: parsed.authorName || "Aniket Shinde",
      type: parsed.type || "infographic",
      marketingGoal: parsed.marketingGoal || "Engagement",
      audience: parsed.audience || "General",
      platform: parsed.platform || platformContext,
      emotionalPsychology: parsed.emotionalPsychology || "Authority"
    };
  } catch (e) {
    console.error("Failed to parse CreativeDirector output", e, "Raw:", rawText);
    return {
      prompt,
      hook: "Fallback Hook",
      points: ["Fallback point"],
      type: "infographic",
      marketingGoal: "Engagement",
      audience: "General",
      platform: platformContext,
      emotionalPsychology: "Neutral"
    };
  }
}
