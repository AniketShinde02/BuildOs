'use server';

import { generateContentWithFallback } from '@/lib/ai/gateway';

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
    const result = await generateContentWithFallback({
      systemInstruction: systemPrompt,
      prompt: `Raw Idea: ${prompt}`,
      responseMimeType: "application/json",
      requiredCapability: 'STRUCTURED_CONTENT'
    });
    
    if (result) {
      rawText = result;
    }
  } catch (err) {
    console.error("CreativeDirector generation failed", err);
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
